import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middlewares/authenticate'
import { prisma } from '../utils/prisma'
import * as fileService from '../services/file.service'

const createFolderSchema = z.object({
  name: z.string().min(1).max(255).trim(),
  parentId: z.string().optional().nullable(),
})

export default async function folderRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // ==============================
  // LISTE DES DOSSIERS
  // ==============================
  app.get('/', async (req, reply) => {
    const { parentId } = req.query as { parentId?: string }

    const folders = await prisma.folder.findMany({
      where: {
        userId: req.user.id,
        parentId: parentId ?? null,
        trashItems: { none: {} },
      },
      include: {
        _count: { select: { files: true, children: true } },
      },
      orderBy: { name: 'asc' },
    })

    return reply.send({ folders })
  })

  // ==============================
  // BREADCRUMB — chemin vers un dossier
  // ==============================
  app.get('/:id/breadcrumb', async (req, reply) => {
    const { id } = req.params as { id: string }

    const breadcrumb: { id: string; name: string }[] = []
    let currentId: string | null = id

    while (currentId) {
      const folder = await prisma.folder.findFirst({
        where: { id: currentId, userId: req.user.id },
        select: { id: true, name: true, parentId: true },
      })

      if (!folder) break

      breadcrumb.unshift({ id: folder.id, name: folder.name })
      currentId = folder.parentId
    }

    return reply.send({ breadcrumb })
  })

  // ==============================
  // CRÉATION
  // ==============================
  app.post('/', async (req, reply) => {
    const result = createFolderSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ error: result.error.flatten().fieldErrors })
    }

    const { name, parentId } = result.data

    if (parentId) {
      const parent = await prisma.folder.findFirst({ where: { id: parentId, userId: req.user.id } })
      if (!parent) return reply.status(404).send({ error: 'Dossier parent introuvable' })
    }

    const folder = await prisma.folder.create({
      data: { name, userId: req.user.id, parentId: parentId ?? null },
    })

    return reply.status(201).send({ folder })
  })

  // ==============================
  // RENOMMAGE
  // ==============================
  app.patch('/:id/rename', async (req, reply) => {
    const { id } = req.params as { id: string }
    const { name } = req.body as { name?: string }

    if (!name?.trim()) return reply.status(400).send({ error: 'Nom invalide' })

    const folder = await prisma.folder.findFirst({ where: { id, userId: req.user.id } })
    if (!folder) return reply.status(404).send({ error: 'Dossier introuvable' })

    const updated = await prisma.folder.update({
      where: { id },
      data: { name: name.trim() },
    })

    return reply.send({ folder: updated })
  })

  // ==============================
  // DÉPLACEMENT
  // ==============================
  app.patch('/:id/move', async (req, reply) => {
    const { id } = req.params as { id: string }
    const { parentId } = req.body as { parentId: string | null }

    const folder = await prisma.folder.findFirst({ where: { id, userId: req.user.id } })
    if (!folder) return reply.status(404).send({ error: 'Dossier introuvable' })

    // Empêche de se déplacer dans soi-même
    if (parentId === id) {
      return reply.status(400).send({ error: 'Un dossier ne peut pas être son propre parent' })
    }

    if (parentId) {
      const target = await prisma.folder.findFirst({ where: { id: parentId, userId: req.user.id } })
      if (!target) return reply.status(404).send({ error: 'Dossier cible introuvable' })
    }

    const updated = await prisma.folder.update({
      where: { id },
      data: { parentId: parentId ?? null },
    })

    return reply.send({ folder: updated })
  })

  // ==============================
  // SUPPRESSION (corbeille)
  // ==============================
  app.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }

    try {
      await fileService.moveFolderToTrash(id, req.user.id)
      return reply.send({ message: 'Dossier déplacé dans la corbeille' })
    } catch {
      return reply.status(404).send({ error: 'Dossier introuvable' })
    }
  })

  // ==============================
  // TÉLÉCHARGEMENT ZIP
  // ==============================
  app.get('/:id/download', async (req, reply) => {
    const { id } = req.params as { id: string }

    const folder = await prisma.folder.findFirst({ where: { id, userId: req.user.id } })
    if (!folder) return reply.status(404).send({ error: 'Dossier introuvable' })

    reply.header('Content-Type', 'application/zip')
    reply.header('Content-Disposition', `attachment; filename="${encodeURIComponent(folder.name)}.zip"`)

    await fileService.createFolderZip(id, req.user.id, reply.raw)

    return reply
  })
}
