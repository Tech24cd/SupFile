import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native'
import { Stack } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTheme } from '@/hooks/useTheme'
import { fileService } from '@/services'
import { Colors } from '@/utils/colors'
import { formatDate, getMimeEmoji } from '@/utils/files'
import type { TrashItem } from '@/types'

export default function TrashScreen() {
  const { theme } = useTheme()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['trash'],
    queryFn: fileService.trash,
  })

  const restore = useMutation({
    mutationFn: (id: string) => fileService.restore(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trash'] }),
  })

  const deletePerm = useMutation({
    mutationFn: (id: string) => fileService.deletePermanently(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trash'] }),
  })

  const items: TrashItem[] = data?.data?.items ?? []

  const confirmDelete = (item: TrashItem) => {
    Alert.alert(
      'Suppression définitive',
      'Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer définitivement', style: 'destructive', onPress: () => deletePerm.mutate(item.id) },
      ]
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Stack.Screen options={{
        headerShown: true,
        headerTitle: items.length > 0 ? `Corbeille (${items.length})` : 'Corbeille',
        headerStyle: { backgroundColor: theme.bgCard },
        headerTintColor: theme.text,
      }} />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.brand[600]} size="large" />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 64, marginBottom: 16 }}>🗑️</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Corbeille vide</Text>
          <Text style={[styles.emptySub, { color: theme.textMuted }]}>Les fichiers supprimés apparaissent ici</Text>
        </View>
      ) : (
        <>
          <View style={styles.warning}>
            <Text style={styles.warningText}>⚠️ Les suppressions définitives sont irréversibles</Text>
          </View>
          <FlatList
            data={items}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingVertical: 8 }}
            renderItem={({ item }) => {
              const name = item.file?.name ?? item.folder?.name ?? 'Élément inconnu'
              const emoji = item.file ? getMimeEmoji(item.file.mimeType) : '📁'
              return (
                <View style={[styles.row, { borderBottomColor: theme.border }]}>
                  <View style={[styles.iconWrap, { backgroundColor: Colors.gray[100] }]}>
                    <Text style={styles.icon}>{emoji}</Text>
                  </View>
                  <View style={styles.info}>
                    <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{name}</Text>
                    <Text style={[styles.date, { color: theme.textMuted }]}>Supprimé le {formatDate(item.deletedAt)}</Text>
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity onPress={() => restore.mutate(item.id)} style={[styles.actionBtn, { backgroundColor: Colors.brand[600] }]}>
                      <Text style={styles.actionText}>↩ Restaurer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmDelete(item)} style={[styles.actionBtn, { backgroundColor: Colors.red[500] }]}>
                      <Text style={styles.actionText}>🗑 Suppr.</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            }}
          />
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center' },
  warning: { margin: 12, padding: 12, borderRadius: 12, backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#f59e0b' },
  warningText: { color: '#92400e', fontSize: 13, fontWeight: '500' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 22 },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 14, fontWeight: '600' },
  date: { fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'column', gap: 6 },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  actionText: { color: '#fff', fontSize: 11, fontWeight: '700' },
})
