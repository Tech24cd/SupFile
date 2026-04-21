# SUPFile

Plateforme de stockage cloud personnelle — alternative à Dropbox/Google Drive.

## Stack

- **Backend** : Node.js + Fastify + TypeScript
- **Frontend** : React + Vite + TypeScript
- **Mobile** : React Native + Expo
- **BDD** : PostgreSQL + Prisma ORM
- **Stockage** : Volume Docker local

## Démarrage rapide

### Prérequis

- Docker Desktop (Mac : [download](https://www.docker.com/products/docker-desktop/))
- Node.js 20+ (pour le dev mobile)

### Installation

```bash
# Clone
git clone https://github.com/ton-user/supfile.git
cd supfile

# Config — remplis les variables nécessaires
cp .env.example .env

# Lance tout
docker compose up --build
```

L'app est dispo sur :
- Web : http://localhost:8080
- API : http://localhost:3000

### Dev en local (sans Docker)

```bash
# Backend
cd backend
npm install
npm run dev

# Web
cd web
npm install
npm run dev

# Mobile
cd mobile
npm install
npx expo start
```

## Structure

```
supfile/
├── backend/        # API Fastify
├── web/            # React SPA
├── mobile/         # Expo (React Native)
└── docker-compose.yml
```

## Documentation

Voir `/docs` pour la documentation technique et le manuel utilisateur.
