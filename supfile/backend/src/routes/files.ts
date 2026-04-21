import { FastifyInstance } from 'fastify'
import { authenticate } from '../middlewares/authenticate'
import * as fileService from '../services/file.service'
import { prisma } from '../utils/prisma'
import mime from 'mime-types'

export default async function fileRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // ==============================
  // LISTE DES FICHIERS D'UN DOSSIER
  // ==============================
  app.get('/', async (req, reply) => {
    const { folderId } = req.query as { folderId?: string }

    const files = await prisma.file.findMany({
      where: {
        userId: req.user.id,
        folderId: folderId ?? null,
        trashItems: { none: {} }, // exclut les fichiers en corbeille
      },
      orderBy: { updatedAt: 'desc' },
    })

    return reply.send({ files })
  })

  // ==============================
  // UPLOAD
  // ==============================
  app.post('/upload', async (req, reply) => {
    const { folderId } = req.query as { folderId?: string }

    const data = await req.file()
    if (!data) return reply.status(400).send({ error: 'Aucun fichier reçu' })

    const mimeType = data.mimetype || mime.lookup(data.filename) || 'application/octet-stream'

    try {
      const file = await fileService.saveFile(
        req.user.id,
        folderId ?? null,
        data.filename,
        mimeType as string,
        data.file,
        parseInt(req.headers['content-length'] ?? '0'),
      )
      return reply.status(201).send({ file })
    } catch (err: any) {
      if (err.message === 'QUOTA_EXCEEDED') {
        return reply.status(413).send({ error: 'Quota dépassé' })
      }
      throw err
    }
  })

  // ==============================
  // TÉLÉCHARGEMENT
  // ==============================
  app.get('/:id/download', async (req, reply) => {
    const { id } = req.params as { id: string }

    try {
      const { file, stream } = await fileService.getFileStream(id, req.user.id)

      reply.header('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`)
      reply.header('Content-Type', file.mimeType)
      reply.header('Content-Length', file.sizeBytes.toString())

      return reply.send(stream)
    } catch {
      return reply.status(404).send({ error: 'Fichier introuvable' })
    }
  })

  // ==============================
  // STREAMING / PREVIEW
  // ==============================
  app.get('/:id/preview', async (req, reply) => {
    const { id } = req.params as { id: string }

    try {
      const { file, stream } = await fileService.getFileStream(id, req.user.id)

      // Pour les vidéos/audios on supporte le Range header (streaming)
      reply.header('Content-Type', file.mimeType)
      reply.header('Accept-Ranges', 'bytes')
      reply.header('Content-Length', file.sizeBytes.toString())

      // Inline = affiche dans le navigateur plutôt que télécharger
      reply.header('Content-Disposition', `inline; filename="${encodeURIComponent(file.name)}"`)

      return reply.send(stream)
    } catch {
      return reply.status(404).send({ error: 'Fichier introuvable' })
    }
  })

  // ==============================
  // RENOMMAGE
  // ==============================
  app.patch('/:id/rename', async (req, reply) => {
    const { id } = req.params as { id: string }
    const { name } = req.body as { name?: string }

    if (!name?.trim()) return reply.status(400).send({ error: 'Nom invalide' })

    const file = await prisma.file.findFirst({ where: { id, userId: req.user.id } })
    if (!file) return reply.status(404).send({ error: 'Fichier introuvable' })

    const updated = await prisma.file.update({
      where: { id },
      data: { name: name.trim() },
    })

    return reply.send({ file: updated })
  })

  // ==============================
  // DÉPLACEMENT
  // ==============================
  app.patch('/:id/move', async (req, reply) => {
    const { id } = req.params as { id: string }
    const { folderId } = req.body as { folderId: string | null }

    const file = await prisma.file.findFirst({ where: { id, userId: req.user.id } })
    if (!file) return reply.status(404).send({ error: 'Fichier introuvable' })

    if (folderId) {
      const folder = await prisma.folder.findFirst({ where: { id: folderId, userId: req.user.id } })
      if (!folder) return reply.status(404).send({ error: 'Dossier cible introuvable' })
    }

    const updated = await prisma.file.update({
      where: { id },
      data: { folderId: folderId ?? null },
    })

    return reply.send({ file: updated })
  })

  // ==============================
  // CORBEILLE
  // ==============================
  app.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }

    try {
      await fileService.moveFileToTrash(id, req.user.id)
      return reply.send({ message: 'Fichier déplacé dans la corbeille' })
    } catch {
      return reply.status(404).send({ error: 'Fichier introuvable' })
    }
  })

  // ==============================
  // CORBEILLE — liste
  // ==============================
  app.get('/trash', async (req, reply) => {
    const items = await prisma.trashItem.findMany({
      where: { userId: req.user.id, fileId: { not: null } },
      include: { file: true },
      orderBy: { deletedAt: 'desc' },
    })
    return reply.send({ items })
  })

  // ==============================
  // RESTAURATION
  // ==============================
  app.post('/trash/:trashId/restore', async (req, reply) => {
    const { trashId } = req.params as { trashId: string }

    try {
      const item = await fileService.restoreFromTrash(trashId, req.user.id)
      return reply.send({ item })
    } catch {
      return reply.status(404).send({ error: 'Élément introuvable' })
    }
  })

  // ==============================
  // SUPPRESSION DÉFINITIVE
  // ==============================
  app.delete('/trash/:trashId', async (req, reply) => {
    const { trashId } = req.params as { trashId: string }

    const item = await prisma.trashItem.findFirst({
      where: { id: trashId, userId: req.user.id },
    })
    if (!item) return reply.status(404).send({ error: 'Introuvable' })

    if (item.fileId) await fileService.deleteFilePermanently(item.fileId, req.user.id)
    await prisma.trashItem.delete({ where: { id: trashId } })

    return reply.send({ message: 'Supprimé définitivement' })
  })
}
