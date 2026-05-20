import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, RefreshControl,
  TextInput, Modal,
} from 'react-native'
import { useState } from 'react'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTheme } from '@/hooks/useTheme'
import { fileService, folderService } from '@/services'
import { Colors } from '@/utils/colors'
import { formatBytes, formatDate, getMimeEmoji } from '@/utils/files'
import type { FileItem, Folder } from '@/types'

export default function FilesScreen() {
  const { folderId } = useLocalSearchParams<{ folderId?: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const { theme } = useTheme()

  const [uploading, setUploading] = useState(false)
  const [newFolderVisible, setNewFolderVisible] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)

  const { data: filesData, refetch: refetchFiles, isLoading } = useQuery({
    queryKey: ['files', folderId],
    queryFn: () => fileService.list(folderId),
  })

  const { data: foldersData, refetch: refetchFolders } = useQuery({
    queryKey: ['folders', folderId],
    queryFn: () => folderService.list(folderId),
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['files', folderId] })
    qc.invalidateQueries({ queryKey: ['folders', folderId] })
  }

  const handleUpload = async () => {
    setUploading(true)
    try {
      const res = await fileService.upload(folderId ?? null)
      if (res) { invalidate() }
    } catch {
      Alert.alert('Erreur', 'Impossible d\'uploader ce fichier')
    } finally {
      setUploading(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    setCreatingFolder(true)
    try {
      await folderService.create(newFolderName.trim(), folderId)
      setNewFolderName('')
      setNewFolderVisible(false)
      invalidate()
    } catch {
      Alert.alert('Erreur', 'Impossible de créer le dossier')
    } finally {
      setCreatingFolder(false)
    }
  }

  const handleDeleteFile = (file: FileItem) => {
    Alert.alert(`Supprimer "${file.name}" ?`, 'Le fichier sera déplacé dans la corbeille.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => { await fileService.delete(file.id); invalidate() } },
    ])
  }

  const handleDeleteFolder = (folder: Folder) => {
    Alert.alert(`Supprimer "${folder.name}" ?`, 'Le dossier sera déplacé dans la corbeille.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => { await folderService.delete(folder.id); invalidate() } },
    ])
  }

  const handleFolderOptions = (folder: Folder) => {
    Alert.alert(folder.name, '', [
      { text: '📂 Ouvrir', onPress: () => router.push({ pathname: '/(tabs)/files', params: { folderId: folder.id } }) },
      { text: '✏️ Renommer', onPress: () => promptRename('folder', folder.id, folder.name) },
      { text: '🗑 Supprimer', style: 'destructive', onPress: () => handleDeleteFolder(folder) },
      { text: 'Annuler', style: 'cancel' },
    ])
  }

  const handleFileOptions = (file: FileItem) => {
    Alert.alert(file.name, formatBytes(Number(file.sizeBytes)), [
      { text: '✏️ Renommer', onPress: () => promptRename('file', file.id, file.name) },
      { text: '🗑 Supprimer', style: 'destructive', onPress: () => handleDeleteFile(file) },
      { text: 'Annuler', style: 'cancel' },
    ])
  }

  const promptRename = (type: 'file' | 'folder', id: string, current: string) => {
    Alert.prompt(
      'Renommer',
      'Nouveau nom :',
      async (newName) => {
        if (!newName || newName === current) return
        if (type === 'file') await fileService.rename(id, newName)
        else await folderService.rename(id, newName)
        invalidate()
      },
      'plain-text',
      current
    )
  }

  const files = filesData?.data?.files ?? []
  const folders = foldersData?.data?.folders ?? []
  const items = [
    ...folders.map(f => ({ type: 'folder' as const, data: f })),
    ...files.map(f => ({ type: 'file' as const, data: f })),
  ]

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Stack.Screen options={{
        headerShown: true,
        headerTitle: folderId ? '📁 Dossier' : '📁 Mes fichiers',
        headerStyle: { backgroundColor: theme.bgCard },
        headerTintColor: theme.text,
        headerRight: () => (
          <View style={{ flexDirection: 'row', gap: 16, marginRight: 4 }}>
            <TouchableOpacity onPress={() => setNewFolderVisible(true)} hitSlop={8}>
              <Text style={{ fontSize: 22 }}>📂</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleUpload} disabled={uploading} hitSlop={8}>
              {uploading
                ? <ActivityIndicator size="small" color={Colors.brand[600]} />
                : <Text style={{ fontSize: 22 }}>⬆️</Text>
              }
            </TouchableOpacity>
          </View>
        ),
        headerBackTitle: 'Retour',
      }} />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.brand[600]} size="large" />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 56, marginBottom: 16 }}>📂</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Dossier vide</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
            Appuie sur ⬆️ pour importer un fichier
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.data.id}
          refreshControl={<RefreshControl refreshing={false} onRefresh={invalidate} tintColor={Colors.brand[600]} />}
          contentContainerStyle={{ paddingVertical: 8 }}
          renderItem={({ item }) => item.type === 'folder'
            ? <FolderRow folder={item.data as Folder} theme={theme} onOpen={() => router.push({ pathname: '/(tabs)/files', params: { folderId: item.data.id } })} onLongPress={() => handleFolderOptions(item.data as Folder)} />
            : <FileRow file={item.data as FileItem} theme={theme} onLongPress={() => handleFileOptions(item.data as FileItem)} />
          }
        />
      )}

      {/* Modal nouveau dossier */}
      <Modal visible={newFolderVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setNewFolderVisible(false)}>
          <View style={[styles.modalSheet, { backgroundColor: theme.bgCard }]} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>Nouveau dossier</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.bgInput, borderColor: theme.border, color: theme.text }]}
              placeholder="Nom du dossier"
              placeholderTextColor={theme.textMuted}
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setNewFolderVisible(false)}>
                <Text style={[styles.modalCancelText, { color: theme.textMuted }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, { backgroundColor: Colors.brand[600] }]}
                onPress={handleCreateFolder}
                disabled={creatingFolder || !newFolderName.trim()}
              >
                {creatingFolder
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalConfirmText}>Créer</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

