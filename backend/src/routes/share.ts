import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { authenticate } from '../middlewares/authenticate'
import { prisma } from '../utils/prisma'
import * as fileService from '../services/file.service'

const createShareSchema = z.object({
  fileId: z.string().optional(),
  folderId: z.string().optional(),
  password: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
}).refine(d => d.fileId || d.folderId, { message: 'fileId ou folderId requis' })

export default async function shareRoutes(app: FastifyInstance) {
  // ==============================
  // CRÉER UN LIEN DE PARTAGE
  // ==============================
  app.post('/', { preHandler: authenticate }, async (req, reply) => {
    const result = createShareSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ error: result.error.flatten().fieldErrors })
    }

    const { fileId, folderId, password, expiresAt } = result.data

    const passwordHash = password ? await bcrypt.hash(password, 10) : null

    const link = await prisma.shareLink.create({
      data: {
        token: nanoid(32),
        userId: req.user.id,
        fileId: fileId ?? null,
        folderId: folderId ?? null,
        passwordHash,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    return reply.status(201).send({ link })
  })

  // ==============================
  // MES LIENS
  // ==============================
  app.get('/', { preHandler: authenticate }, async (req, reply) => {
    const links = await prisma.shareLink.findMany({
      where: { userId: req.user.id },
      include: {
        file: { select: { id: true, name: true, mimeType: true } },
        folder: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return reply.send({ links })
  })

  // ==============================
  // SUPPRIMER UN LIEN
  // ==============================
  app.delete('/:token', { preHandler: authenticate }, async (req, reply) => {
    const { token } = req.params as { token: string }

    const link = await prisma.shareLink.findFirst({
      where: { token, userId: req.user.id },
    })
    if (!link) return reply.status(404).send({ error: 'Lien introuvable' })

    await prisma.shareLink.delete({ where: { id: link.id } })
    return reply.send({ message: 'Lien supprimé' })
  })

  // ==============================
  // ACCÈS PUBLIC AU LIEN (sans auth)
  // ==============================
  app.get('/public/:token', async (req, reply) => {
    const { token } = req.params as { token: string }
    const { password } = req.query as { password?: string }

    const link = await prisma.shareLink.findUnique({
      where: { token },
      include: {
        file: true,
        folder: { include: { files: true } },
      },
    })

    if (!link) return reply.status(404).send({ error: 'Lien introuvable ou expiré' })
    if (link.expiresAt && link.expiresAt < new Date()) {
      return reply.status(410).send({ error: 'Ce lien a expiré' })
    }

    if (link.passwordHash) {
      if (!password) return reply.status(401).send({ error: 'Mot de passe requis', protected: true })
      const valid = await bcrypt.compare(password, link.passwordHash)
      if (!valid) return reply.status(401).send({ error: 'Mot de passe incorrect' })
    }

    await prisma.shareLink.update({
      where: { id: link.id },
      data: { accessCount: { increment: 1 } },
    })

    return reply.send({ link })
  })

  // ==============================
  // TÉLÉCHARGEMENT VIA LIEN PUBLIC
  // ==============================
  app.get('/public/:token/download', async (req, reply) => {
    const { token } = req.params as { token: string }
    const { password } = req.query as { password?: string }

    const link = await prisma.shareLink.findUnique({
      where: { token },
      include: { file: true, folder: true },
    })

    if (!link) return reply.status(404).send({ error: 'Lien introuvable' })
    if (link.expiresAt && link.expiresAt < new Date()) {
      return reply.status(410).send({ error: 'Lien expiré' })
    }
    if (link.passwordHash) {
      if (!password) return reply.status(401).send({ error: 'Mot de passe requis' })
      const valid = await bcrypt.compare(password, link.passwordHash)
      if (!valid) return reply.status(401).send({ error: 'Mot de passe incorrect' })
    }

    if (link.fileId && link.file) {
      const { file, stream } = await fileService.getFileStream(link.fileId, link.file.userId)
      reply.header('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`)
      reply.header('Content-Type', file.mimeType)
      return reply.send(stream)
    }

    if (link.folderId && link.folder) {
      reply.header('Content-Type', 'application/zip')
      reply.header('Content-Disposition', `attachment; filename="${encodeURIComponent(link.folder.name)}.zip"`)
      await fileService.createFolderZip(link.folderId, link.folder.userId, reply.raw)
      return reply
    }

    return reply.status(404).send({ error: 'Contenu introuvable' })
  })

  // ==============================
  // PARTAGE INTERNE (entre users)
  // ==============================
  app.post('/internal', { preHandler: authenticate }, async (req, reply) => {
    const { folderId, targetEmail, canWrite } = req.body as {
      folderId?: string
      targetEmail?: string
      canWrite?: boolean
    }

    if (!folderId || !targetEmail) {
      return reply.status(400).send({ error: 'folderId et targetEmail requis' })
    }

    const folder = await prisma.folder.findFirst({ where: { id: folderId, userId: req.user.id } })
    if (!folder) return reply.status(404).send({ error: 'Dossier introuvable' })

    const target = await prisma.user.findUnique({ where: { email: targetEmail } })
    if (!target) return reply.status(404).send({ error: 'Utilisateur introuvable' })

    if (target.id === req.user.id) {
      return reply.status(400).send({ error: 'Vous ne pouvez pas partager avec vous-même' })
    }

    const share = await prisma.folderShare.upsert({
      where: { folderId_sharedWithId: { folderId, sharedWithId: target.id } },
      update: { canWrite: canWrite ?? false },
      create: {
        folderId,
        ownerId: req.user.id,
        sharedWithId: target.id,
        canWrite: canWrite ?? false,
      },
    })

    return reply.status(201).send({ share })
  })

  app.delete('/internal/:shareId', { preHandler: authenticate }, async (req, reply) => {
    const { shareId } = req.params as { shareId: string }

    const share = await prisma.folderShare.findFirst({
      where: { id: shareId, ownerId: req.user.id },
    })
    if (!share) return reply.status(404).send({ error: 'Partage introuvable' })

    await prisma.folderShare.delete({ where: { id: shareId } })
    return reply.send({ message: 'Partage supprimé' })
  })
}
