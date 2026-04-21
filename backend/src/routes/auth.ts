import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import * as authService from '../services/auth.service'
import { generateAccessToken, generateRefreshToken, rotateRefreshToken } from '../utils/tokens'
import { authenticate } from '../middlewares/authenticate'
import { env } from '../config'

// Schemas de validation
const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  username: z.string().min(3, 'Min 3 caractères').max(20, 'Max 20 caractères').regex(/^[a-zA-Z0-9_-]+$/, 'Caractères invalides'),
  password: z.string().min(8, 'Min 8 caractères'),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export default async function authRoutes(app: FastifyInstance) {
  // ==============================
  // INSCRIPTION
  // ==============================
  app.post('/register', async (req, reply) => {
    const result = registerSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ error: result.error.flatten().fieldErrors })
    }

    const { email, username, password } = result.data

    try {
      const user = await authService.registerUser(email, username, password)
      const accessToken = generateAccessToken(app, user.id)
      const refreshToken = await generateRefreshToken(app, user.id)

      return reply.status(201).send({ user, accessToken, refreshToken })
    } catch (err: any) {
      if (err.message === 'EMAIL_TAKEN') return reply.status(409).send({ error: 'Cet email est déjà utilisé' })
      if (err.message === 'USERNAME_TAKEN') return reply.status(409).send({ error: 'Ce nom d\'utilisateur est déjà pris' })
      throw err
    }
  })

  // ==============================
  // CONNEXION
  // ==============================
  app.post('/login', async (req, reply) => {
    const result = loginSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'Données invalides' })
    }

    const { email, password } = result.data

    try {
      const user = await authService.loginUser(email, password)
      const accessToken = generateAccessToken(app, user.id)
      const refreshToken = await generateRefreshToken(app, user.id)

      return reply.send({ user, accessToken, refreshToken })
    } catch {
      return reply.status(401).send({ error: 'Email ou mot de passe incorrect' })
    }
  })

  // ==============================
  // REFRESH TOKEN
  // ==============================
  app.post('/refresh', async (req, reply) => {
    const { refreshToken } = req.body as { refreshToken?: string }
    if (!refreshToken) return reply.status(400).send({ error: 'Refresh token manquant' })

    const session = await authService.getSession(refreshToken)

    if (!session || session.expiresAt < new Date()) {
      return reply.status(401).send({ error: 'Session expirée, reconnectez-vous' })
    }

    const accessToken = generateAccessToken(app, session.userId)
    const newRefreshToken = await rotateRefreshToken(app, refreshToken, session.userId)

    return reply.send({ accessToken, refreshToken: newRefreshToken })
  })

  // ==============================
  // LOGOUT
  // ==============================
  app.post('/logout', { preHandler: authenticate }, async (req, reply) => {
    const { refreshToken } = req.body as { refreshToken?: string }
    if (refreshToken) await authService.deleteSession(refreshToken)
    return reply.send({ message: 'Déconnecté' })
  })

  // ==============================
  // MOI (user connecté)
  // ==============================
  app.get('/me', { preHandler: authenticate }, async (req, reply) => {
    return reply.send({ user: req.user })
  })

  // ==============================
  // OAUTH2 — GOOGLE
  // ==============================
  app.get('/oauth/google', async (req, reply) => {
    if (!env.OAUTH_GOOGLE_CLIENT_ID) {
      return reply.status(501).send({ error: 'OAuth Google non configuré' })
    }

    const params = new URLSearchParams({
      client_id: env.OAUTH_GOOGLE_CLIENT_ID,
      redirect_uri: `${req.protocol}://${req.hostname}:${env.PORT}/api/auth/oauth/google/callback`,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
    })

    return reply.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
  })

  app.get('/oauth/google/callback', async (req, reply) => {
    const { code } = req.query as { code?: string }
    if (!code) return reply.status(400).send({ error: 'Code OAuth manquant' })

    try {
      const redirectUri = `${req.protocol}://${req.hostname}:${env.PORT}/api/auth/oauth/google/callback`

      // Échange le code contre un token
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: env.OAUTH_GOOGLE_CLIENT_ID!,
          client_secret: env.OAUTH_GOOGLE_CLIENT_SECRET!,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      })

      const tokenData = await tokenRes.json() as any
      if (!tokenRes.ok) throw new Error('Token exchange failed')

      // Récupère le profil
      const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      })
      const profile = await profileRes.json() as any

      const user = await authService.findOrCreateOAuthUser(
        'google',
        profile.sub,
        profile.email,
        profile.name ?? profile.email.split('@')[0],
        profile.picture,
      )

      const accessToken = generateAccessToken(app, user.id)
      const refreshToken = await generateRefreshToken(app, user.id)

      // Redirige vers le front avec les tokens dans l'URL (le front les stocke)
      return reply.redirect(
        `${env.FRONTEND_URL}/oauth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
      )
    } catch (err) {
      app.log.error(err)
      return reply.redirect(`${env.FRONTEND_URL}/login?error=oauth_failed`)
    }
  })

  // ==============================
  // OAUTH2 — GITHUB
  // ==============================
  app.get('/oauth/github', async (req, reply) => {
    if (!env.OAUTH_GITHUB_CLIENT_ID) {
      return reply.status(501).send({ error: 'OAuth GitHub non configuré' })
    }

    const params = new URLSearchParams({
      client_id: env.OAUTH_GITHUB_CLIENT_ID,
      redirect_uri: `${req.protocol}://${req.hostname}:${env.PORT}/api/auth/oauth/github/callback`,
      scope: 'user:email',
    })

    return reply.redirect(`https://github.com/login/oauth/authorize?${params}`)
  })

  app.get('/oauth/github/callback', async (req, reply) => {
    const { code } = req.query as { code?: string }
    if (!code) return reply.status(400).send({ error: 'Code OAuth manquant' })

    try {
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: env.OAUTH_GITHUB_CLIENT_ID,
          client_secret: env.OAUTH_GITHUB_CLIENT_SECRET,
          code,
        }),
      })

      const tokenData = await tokenRes.json() as any
      if (tokenData.error) throw new Error(tokenData.error)

      // Profil de base
      const profileRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'User-Agent': 'SUPFile',
        },
      })
      const profile = await profileRes.json() as any

      // GitHub peut cacher l'email — on va le chercher
      let email = profile.email
      if (!email) {
        const emailRes = await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            'User-Agent': 'SUPFile',
          },
        })
        const emails = await emailRes.json() as any[]
        const primary = emails.find((e) => e.primary && e.verified)
        email = primary?.email
      }

      if (!email) throw new Error('Impossible de récupérer l\'email GitHub')

      const user = await authService.findOrCreateOAuthUser(
        'github',
        String(profile.id),
        email,
        profile.login,
        profile.avatar_url,
      )

      const accessToken = generateAccessToken(app, user.id)
      const refreshToken = await generateRefreshToken(app, user.id)

      return reply.redirect(
        `${env.FRONTEND_URL}/oauth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
      )
    } catch (err) {
      app.log.error(err)
      return reply.redirect(`${env.FRONTEND_URL}/login?error=oauth_failed`)
    }
  })
}
