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

  const handleDelete = (item: TrashItem) => {
    Alert.alert(
      'Suppression définitive',
      'Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => deletePerm.mutate(item.id) },
      ]
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Stack.Screen options={{
        headerShown: true,
        headerTitle: 'Corbeille',
        headerStyle: { backgroundColor: theme.bgCard },
        headerTintColor: theme.text,
      }} />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.brand[600]} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🗑️</Text>
          <Text style={[styles.empty, { color: theme.textMuted }]}>La corbeille est vide</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const name = item.file?.name ?? item.folder?.name ?? '?'
            const emoji = item.file ? getMimeEmoji(item.file.mimeType) : '📁'

            return (
              <View style={[styles.row, { borderBottomColor: theme.border }]}>
                <Text style={styles.emoji}>{emoji}</Text>
                <View style={styles.info}>
                  <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{name}</Text>
                  <Text style={[styles.date, { color: theme.textMuted }]}>
                    Supprimé {formatDate(item.deletedAt)}
                  </Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={() => restore.mutate(item.id)}
                    style={[styles.btn, { borderColor: Colors.brand[600] }]}
                  >
                    <Text style={{ color: Colors.brand[600], fontSize: 12, fontWeight: '600' }}>↩ Restaurer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(item)}
                    style={[styles.btn, { borderColor: Colors.red[500] }]}
                  >
                    <Text style={{ color: Colors.red[500], fontSize: 12, fontWeight: '600' }}>✕ Supprimer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { fontSize: 15, fontWeight: '500' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  emoji: { fontSize: 24, width: 32, textAlign: 'center' },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 14, fontWeight: '500' },
  date: { fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 6 },
  btn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
})
