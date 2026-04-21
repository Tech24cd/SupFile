import { FastifyInstance } from 'fastify'
import { authenticate } from '../middlewares/authenticate'
import { prisma } from '../utils/prisma'

export default async function searchRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  app.get('/', async (req, reply) => {
    const { q, type, since } = req.query as {
      q?: string
      type?: string       // ex: "image", "video", "pdf"
      since?: string      // ex: "week", "month"
    }

    if (!q?.trim() && !type && !since) {
      return reply.status(400).send({ error: 'Au moins un critère de recherche requis' })
    }

    const dateFilter = since ? getDateFilter(since) : undefined

    const files = await prisma.file.findMany({
      where: {
        userId: req.user.id,
        trashItems: { none: {} },
        ...(q && { name: { contains: q.trim(), mode: 'insensitive' } }),
        ...(type && { mimeType: { startsWith: getMimePrefix(type) } }),
        ...(dateFilter && { updatedAt: { gte: dateFilter } }),
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    })

    const folders = await prisma.folder.findMany({
      where: {
        userId: req.user.id,
        trashItems: { none: {} },
        ...(q && { name: { contains: q.trim(), mode: 'insensitive' } }),
        ...(dateFilter && { updatedAt: { gte: dateFilter } }),
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    })

    return reply.send({ files, folders })
  })
}

export default async function dashboardRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  app.get('/', async (req, reply) => {
    const userId = req.user.id

    // Quota
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { quotaBytes: true, usedBytes: true },
    })

    // Répartition par type MIME
    const files = await prisma.file.findMany({
      where: { userId, trashItems: { none: {} } },
      select: { mimeType: true, sizeBytes: true },
    })

    const breakdown = files.reduce<Record<string, bigint>>((acc, f) => {
      const category = getMimeCategory(f.mimeType)
      acc[category] = (acc[category] ?? BigInt(0)) + f.sizeBytes
      return acc
    }, {})

    // 5 derniers fichiers modifiés
    const recentFiles = await prisma.file.findMany({
      where: { userId, trashItems: { none: {} } },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true, name: true, mimeType: true, sizeBytes: true, updatedAt: true, folderId: true,
      },
    })

    return reply.send({
      quota: {
        used: user?.usedBytes ?? BigInt(0),
        total: user?.quotaBytes ?? BigInt(0),
      },
      breakdown,
      recentFiles,
    })
  })
}

// ==============================
// UTILS
// ==============================

function getDateFilter(since: string): Date {
  const now = new Date()
  if (since === 'today') now.setHours(0, 0, 0, 0)
  if (since === 'week') now.setDate(now.getDate() - 7)
  if (since === 'month') now.setMonth(now.getMonth() - 1)
  return now
}

function getMimePrefix(type: string): string {
  const map: Record<string, string> = {
    image: 'image/',
    video: 'video/',
    audio: 'audio/',
    pdf: 'application/pdf',
    text: 'text/',
  }
  return map[type] ?? type
}

function getMimeCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'Images'
  if (mimeType.startsWith('video/')) return 'Vidéos'
  if (mimeType.startsWith('audio/')) return 'Audio'
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType.startsWith('text/')) return 'Textes'
  return 'Autres'
}
