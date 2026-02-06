# Configuration Coolify - Smart POS

## Repository GitHub
https://github.com/coolcreativite-ux/smart-pos.git

## Architecture
Le projet est organisé en monorepo avec 2 services indépendants :
- **Backend** : API Node.js/Express (Port 3001)
- **Frontend** : Application React/Vite (Port 80)

---

## 1. Service Backend

### Configuration de base
- **Nom** : smart-pos-backend
- **Type** : Dockerfile
- **Repository** : https://github.com/coolcreativite-ux/smart-pos.git
- **Branch** : main
- **Build Context** : backend
- **Dockerfile Path** : backend/Dockerfile
- **Port** : 3001

### Variables d'environnement
```env
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://lsujhpaxdsirlnllangt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzdWpocGF4ZHNpcmxubGxhbmd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzODQyNjgsImV4cCI6MjA4NTk2MDI2OH0.PT_-sZIjMODHmcndBjH16UWbco6L0ca6BsVmbaNvQ30
DATABASE_URL=postgresql://postgres.lsujhpaxdsirlnllangt:kRzdl8ia5kSMJ4UV@aws-1-eu-central-1.pooler.supabase.com:6543/postgres
```

### Health Check (optionnel)
- **Path** : /health
- **Interval** : 30s

---

## 2. Service Frontend

### Configuration de base
- **Nom** : smart-pos-frontend
- **Type** : Dockerfile
- **Repository** : https://github.com/coolcreativite-ux/smart-pos.git
- **Branch** : main
- **Build Context** : frontend
- **Dockerfile Path** : frontend/Dockerfile
- **Port** : 80

### Variables d'environnement
```env
VITE_API_URL=https://[URL-DE-VOTRE-BACKEND]
VITE_SUPABASE_URL=https://lsujhpaxdsirlnllangt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzdWpocGF4ZHNpcmxubGxhbmd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzODQyNjgsImV4cCI6MjA4NTk2MDI2OH0.PT_-sZIjMODHmcndBjH16UWbco6L0ca6BsVmbaNvQ30
VITE_GEMINI_API_KEY=VOTRE_CLE_GEMINI
```

**Important** : Remplacez `[URL-DE-VOTRE-BACKEND]` par l'URL générée par Coolify pour le backend.

---

## Ordre de déploiement

1. **Déployer le Backend en premier**
   - Créer le service backend dans Coolify
   - Configurer les variables d'environnement
   - Déployer
   - Noter l'URL générée (ex: https://backend-xxx.coolify.app)

2. **Déployer le Frontend ensuite**
   - Créer le service frontend dans Coolify
   - Configurer les variables d'environnement
   - **Mettre à jour VITE_API_URL avec l'URL du backend**
   - Déployer

---

## Vérification

### Backend
```bash
curl https://[URL-BACKEND]/health
```

### Frontend
Ouvrir l'URL du frontend dans un navigateur

---

## Troubleshooting

### Le frontend ne peut pas se connecter au backend
- Vérifier que VITE_API_URL pointe vers la bonne URL
- Vérifier que le backend est bien démarré
- Vérifier les logs du backend dans Coolify

### Erreurs de base de données
- Vérifier DATABASE_URL dans le backend
- Vérifier que la base Supabase est accessible
- Vérifier les credentials dans la chaîne de connexion

### Build qui échoue
- Vérifier les logs de build dans Coolify
- Vérifier que le Dockerfile est correct
- Vérifier que toutes les dépendances sont dans package.json
