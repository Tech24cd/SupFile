import 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      id: string
      email: string
      username: string
      quotaBytes: bigint
      usedBytes: bigint
    }
  }
}
