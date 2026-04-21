import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { authenticate } from '../middlewares/authenticate'
import { prisma } from '../utils/prisma'

const updateProfileSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  email: z.string().email().optional(),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Min 8 caractères'),
})

export default async function userRoutes(app: FastifyInstance) {
  // Toutes ces routes nécessitent d'être connecté
  app.addHook('preHandler', authenticate)

  // ==============================
  // PROFIL
  // ==============================
  app.get('/profile', async (req, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        theme: true,
        quotaBytes: true,
        usedBytes: true,
        createdAt: true,
        oauthAccounts: { select: { provider: true } },
      },
    })
    return reply.send({ user })
  })

  // ==============================
  // MISE À JOUR PROFIL
  // ==============================
  app.patch('/profile', async (req, reply) => {
    const result = updateProfileSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ error: result.error.flatten().fieldErrors })
    }

    const { username, email } = result.data

    // Vérifie les conflits
    if (username) {
      const taken = await prisma.user.findFirst({
        where: { username, NOT: { id: req.user.id } },
      })
      if (taken) return reply.status(409).send({ error: 'Nom d\'utilisateur déjà pris' })
    }

    if (email) {
      const taken = await prisma.user.findFirst({
        where: { email, NOT: { id: req.user.id } },
      })
      if (taken) return reply.status(409).send({ error: 'Email déjà utilisé' })
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { username, email },
      select: { id: true, email: true, username: true, avatarUrl: true, theme: true },
    })

    return reply.send({ user: updated })
  })

  // ==============================
  // CHANGEMENT MOT DE PASSE
  // ==============================
  app.post('/change-password', async (req, reply) => {
    const result = changePasswordSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ error: result.error.flatten().fieldErrors })
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } })

    if (!user?.passwordHash) {
      return reply.status(400).send({ error: 'Compte OAuth — pas de mot de passe à changer' })
    }

    const valid = await bcrypt.compare(result.data.currentPassword, user.passwordHash)
    if (!valid) return reply.status(401).send({ error: 'Mot de passe actuel incorrect' })

    const newHash = await bcrypt.hash(result.data.newPassword, 12)
    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash: newHash } })

    return reply.send({ message: 'Mot de passe mis à jour' })
  })

  // ==============================
  // THÈME
  // ==============================
  app.patch('/theme', async (req, reply) => {
    const { theme } = req.body as { theme?: string }

    if (theme !== 'LIGHT' && theme !== 'DARK') {
      return reply.status(400).send({ error: 'Thème invalide' })
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: { theme },
    })

    return reply.send({ theme })
  })

  // ==============================
  // AVATAR (upload base64 simple)
  // ==============================
  app.patch('/avatar', async (req, reply) => {
    const { avatarUrl } = req.body as { avatarUrl?: string }

    if (!avatarUrl || !avatarUrl.startsWith('https://')) {
      return reply.status(400).send({ error: 'URL avatar invalide' })
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl },
      select: { avatarUrl: true },
    })

    return reply.send(updated)
  })
}
