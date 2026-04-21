import { FastifyInstance } from 'fastify'
import { prisma } from './prisma'
import { createSession } from '../services/auth.service'
import { nanoid } from 'nanoid'

export function generateAccessToken(app: FastifyInstance, userId: string) {
  return app.jwt.sign({ id: userId }, { expiresIn: '15m' })
}

export async function generateRefreshToken(app: FastifyInstance, userId: string) {
  const token = nanoid(64)
  await createSession(userId, token)
  return token
}

export async function rotateRefreshToken(app: FastifyInstance, oldToken: string, userId: string) {
  // Supprime l'ancien, crée un nouveau — rotation sécurisée
  await prisma.session.deleteMany({ where: { refreshToken: oldToken } })
  return generateRefreshToken(app, userId)
}
