import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import { env } from './config'


(BigInt.prototype as any).toJSON = function () {
  return this.toString()
}

const app = Fastify({
  logger: {
    level: env.NODE_ENV === 'production' ? 'warn' : 'info',
    transport: env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
})

// ==============================
// PLUGINS
// ==============================

app.register(cors, {
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflight: true,
  strictPreflight: false,
})

app.register(jwt, {
  secret: env.JWT_SECRET,
})

app.register(multipart, {
  limits: {
    fileSize: env.MAX_FILE_SIZE,
  },
})

// ==============================
// ROUTES — on les branche ici au fur et à mesure
// ==============================

app.register(import('./routes/auth'), { prefix: '/api/auth' })
app.register(import('./routes/files'), { prefix: '/api/files' })
app.register(import('./routes/folders'), { prefix: '/api/folders' })
app.register(import('./routes/share'), { prefix: '/api/share' })
app.register(import('./routes/user'), { prefix: '/api/user' })
app.register(import('./routes/search'), { prefix: '/api/search' })
app.register(import('./routes/dashboard'), { prefix: '/api/dashboard' })

// Health check
app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

// ==============================
// DÉMARRAGE
// ==============================

const start = async () => {
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' })
    console.log(`🚀 SUPFile API running on port ${env.PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
