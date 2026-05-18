import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Share,
} from 'react-native'
import { Stack } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTheme } from '@/hooks/useTheme'
import { shareService } from '@/services'
import { Colors } from '@/utils/colors'
import { formatDate } from '@/utils/files'
import { API_URL } from '@/services/api'

export default function ShareScreen() {
  const { theme } = useTheme()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['shares'],
    queryFn: shareService.list,
  })

  const deleteLink = useMutation({
    mutationFn: (token: string) => shareService.delete(token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shares'] }),
  })

  const links = data?.data?.links ?? []

  const copyLink = async (token: string) => {
    const url = `${API_URL}/s/${token}`
    await Share.share({ message: url, url })
  }

  const handleDelete = (token: string) => {
    Alert.alert('Supprimer le lien ?', 'Le lien ne sera plus accessible.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteLink.mutate(token) },
    ])
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Stack.Screen options={{
        headerShown: true,
        headerTitle: 'Partages',
        headerStyle: { backgroundColor: theme.bgCard },
        headerTintColor: theme.text,
      }} />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.brand[600]} />
        </View>
      ) : links.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🔗</Text>
          <Text style={[styles.empty, { color: theme.textMuted }]}>Aucun lien actif</Text>
          <Text style={[{ fontSize: 13, color: theme.textMuted, marginTop: 4, textAlign: 'center', paddingHorizontal: 32 }]}>
            Appui long sur un fichier dans le gestionnaire pour le partager
          </Text>
        </View>
      ) : (
        <FlatList
          data={links}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => {
            const name = item.file?.name ?? item.folder?.name ?? 'Élément'
            const isExpired = item.expiresAt ? new Date(item.expiresAt) < new Date() : false

            return (
              <View style={[
                styles.card,
                { backgroundColor: theme.bgCard, borderColor: theme.border },
                isExpired && { opacity: 0.5 },
              ]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardName, { color: theme.text }]} numberOfLines={1}>{name}</Text>
                  {isExpired && (
                    <View style={styles.expiredBadge}>
                      <Text style={styles.expiredText}>Expiré</Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardMeta}>
                  {item.passwordHash && (
                    <Text style={[styles.metaItem, { color: theme.textMuted }]}>🔒 Protégé</Text>
                  )}
                  {item.expiresAt && !isExpired && (
                    <Text style={[styles.metaItem, { color: theme.textMuted }]}>
                      📅 Expire {formatDate(item.expiresAt)}
                    </Text>
                  )}
                  <Text style={[styles.metaItem, { color: theme.textMuted }]}>
                    👁 {item.accessCount} accès
                  </Text>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    onPress={() => copyLink(item.token)}
                    style={[styles.actionBtn, { backgroundColor: Colors.brand[600] }]}
                  >
                    <Text style={styles.actionBtnText}>📋 Partager</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(item.token)}
                    style={[styles.actionBtn, { backgroundColor: Colors.red[500] }]}
                  >
                    <Text style={styles.actionBtnText}>🗑 Supprimer</Text>
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
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardName: { flex: 1, fontSize: 15, fontWeight: '600' },
  expiredBadge: {
    backgroundColor: '#fef2f2',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  expiredText: { color: Colors.red[500], fontSize: 11, fontWeight: '600' },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaItem: { fontSize: 12 },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
})
