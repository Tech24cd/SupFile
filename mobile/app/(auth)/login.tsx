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

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Champs manquants', 'Veuillez remplir tous les champs')
      return
    }
    setLoading(true)
    try {
      const { data } = await authService.login(email.trim(), password)
      await setAuth(data.user, data.accessToken, data.refreshToken)
    } catch (err: any) {
      Alert.alert('Connexion impossible', err.response?.data?.error ?? 'Vérifiez vos identifiants')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.root}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>💾</Text>
          </View>
          <Text style={styles.logoTitle}>SUPFile</Text>
          <Text style={styles.logoSubtitle}>Votre stockage personnel dans le cloud</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Connexion</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="vous@exemple.com"
              placeholderTextColor={Colors.gray[400]}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={Colors.gray[400]}
              secureTextEntry
              onSubmitEditing={handleLogin}
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Se connecter</Text>
            }
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>nouveau ?</Text>
            <View style={styles.dividerLine} />
          </View>

          <Link href="/(auth)/register" asChild>
            <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.85}>
              <Text style={styles.secondaryBtnText}>Créer un compte</Text>
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
  hero: { alignItems: 'center', paddingTop: 80, paddingBottom: 40, gap: 8 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  logoEmoji: { fontSize: 40 },
  logoTitle: { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  logoSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
  card: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    paddingBottom: 48,
    gap: 0,
  },
  cardTitle: {
    fontSize: 22, fontWeight: '700', color: Colors.gray[900],
    marginBottom: 24,
  },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.gray[700], marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: Colors.gray[200], borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: Colors.gray[900], backgroundColor: Colors.gray[50],
  },
  btn: {
    backgroundColor: Colors.brand[600], borderRadius: 14,
    paddingVertical: 15, alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.gray[200] },
  dividerText: { fontSize: 13, color: Colors.gray[400] },
  secondaryBtn: {
    borderWidth: 1.5, borderColor: Colors.brand[600], borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  secondaryBtnText: { color: Colors.brand[600], fontWeight: '700', fontSize: 15 },
})
