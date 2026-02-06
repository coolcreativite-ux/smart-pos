# Guide pour pousser la nouvelle structure sur GitHub

## Verification

Tous les fichiers essentiels sont en place :
- frontend/ avec Dockerfile, package.json, nginx.conf
- backend/ avec Dockerfile, package.json, server.ts
- shared/ avec types.ts et constants.ts
- Configuration Docker et Coolify

## Commandes Git

### 1. Verifier le statut
```bash
git status
```

### 2. Ajouter tous les nouveaux fichiers
```bash
git add .
```

### 3. Creer un commit
```bash
git commit -m "refactor: Reorganisation en monorepo frontend/backend pour Coolify"
```

### 4. Pousser vers GitHub
```bash
git push origin main
```

## Apres le push

### Configuration Coolify - Backend
1. Creer un nouveau service
2. Type: Dockerfile
3. Repository: https://github.com/coolcreativite-ux/smart-pos.git
4. Branch: main
5. Build Path: backend
6. Dockerfile: backend/Dockerfile
7. Port: 3001
8. Variables d'environnement (voir backend/.env.production)

### Configuration Coolify - Frontend
1. Creer un nouveau service
2. Type: Dockerfile
3. Repository: https://github.com/coolcreativite-ux/smart-pos.git
4. Branch: main
5. Build Path: frontend
6. Dockerfile: frontend/Dockerfile
7. Port: 80
8. Variables d'environnement:
   - VITE_API_URL=https://votre-backend-url.com
   - VITE_SUPABASE_URL=https://lsujhpaxdsirlnllangt.supabase.co
   - VITE_SUPABASE_ANON_KEY=votre_cle

## Structure finale sur GitHub

```
smart-pos/
├── frontend/          # React app
├── backend/           # Node.js API
├── shared/            # Code partage
├── database/          # SQL scripts
├── docker-compose.yml
├── DEPLOYMENT.md
└── README.md
```
