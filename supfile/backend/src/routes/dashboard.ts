import { FastifyInstance } from 'fastify'
import { authenticate } from '../middlewares/authenticate'
import { prisma } from '../utils/prisma'

function getMimeCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'Images'
  if (mimeType.startsWith('video/')) return 'Vidéos'
  if (mimeType.startsWith('audio/')) return 'Audio'
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType.startsWith('text/')) return 'Textes'
  return 'Autres'
}

export default async function dashboardRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  app.get('/', async (req, reply) => {
    const userId = req.user.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { quotaBytes: true, usedBytes: true },
    })

    const allFiles = await prisma.file.findMany({
      where: { userId, trashItems: { none: {} } },
      select: { mimeType: true, sizeBytes: true },
    })

    const breakdown = allFiles.reduce<Record<string, string>>((acc, f) => {
      const category = getMimeCategory(f.mimeType)
      const current = BigInt(acc[category] ?? '0')
      acc[category] = (current + f.sizeBytes).toString()
      return acc
    }, {})

    const recentFiles = await prisma.file.findMany({
      where: { userId, trashItems: { none: {} } },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true, name: true, mimeType: true,
        sizeBytes: true, updatedAt: true, folderId: true,
      },
    })

    return reply.send({
      quota: {
        used: user?.usedBytes?.toString() ?? '0',
        total: user?.quotaBytes?.toString() ?? '0',
      },
      breakdown,
      recentFiles: recentFiles.map(f => ({ ...f, sizeBytes: f.sizeBytes.toString() })),
    })
  })
}
