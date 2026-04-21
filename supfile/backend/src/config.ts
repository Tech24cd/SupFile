import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL requis'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET trop court (min 32 chars)'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET trop court'),
  STORAGE_PATH: z.string().default('/app/storage'),
  MAX_FILE_SIZE: z.coerce.number().default(524288000), // 500 Mo
  USER_QUOTA_BYTES: z.coerce.bigint().default(BigInt(32212254720)), // 30 Go
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  OAUTH_GOOGLE_CLIENT_ID: z.string().optional(),
  OAUTH_GOOGLE_CLIENT_SECRET: z.string().optional(),
  OAUTH_GITHUB_CLIENT_ID: z.string().optional(),
  OAUTH_GITHUB_CLIENT_SECRET: z.string().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Variables d\'environnement invalides :')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
