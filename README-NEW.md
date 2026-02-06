# Smart POS - Point de Vente Intelligent

Système de point de vente moderne avec gestion d'inventaire, multi-magasins et analytics.

## 🏗️ Architecture

Ce projet utilise une architecture monorepo avec séparation frontend/backend :

- **Frontend**: Application React avec Vite
- **Backend**: API Node.js/Express avec TypeScript
- **Shared**: Types et constantes partagés
- **Database**: PostgreSQL via Supabase

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 20+
- npm ou yarn
- Compte Supabase (pour la base de données)

### Installation

**Backend:**
```bash
cd backend
npm install
cp .env.example .env.production
# Configurer les variables d'environnement
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env.production
# Configurer les variables d'environnement
npm run dev
```

## 📦 Déploiement sur Coolify

Voir [DEPLOYMENT.md](./DEPLOYMENT.md) pour les instructions détaillées.

### Configuration rapide

1. **Backend**: 
   - Build Path: `backend`
   - Port: 3001
   - Dockerfile: `backend/Dockerfile`

2. **Frontend**:
   - Build Path: `frontend`
   - Port: 80
   - Dockerfile: `frontend/Dockerfile`

## 📚 Documentation

- [Guide de déploiement](./DEPLOYMENT.md)
- [Structure du projet](./README-STRUCTURE.md)
- [Migration Git](./GIT-MIGRATION.md)

## 🔧 Technologies

- React 19
- TypeScript
- Express
- PostgreSQL (Supabase)
- Vite
- Docker
