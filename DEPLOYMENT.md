# Guide de Déploiement sur Coolify

## Structure du Projet

Le projet est maintenant organisé en 3 parties :

```
smart-pos/
├── frontend/     # Application React (Vite)
├── backend/      # API Node.js/Express
└── shared/       # Code partagé (types, constants)
```

## Déploiement sur Coolify

### 1. Backend (API)

**Configuration Coolify :**
- Type: Dockerfile
- Port: 3001
- Build Path: `backend`
- Dockerfile: `backend/Dockerfile`

**Variables d'environnement :**
```
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://lsujhpaxdsirlnllangt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres.lsujhpaxdsirlnllangt:kRzdl8ia5kSMJ4UV@aws-1-eu-central-1.pooler.supabase.com:6543/postgres
```

### 2. Frontend (React)

**Configuration Coolify :**
- Type: Dockerfile
- Port: 80
- Build Path: `frontend`
- Dockerfile: `frontend/Dockerfile`

**Variables d'environnement :**
```
VITE_API_URL=https://votre-backend-url.com
VITE_SUPABASE_URL=https://lsujhpaxdsirlnllangt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Développement Local

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