function FolderRow({ folder, theme, onOpen, onLongPress }: {
  folder: Folder; theme: any; onOpen: () => void; onLongPress: () => void
}) {
  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: theme.border }]}
      onPress={onOpen}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, { backgroundColor: Colors.brand[50] }]}>
        <Text style={styles.rowIcon}>📁</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowName, { color: theme.text }]} numberOfLines={1}>{folder.name}</Text>
        {folder._count && (
          <Text style={[styles.rowMeta, { color: theme.textMuted }]}>
            {folder._count.files} fichier{folder._count.files !== 1 ? 's' : ''}
            {folder._count.children > 0 ? ` · ${folder._count.children} dossier${folder._count.children !== 1 ? 's' : ''}` : ''}
          </Text>
        )}
      </View>
      <Text style={{ color: theme.textMuted, fontSize: 20 }}>›</Text>
    </TouchableOpacity>
  )
}

function FileRow({ file, theme, onLongPress }: {
  file: FileItem; theme: any; onLongPress: () => void
}) {
  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: theme.border }]}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, { backgroundColor: Colors.gray[100] }]}>
        <Text style={styles.rowIcon}>{getMimeEmoji(file.mimeType)}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowName, { color: theme.text }]} numberOfLines={1}>{file.name}</Text>
        <Text style={[styles.rowMeta, { color: theme.textMuted }]}>
          {formatBytes(Number(file.sizeBytes))} · {formatDate(file.updatedAt)}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, gap: 12,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowIcon: { fontSize: 22 },
  rowInfo: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 15, fontWeight: '600' },
  rowMeta: { fontSize: 12, marginTop: 2 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.gray[300], alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  modalInput: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, borderWidth: 1.5, borderColor: Colors.gray[200] },
  modalCancelText: { fontWeight: '600', fontSize: 15 },
  modalConfirm: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12 },
  modalConfirmText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
