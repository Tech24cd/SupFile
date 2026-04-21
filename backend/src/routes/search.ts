import { FastifyInstance } from 'fastify'
import { authenticate } from '../middlewares/authenticate'
import { prisma } from '../utils/prisma'

export default async function searchRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  app.get('/', async (req, reply) => {
    const { q, type, since } = req.query as {
      q?: string
      type?: string
      since?: string
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
