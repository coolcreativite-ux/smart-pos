# Smart POS - Structure Monorepo

## 📁 Structure du Projet

```
smart-pos/
├── frontend/              # Application React
│   ├── components/        # Composants React
│   ├── contexts/          # Contexts React
│   ├── hooks/             # Custom hooks
│   ├── pages/             # Pages de l'application
│   ├── styles/            # Fichiers CSS
│   ├── utils/             # Utilitaires frontend
│   ├── public/            # Assets statiques
│   ├── Dockerfile         # Docker pour production
│   ├── nginx.conf         # Configuration Nginx
│   └── package.json       # Dépendances frontend
│
├── backend/               # API Node.js/Express
│   ├── server/            # Code serveur
│   ├── services/          # Services (email, etc.)
│   ├── lib/               # Bibliothèques backend
│   ├── scripts/           # Scripts utilitaires
│   ├── server.ts          # Point d'entrée
│   ├── Dockerfile         # Docker pour production
│   └── package.json       # Dépendances backend
│
├── shared/                # Code partagé
│   ├── types.ts           # Types TypeScript
│   └── constants.ts       # Constantes
│
├── database/              # Scripts SQL
│   ├── schema.sql
│   └── setup.sql
│
├── docker-compose.yml     # Orchestration Docker
└── DEPLOYMENT.md          # Guide de déploiement
```

## 🚀 Démarrage Rapide

### Développement Local

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Production avec Docker

```bash
docker-compose up -d
```

## 📝 Notes

- Les fichiers `.env` ne sont pas versionnés
- Utilisez `.env.example` comme template
- Le frontend communique avec le backend via proxy en dev
- En production, configurez `VITE_API_URL` dans le frontend
