import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { Stack, Link } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { useTheme } from '@/hooks/useTheme'
import { useAuthStore } from '@/stores/authStore'
import { dashboardService } from '@/services'
import { Colors } from '@/utils/colors'
import { formatBytes, formatDate, getMimeEmoji } from '@/utils/files'

const PIE_COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6']

export default function DashboardScreen() {
  const { theme } = useTheme()
  const { user } = useAuthStore()
  const { data } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardService.get })

  const d = data?.data
  const usedBytes = Number(d?.quota?.used ?? user?.usedBytes ?? 0)
  const totalBytes = Number(d?.quota?.total ?? user?.quotaBytes ?? 1)
  const usedPct = Math.min(100, (usedBytes / totalBytes) * 100)
  const freeBytes = totalBytes - usedBytes

  const breakdown: [string, number][] = d?.breakdown
    ? Object.entries(d.breakdown).map(([k, v]) => [k, Number(v)])
    : []

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Stack.Screen options={{
        headerShown: true,
        headerTitle: 'Dashboard',
        headerStyle: { backgroundColor: theme.bgCard },
        headerTintColor: theme.text,
      }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Welcome */}
        <View style={[styles.welcomeCard, { backgroundColor: Colors.brand[600] }]}>
          <Text style={styles.welcomeEmoji}>👋</Text>
          <View>
            <Text style={styles.welcomeText}>Bonjour, {user?.username} !</Text>
            <Text style={styles.welcomeSub}>Voici l'état de votre stockage</Text>
          </View>
        </View>

        {/* Quota */}
        <View style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>💾</Text>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Stockage</Text>
          </View>

          <View style={styles.quotaNumbers}>
            <View style={styles.quotaItem}>
              <Text style={[styles.quotaValue, { color: Colors.brand[600] }]}>{formatBytes(usedBytes)}</Text>
              <Text style={[styles.quotaLabel, { color: theme.textMuted }]}>Utilisé</Text>
            </View>
            <View style={[styles.quotaDivider, { backgroundColor: theme.border }]} />
            <View style={styles.quotaItem}>
              <Text style={[styles.quotaValue, { color: Colors.green[500] }]}>{formatBytes(freeBytes)}</Text>
              <Text style={[styles.quotaLabel, { color: theme.textMuted }]}>Disponible</Text>
            </View>
            <View style={[styles.quotaDivider, { backgroundColor: theme.border }]} />
            <View style={styles.quotaItem}>
              <Text style={[styles.quotaValue, { color: theme.text }]}>{formatBytes(totalBytes)}</Text>
              <Text style={[styles.quotaLabel, { color: theme.textMuted }]}>Total</Text>
            </View>
          </View>

          {/* Barre de progression */}
          <View style={[styles.barBg, { backgroundColor: theme.border }]}>
            <View style={[
              styles.barFill,
              { width: `${usedPct}%` as any, backgroundColor: usedPct > 85 ? Colors.red[500] : Colors.brand[600] }
            ]} />
          </View>
          <Text style={[styles.pctText, { color: theme.textMuted }]}>{usedPct.toFixed(1)}% utilisé</Text>
        </View>

        {/* Répartition */}
        {breakdown.length > 0 && (
          <View style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>📊</Text>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Répartition</Text>
            </View>
            {breakdown.map(([name, value], i) => (
              <View key={name} style={styles.breakdownRow}>
                <View style={[styles.dot, { backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }]} />
                <Text style={[styles.breakdownName, { color: theme.text }]}>{name}</Text>
                <View style={[styles.breakdownBarBg, { backgroundColor: theme.border }]}>
                  <View style={[
                    styles.breakdownBarFill,
                    { width: `${Math.min(100, (value / usedBytes) * 100)}%` as any, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }
                  ]} />
                </View>
                <Text style={[styles.breakdownValue, { color: theme.textMuted }]}>{formatBytes(value)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Fichiers récents */}
        <View style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🕐</Text>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Récemment modifiés</Text>
          </View>
          {(d?.recentFiles ?? []).length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>Aucun fichier récent</Text>
          ) : (
            (d?.recentFiles ?? []).map((file: any) => (
              <View key={file.id} style={[styles.recentRow, { borderBottomColor: theme.border }]}>
                <View style={[styles.recentIcon, { backgroundColor: Colors.gray[100] }]}>
                  <Text style={{ fontSize: 18 }}>{getMimeEmoji(file.mimeType)}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.recentName, { color: theme.text }]} numberOfLines={1}>{file.name}</Text>
                  <Text style={[styles.recentDate, { color: theme.textMuted }]}>{formatDate(file.updatedAt)}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 12 },
  welcomeCard: {
    borderRadius: 20, padding: 20,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  welcomeEmoji: { fontSize: 36 },
  welcomeText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  welcomeSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 },
  card: { borderRadius: 20, padding: 18, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  cardIcon: { fontSize: 20 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  quotaNumbers: { flexDirection: 'row', marginBottom: 14 },
  quotaItem: { flex: 1, alignItems: 'center' },
  quotaValue: { fontSize: 16, fontWeight: '700' },
  quotaLabel: { fontSize: 11, marginTop: 2 },
  quotaDivider: { width: 1 },
  barBg: { height: 10, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
  pctText: { fontSize: 12, marginTop: 6, textAlign: 'right' },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  breakdownName: { fontSize: 13, width: 60 },
  breakdownBarBg: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  breakdownBarFill: { height: '100%', borderRadius: 3 },
  breakdownValue: { fontSize: 12, width: 55, textAlign: 'right' },
  recentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  recentIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  recentName: { fontSize: 14, fontWeight: '600' },
  recentDate: { fontSize: 12, marginTop: 2 },
  emptyText: { fontSize: 13 },
})
