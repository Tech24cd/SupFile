FROM node:20-alpine AS base
WORKDIR /app

# Dépendances
FROM base AS deps
COPY package*.json ./
RUN npm ci

# Build
FROM deps AS build
COPY . .
RUN npx prisma generate
RUN npm run build

# Image finale — légère
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 fastify

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY package.json ./

# Dossier de stockage des fichiers
RUN mkdir -p /app/storage && chown fastify:nodejs /app/storage

USER fastify

EXPOSE ${PORT:-3000}

# Migrations + démarrage
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
