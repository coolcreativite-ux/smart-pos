# Checklist Pré-Déploiement Coolify

## ✅ Vérifications locales

### Structure du projet
- [x] Dossier `frontend/` avec tous les fichiers
- [x] Dossier `backend/` avec tous les fichiers
- [x] Dossier `shared/` avec types.ts et constants.ts
- [x] Dockerfiles présents dans frontend/ et backend/
- [x] Fichiers .env.example présents

### Frontend
- [x] `frontend/App.tsx`
- [x] `frontend/index.tsx`
- [x] `frontend/index.html`
- [x] `frontend/package.json`
- [x] `frontend/Dockerfile`
- [x] `frontend/nginx.conf`
- [x] `frontend/vite.config.ts`
- [x] `frontend/tsconfig.json`

### Backend
- [x] `backend/server.ts`
- [x] `backend/package.json`
- [x] `backend/Dockerfile`
- [x] `backend/tsconfig.json`
- [x] `backend/lib/database.ts`
- [x] `backend/services/`

### GitHub
- [x] Code poussé sur https://github.com/coolcreativite-ux/smart-pos.git
- [x] Branch `main` à jour
- [x] Fichiers .env exclus du repo

---

## 🔧 Configuration Coolify

### Étape 1 : Backend

**Configuration :**
```
Repository: https://github.com/coolcreativite-ux/smart-pos.git
Branch: main
Build Pack: Dockerfile
Base Directory: backend
Dockerfile: backend/Dockerfile
Port: 3001
```

**Variables d'environnement :**
```env
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://lsujhpaxdsirlnllangt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzdWpocGF4ZHNpcmxubGxhbmd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzODQyNjgsImV4cCI6MjA4NTk2MDI2OH0.PT_-sZIjMODHmcndBjH16UWbco6L0ca6BsVmbaNvQ30
DATABASE_URL=postgresql://postgres.lsujhpaxdsirlnllangt:kRzdl8ia5kSMJ4UV@aws-1-eu-central-1.pooler.supabase.com:6543/postgres
```

**Actions :**
- [ ] Service créé dans Coolify
- [ ] Variables d'environnement configurées
- [ ] Premier déploiement lancé
- [ ] URL du backend notée : `_______________________`
- [ ] Test de l'API : `curl https://[URL-BACKEND]/health`

---

### Étape 2 : Frontend

**Configuration :**
```
Repository: https://github.com/coolcreativite-ux/smart-pos.git
Branch: main
Build Pack: Dockerfile
Base Directory: frontend
Dockerfile: frontend/Dockerfile
Port: 80
```

**Variables d'environnement :**
```env
VITE_API_URL=https://[URL-DU-BACKEND]
VITE_SUPABASE_URL=https://lsujhpaxdsirlnllangt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzdWpocGF4ZHNpcmxubGxhbmd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzODQyNjgsImV4cCI6MjA4NTk2MDI2OH0.PT_-sZIjMODHmcndBjH16UWbco6L0ca6BsVmbaNvQ30
VITE_GEMINI_API_KEY=VOTRE_CLE_GEMINI_ICI
```

**⚠️ IMPORTANT :** Remplacer `[URL-DU-BACKEND]` par l'URL obtenue à l'étape 1

**Actions :**
- [ ] Service créé dans Coolify
- [ ] Variables d'environnement configurées (avec URL backend)
- [ ] Premier déploiement lancé
- [ ] URL du frontend notée : `_______________________`
- [ ] Test dans le navigateur

---

## 🧪 Tests Post-Déploiement

### Backend
- [ ] L'API répond : `curl https://[URL-BACKEND]/health`
- [ ] Connexion à la base de données OK
- [ ] Logs sans erreurs critiques

### Frontend
- [ ] Page d'accueil s'affiche
- [ ] Connexion au backend fonctionne
- [ ] Connexion à Supabase fonctionne
- [ ] Pas d'erreurs dans la console navigateur

### Intégration
- [ ] Login fonctionne
- [ ] Données chargées depuis la base
- [ ] Toutes les fonctionnalités principales testées

---

## 📚 Documentation

- [COOLIFY-SETUP.md](./COOLIFY-SETUP.md) - Guide détaillé Coolify
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guide de déploiement général
- [README-STRUCTURE.md](./README-STRUCTURE.md) - Structure du projet

---

## 🆘 Troubleshooting

### Build échoue
1. Vérifier les logs de build dans Coolify
2. Vérifier que le Dockerfile est correct
3. Vérifier que package.json contient toutes les dépendances

### Frontend ne se connecte pas au backend
1. Vérifier VITE_API_URL dans les variables d'environnement
2. Vérifier que le backend est démarré
3. Vérifier les CORS dans le backend

### Erreurs de base de données
1. Vérifier DATABASE_URL
2. Tester la connexion depuis un autre outil
3. Vérifier les credentials Supabase
