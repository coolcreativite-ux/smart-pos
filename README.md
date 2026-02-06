<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Smart POS - Point de Vente Intelligent

Système de point de vente moderne avec gestion d'inventaire, multi-magasins, analytics et intégration Supabase.

## 🏗️ Architecture Monorepo

Ce projet utilise une architecture monorepo avec séparation frontend/backend pour faciliter le déploiement sur Coolify :

```
smart-pos/
├── frontend/          # Application React (Vite + TypeScript)
├── backend/           # API Node.js/Express
├── shared/            # Types et constantes partagés
└── database/          # Scripts SQL (Supabase/PostgreSQL)
```

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 20+
- Compte Supabase (base de données PostgreSQL)
- Clé API Gemini (optionnel)

### Installation Locale

**Backend :**
```bash
cd backend
npm install
cp .env.example .env.production
# Configurer les variables d'environnement
npm run dev
```

**Frontend :**
```bash
cd frontend
npm install
cp .env.example .env.production
# Configurer les variables d'environnement
npm run dev
```

Le frontend sera accessible sur `http://localhost:3000` et le backend sur `http://localhost:3001`.

## 📦 Déploiement sur Coolify

### Configuration rapide

1. **Backend** :
   - Repository : `https://github.com/coolcreativite-ux/smart-pos.git`
   - Build Path : `backend`
   - Dockerfile : `backend/Dockerfile`
   - Port : `3001`

2. **Frontend** :
   - Repository : `https://github.com/coolcreativite-ux/smart-pos.git`
   - Build Path : `frontend`
   - Dockerfile : `frontend/Dockerfile`
   - Port : `80`

📖 **Guide complet** : Voir [COOLIFY-SETUP.md](./COOLIFY-SETUP.md) et [PRE-DEPLOY-CHECKLIST.md](./PRE-DEPLOY-CHECKLIST.md)

## 🔧 Technologies

**Frontend :**
- React 19
- TypeScript
- Vite
- Recharts (analytics)
- Supabase Client

**Backend :**
- Node.js
- Express
- TypeScript
- PostgreSQL (Supabase)
- Gemini AI (optionnel)

**Infrastructure :**
- Docker
- Nginx
- Coolify

## 📚 Documentation

- [COOLIFY-SETUP.md](./COOLIFY-SETUP.md) - Configuration Coolify détaillée
- [PRE-DEPLOY-CHECKLIST.md](./PRE-DEPLOY-CHECKLIST.md) - Checklist avant déploiement
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guide de déploiement général
- [README-STRUCTURE.md](./README-STRUCTURE.md) - Structure du projet
- [GIT-MIGRATION.md](./GIT-MIGRATION.md) - Migration vers monorepo

## 🔐 Configuration

### Variables d'environnement Backend
```env
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre_cle_anon
DATABASE_URL=postgresql://...
```

### Variables d'environnement Frontend
```env
VITE_API_URL=https://votre-backend-url.com
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon
VITE_GEMINI_API_KEY=votre_cle_gemini
```

## 🤝 Contribution

Ce projet est en développement actif. Pour contribuer :
1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Projet privé - Tous droits réservés

## 🔗 Liens

- Repository : https://github.com/coolcreativite-ux/smart-pos.git
- AI Studio : https://ai.studio/apps/drive/1OmlarlJB-4s5267-s2mHNP4L_VaiaAWf
