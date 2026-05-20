import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native'
import { useState } from 'react'
import { Link } from 'expo-router'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/services'
import { Colors } from '@/utils/colors'

export default function RegisterScreen() {
  const [form, setForm] = useState({ email: '', username: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()

  const set = (key: keyof typeof form) => (val: string) => setForm(f => ({ ...f, [key]: val }))

  const handleRegister = async () => {
    if (!form.email || !form.username || !form.password) {
      Alert.alert('Champs manquants', 'Veuillez remplir tous les champs')
      return
    }
    if (form.password.length < 8) {
      Alert.alert('Mot de passe trop court', 'Minimum 8 caractères')
      return
    }
    if (form.password !== form.confirm) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas')
      return
    }
    setLoading(true)
    try {
      const { data } = await authService.register(form.email.trim(), form.username.trim(), form.password)
      await setAuth(data.user, data.accessToken, data.refreshToken)
    } catch (err: any) {
      const msg = err.response?.data?.error
      Alert.alert('Inscription impossible', typeof msg === 'string' ? msg : 'Veuillez réessayer')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { key: 'email', label: 'Email', placeholder: 'vous@exemple.com', keyboardType: 'email-address' as const, secure: false },
    { key: 'username', label: "Nom d'utilisateur", placeholder: 'monutilisateur', keyboardType: 'default' as const, secure: false },
    { key: 'password', label: 'Mot de passe', placeholder: '8 caractères minimum', keyboardType: 'default' as const, secure: true },
    { key: 'confirm', label: 'Confirmer le mot de passe', placeholder: '••••••••', keyboardType: 'default' as const, secure: true },
  ]

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>💾</Text>
          </View>
          <Text style={styles.logoTitle}>SUPFile</Text>
          <Text style={styles.logoSubtitle}>30 Go de stockage gratuit</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Créer un compte</Text>

          {fields.map(({ key, label, placeholder, keyboardType, secure }) => (
            <View style={styles.field} key={key}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.input}
                value={form[key as keyof typeof form]}
                onChangeText={set(key as keyof typeof form)}
                placeholder={placeholder}
                placeholderTextColor={Colors.gray[400]}
                keyboardType={keyboardType}
                autoCapitalize="none"
                secureTextEntry={secure}
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Créer mon compte</Text>
            }
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>déjà inscrit ?</Text>
            <View style={styles.dividerLine} />
          </View>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.85}>
              <Text style={styles.secondaryBtnText}>Se connecter</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.brand[600] },
  container: { flexGrow: 1, justifyContent: 'flex-end' },
  hero: { alignItems: 'center', paddingTop: 60, paddingBottom: 32, gap: 8 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  logoEmoji: { fontSize: 36 },
  logoTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  logoSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  card: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 28, paddingBottom: 48,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: Colors.gray[900], marginBottom: 20 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.gray[700], marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: Colors.gray[200], borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: Colors.gray[900], backgroundColor: Colors.gray[50],
  },
  btn: {
    backgroundColor: Colors.brand[600], borderRadius: 14,
    paddingVertical: 15, alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.gray[200] },
  dividerText: { fontSize: 13, color: Colors.gray[400] },
  secondaryBtn: {
    borderWidth: 1.5, borderColor: Colors.brand[600], borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  secondaryBtnText: { color: Colors.brand[600], fontWeight: '700', fontSize: 15 },
})
