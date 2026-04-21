import bcrypt from 'bcryptjs'
import { prisma } from '../utils/prisma'
import { env } from '../config'

const SALT_ROUNDS = 12

// ==============================
// INSCRIPTION
// ==============================

export async function registerUser(email: string, username: string, password: string) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  })

  if (existing) {
    if (existing.email === email) throw new Error('EMAIL_TAKEN')
    throw new Error('USERNAME_TAKEN')
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash,
      quotaBytes: env.USER_QUOTA_BYTES,
    },
    select: { id: true, email: true, username: true, createdAt: true },
  })

  return user
}

// ==============================
// CONNEXION
// ==============================

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || !user.passwordHash) {
    throw new Error('INVALID_CREDENTIALS')
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw new Error('INVALID_CREDENTIALS')

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    avatarUrl: user.avatarUrl,
    theme: user.theme,
    quotaBytes: user.quotaBytes,
    usedBytes: user.usedBytes,
  }
}

// ==============================
// OAUTH2 — trouve ou crée un user
// ==============================

export async function findOrCreateOAuthUser(
  provider: string,
  providerId: string,
  email: string,
  username: string,
  avatarUrl?: string,
) {
  // Le compte OAuth existe déjà
  const existing = await prisma.oAuthAccount.findUnique({
    where: { provider_providerId: { provider, providerId } },
    include: { user: true },
  })

  if (existing) return existing.user

  // L'email existe mais sans ce provider — on lie les comptes
  const userByEmail = await prisma.user.findUnique({ where: { email } })

  if (userByEmail) {
    await prisma.oAuthAccount.create({
      data: { provider, providerId, userId: userByEmail.id },
    })
    return userByEmail
  }

  // Nouveau compte — on génère un username unique si besoin
  const safeUsername = await getUniqueUsername(username)

  const newUser = await prisma.user.create({
    data: {
      email,
      username: safeUsername,
      avatarUrl,
      quotaBytes: env.USER_QUOTA_BYTES,
      oauthAccounts: {
        create: { provider, providerId },
      },
    },
  })

  return newUser
}

// ==============================
// SESSIONS (refresh tokens)
// ==============================

export async function createSession(userId: string, refreshToken: string) {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30) // 30 jours

  await prisma.session.create({
    data: { userId, refreshToken, expiresAt },
  })
}

export async function deleteSession(refreshToken: string) {
  await prisma.session.deleteMany({ where: { refreshToken } })
}

export async function getSession(refreshToken: string) {
  return prisma.session.findUnique({
    where: { refreshToken },
    include: { user: true },
  })
}

// ==============================
// UTILS
// ==============================

async function getUniqueUsername(base: string): Promise<string> {
  // Nettoie le username (alphanumérique + tirets)
  const clean = base.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 20) || 'user'

  const existing = await prisma.user.findUnique({ where: { username: clean } })
  if (!existing) return clean

  // Ajoute un suffix aléatoire
  const suffix = Math.floor(Math.random() * 9000) + 1000
  return `${clean}_${suffix}`
}
