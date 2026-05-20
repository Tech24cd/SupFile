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

  const handleShare = async (token: string) => {
    const url = `${API_URL}/s/${token}`
    await Share.share({ message: url, url })
  }

  const confirmDelete = (token: string) => {
    Alert.alert('Supprimer ce lien ?', 'Il ne sera plus accessible.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteLink.mutate(token) },
    ])
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Stack.Screen options={{
        headerShown: true,
        headerTitle: 'Mes partages',
        headerStyle: { backgroundColor: theme.bgCard },
        headerTintColor: theme.text,
      }} />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.brand[600]} size="large" />
        </View>
      ) : links.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 56, marginBottom: 16 }}>🔗</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Aucun lien actif</Text>
          <Text style={[styles.emptySub, { color: theme.textMuted }]}>
            Appui long sur un fichier dans le gestionnaire pour le partager
          </Text>
        </View>
      ) : (
        <FlatList
          data={links}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => {
            const name = item.file?.name ?? item.folder?.name ?? 'Élément'
            const isExpired = item.expiresAt ? new Date(item.expiresAt) < new Date() : false
            return (
              <View style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.border, opacity: isExpired ? 0.6 : 1 }]}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardEmoji}>{item.file ? '📄' : '📁'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardName, { color: theme.text }]} numberOfLines={1}>{name}</Text>
                    <View style={styles.badges}>
                      {item.passwordHash && <View style={[styles.badge, { backgroundColor: Colors.brand[50] }]}><Text style={[styles.badgeText, { color: Colors.brand[600] }]}>🔒 Protégé</Text></View>}
                      {isExpired && <View style={[styles.badge, { backgroundColor: '#fef2f2' }]}><Text style={[styles.badgeText, { color: Colors.red[500] }]}>Expiré</Text></View>}
                      {item.expiresAt && !isExpired && <View style={[styles.badge, { backgroundColor: '#f0fdf4' }]}><Text style={[styles.badgeText, { color: Colors.green[500] }]}>Expire {formatDate(item.expiresAt)}</Text></View>}
                    </View>
                  </View>
                </View>
                <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                  <Text style={[styles.accessCount, { color: theme.textMuted }]}>👁 {item.accessCount} accès</Text>
                  <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => handleShare(item.token)} style={[styles.btn, { backgroundColor: Colors.brand[600] }]}>
                      <Text style={styles.btnText}>📤 Partager</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmDelete(item.token)} style={[styles.btn, { backgroundColor: Colors.red[500] }]}>
                      <Text style={styles.btnText}>🗑</Text>
                    </TouchableOpacity>
                  </View>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  cardTop: { flexDirection: 'row', gap: 12, padding: 14 },
  cardEmoji: { fontSize: 28 },
  cardName: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderTopWidth: StyleSheet.hairlineWidth },
  accessCount: { fontSize: 12 },
  cardActions: { flexDirection: 'row', gap: 8 },
  btn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  btnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
})
