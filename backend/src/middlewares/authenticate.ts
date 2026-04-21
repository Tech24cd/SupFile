import { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../utils/prisma'

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify()
    const payload = req.user as { id: string }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, username: true, quotaBytes: true, usedBytes: true },
    })

    if (!user) {
      return reply.status(401).send({ error: 'Utilisateur introuvable' })
    }

    // On attache l'user complet à la requête pour les controllers
    req.user = user
  } catch {
    return reply.status(401).send({ error: 'Token invalide ou expiré' })
  }
}
