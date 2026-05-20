import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native'
import { useState } from 'react'
import { Stack, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { useTheme } from '@/hooks/useTheme'
import { searchService } from '@/services'
import { Colors } from '@/utils/colors'
import { formatBytes, formatDate, getMimeEmoji } from '@/utils/files'
import type { FileItem, Folder } from '@/types'

const TYPES = [
  { value: '', label: 'Tout' },
  { value: 'image', label: '🖼️ Images' },
  { value: 'video', label: '🎬 Vidéos' },
  { value: 'audio', label: '🎵 Audio' },
  { value: 'pdf', label: '📄 PDF' },
  { value: 'text', label: '📝 Textes' },
]

const SINCE = [
  { value: '', label: 'Toutes dates' },
  { value: 'today', label: "Aujourd'hui" },
  { value: 'week', label: 'Semaine' },
  { value: 'month', label: 'Mois' },
]

export default function SearchScreen() {
  const { theme } = useTheme()
  const router = useRouter()
  const [q, setQ] = useState('')
  const [type, setType] = useState('')
  const [since, setSince] = useState('')
  const [enabled, setEnabled] = useState(false)

  const { data, isFetching } = useQuery({
    queryKey: ['search', q, type, since],
    queryFn: () => searchService.search(q, type || undefined, since || undefined),
    enabled,
  })

  const files: FileItem[] = data?.data?.files ?? []
  const folders: Folder[] = data?.data?.folders ?? []
  const total = files.length + folders.length
  const items = [
    ...folders.map(f => ({ type: 'folder' as const, data: f })),
    ...files.map(f => ({ type: 'file' as const, data: f })),
  ]

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Stack.Screen options={{
        headerShown: true,
        headerTitle: 'Recherche',
        headerStyle: { backgroundColor: theme.bgCard },
        headerTintColor: theme.text,
      }} />

      {/* Barre de recherche */}
      <View style={[styles.searchSection, { backgroundColor: theme.bgCard, borderBottomColor: theme.border }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.bgInput, borderColor: theme.border }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            value={q}
            onChangeText={setQ}
            placeholder="Rechercher un fichier..."
            placeholderTextColor={theme.textMuted}
            returnKeyType="search"
            onSubmitEditing={() => setEnabled(true)}
          />
          {q.length > 0 && (
            <TouchableOpacity onPress={() => { setQ(''); setEnabled(false) }}>
              <Text style={{ color: theme.textMuted, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filtres type */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          {TYPES.map(t => (
            <TouchableOpacity
              key={t.value}
              onPress={() => { setType(t.value); setEnabled(true) }}
              style={[styles.chip, { borderColor: theme.border, backgroundColor: type === t.value ? Colors.brand[600] : theme.bgInput }]}
            >
              <Text style={[styles.chipText, { color: type === t.value ? '#fff' : theme.textMuted }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Filtres date */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          {SINCE.map(s => (
            <TouchableOpacity
              key={s.value}
              onPress={() => { setSince(s.value); setEnabled(true) }}
              style={[styles.chip, { borderColor: theme.border, backgroundColor: since === s.value ? Colors.brand[600] : theme.bgInput }]}
            >
              <Text style={[styles.chipText, { color: since === s.value ? '#fff' : theme.textMuted }]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isFetching ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.brand[600]} size="large" />
          <Text style={[styles.loadingText, { color: theme.textMuted }]}>Recherche en cours...</Text>
        </View>
      ) : !enabled ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🔍</Text>
          <Text style={[styles.hintTitle, { color: theme.text }]}>Trouvez vos fichiers</Text>
          <Text style={[styles.hintSub, { color: theme.textMuted }]}>Recherchez par nom, type ou date</Text>
        </View>
      ) : total === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>😕</Text>
          <Text style={[styles.hintTitle, { color: theme.text }]}>Aucun résultat</Text>
          <Text style={[styles.hintSub, { color: theme.textMuted }]}>Essayez un autre terme</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.data.id}
          contentContainerStyle={{ paddingVertical: 8 }}
          ListHeaderComponent={
            <Text style={[styles.resultCount, { color: theme.textMuted }]}>
              {total} résultat{total > 1 ? 's' : ''}
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.row, { borderBottomColor: theme.border }]}
              onPress={() => {
                if (item.type === 'folder') {
                  router.push({ pathname: '/(tabs)/files', params: { folderId: item.data.id } })
                }
              }}
            >
              <View style={[styles.iconWrap, { backgroundColor: item.type === 'folder' ? Colors.brand[50] : Colors.gray[100] }]}>
                <Text style={styles.rowIcon}>
                  {item.type === 'folder' ? '📁' : getMimeEmoji((item.data as FileItem).mimeType)}
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.rowName, { color: theme.text }]} numberOfLines={1}>{item.data.name}</Text>
                {item.type === 'file' && (
                  <Text style={[styles.rowMeta, { color: theme.textMuted }]}>
                    {formatBytes(Number((item.data as FileItem).sizeBytes))} · {formatDate(item.data.updatedAt)}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchSection: { borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: 8 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 12, borderWidth: 1.5, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 15 },
  chips: { paddingHorizontal: 12, marginBottom: 4 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, marginRight: 8,
  },
  chipText: { fontSize: 12, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  loadingText: { marginTop: 12, fontSize: 14 },
  hintTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  hintSub: { fontSize: 14, textAlign: 'center' },
  resultCount: { fontSize: 12, paddingHorizontal: 16, paddingVertical: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, gap: 12,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowIcon: { fontSize: 22 },
  rowName: { fontSize: 15, fontWeight: '600' },
  rowMeta: { fontSize: 12, marginTop: 2 },
})
