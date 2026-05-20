import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, Switch, Image,
} from 'react-native'
import { useState } from 'react'
import { Stack, useRouter } from 'expo-router'
import { useTheme } from '@/hooks/useTheme'
import { useAuthStore } from '@/stores/authStore'
import { userService, authService } from '@/services'
import { Colors } from '@/utils/colors'
import { API_URL } from '@/services/api'
import { formatBytes } from '@/utils/files'

export default function SettingsScreen() {
  const { theme, isDark } = useTheme()
  const { user, setUser, logout, refreshToken } = useAuthStore()
  const router = useRouter()

  const [username, setUsername] = useState(user?.username ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')

  const avatarSrc = user?.avatarUrl?.startsWith('/api/')
    ? `${API_URL}${user.avatarUrl}`
    : user?.avatarUrl

  const usedBytes = Number(user?.usedBytes ?? 0)
  const totalBytes = Number(user?.quotaBytes ?? 1)
  const usedPct = Math.min(100, (usedBytes / totalBytes) * 100)

  const saveProfile = async () => {
    try {
      const { data } = await userService.updateProfile({ username, email })
      setUser(data.user)
      Alert.alert('✅ Succès', 'Profil mis à jour')
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.error ?? 'Impossible de mettre à jour')
    }
  }

  const changePassword = async () => {
    if (!currentPwd || !newPwd) return
    try {
      await userService.changePassword(currentPwd, newPwd)
      Alert.alert('✅ Succès', 'Mot de passe mis à jour')
      setCurrentPwd(''); setNewPwd('')
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.error ?? 'Mot de passe actuel incorrect')
    }
  }

  const toggleTheme = async () => {
    const newTheme = isDark ? 'LIGHT' : 'DARK'
    try {
      await userService.setTheme(newTheme)
      if (user) setUser({ ...user, theme: newTheme })
    } catch { /* pas bloquant */ }
  }

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion', style: 'destructive',
        onPress: async () => {
          try { if (refreshToken) await authService.logout(refreshToken) } catch { }
          await logout()
          router.replace('/(auth)/login')
        },
      },
    ])
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Stack.Screen options={{
        headerShown: true,
        headerTitle: 'Paramètres',
        headerStyle: { backgroundColor: theme.bgCard },
        headerTintColor: theme.text,
      }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Profil hero */}
        <View style={[styles.profileCard, { backgroundColor: Colors.brand[600] }]}>
          <View style={styles.avatarWrapper}>
            {avatarSrc ? (
              <Image source={{ uri: avatarSrc }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>{user?.username?.[0]?.toUpperCase()}</Text>
              </View>
            )}
          </View>
          <Text style={styles.profileName}>{user?.username}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={styles.quotaRow}>
            <View style={[styles.quotaBar, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
              <View style={[styles.quotaFill, { width: `${usedPct}%` as any }]} />
            </View>
            <Text style={styles.quotaText}>
              {formatBytes(usedBytes)} / {formatBytes(totalBytes)}
            </Text>
          </View>
        </View>

        {/* Infos */}
        <View style={[styles.section, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>👤 Informations</Text>
          <Text style={[styles.label, { color: theme.textMuted }]}>Nom d'utilisateur</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.bgInput, borderColor: theme.border, color: theme.text }]}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <Text style={[styles.label, { color: theme.textMuted }]}>Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.bgInput, borderColor: theme.border, color: theme.text }]}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.brand[600] }]} onPress={saveProfile}>
            <Text style={styles.btnText}>Enregistrer</Text>
          </TouchableOpacity>
        </View>

        {/* Mot de passe */}
        <View style={[styles.section, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>🔒 Mot de passe</Text>
          <Text style={[styles.label, { color: theme.textMuted }]}>Mot de passe actuel</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.bgInput, borderColor: theme.border, color: theme.text }]}
            value={currentPwd}
            onChangeText={setCurrentPwd}
            secureTextEntry
          />
          <Text style={[styles.label, { color: theme.textMuted }]}>Nouveau mot de passe</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.bgInput, borderColor: theme.border, color: theme.text }]}
            value={newPwd}
            onChangeText={setNewPwd}
            secureTextEntry
          />
          <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.brand[600] }]} onPress={changePassword}>
            <Text style={styles.btnText}>Changer</Text>
          </TouchableOpacity>
        </View>

        {/* Apparence */}
        <View style={[styles.section, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>🎨 Apparence</Text>
          <View style={styles.switchRow}>
            <View>
              <Text style={[styles.switchLabel, { color: theme.text }]}>
                {isDark ? '🌙 Mode sombre' : '☀️ Mode clair'}
              </Text>
              <Text style={[styles.switchSub, { color: theme.textMuted }]}>
                {isDark ? 'Interface sombre activée' : 'Interface claire activée'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ true: Colors.brand[600], false: Colors.gray[300] }}
            />
          </View>
        </View>

        {/* Déconnexion */}
        <TouchableOpacity style={[styles.logoutBtn, { borderColor: Colors.red[500] }]} onPress={handleLogout}>
          <Text style={[styles.logoutText, { color: Colors.red[500] }]}>🚪 Se déconnecter</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: theme.textMuted }]}>SUPFile v1.0.0</Text>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 12, paddingBottom: 32 },
  profileCard: {
    borderRadius: 20, padding: 20, alignItems: 'center', gap: 4,
  },
  avatarWrapper: { marginBottom: 8 },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' },
  avatarFallback: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { color: '#fff', fontSize: 28, fontWeight: '800' },
  profileName: { color: '#fff', fontSize: 20, fontWeight: '700' },
  profileEmail: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  quotaRow: { width: '100%', marginTop: 12, gap: 6 },
  quotaBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  quotaFill: { height: '100%', backgroundColor: '#fff', borderRadius: 3 },
  quotaText: { color: 'rgba(255,255,255,0.75)', fontSize: 11, textAlign: 'center' },
  section: { borderRadius: 20, padding: 18, borderWidth: 1, gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  label: { fontSize: 12, fontWeight: '600' },
  input: {
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 15,
  },
  btn: { borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { fontSize: 15, fontWeight: '600' },
  switchSub: { fontSize: 12, marginTop: 2 },
  logoutBtn: {
    borderWidth: 1.5, borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
  },
  logoutText: { fontWeight: '700', fontSize: 15 },
  version: { textAlign: 'center', fontSize: 12, marginTop: 4 },
})
