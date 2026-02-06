# Migration Git vers la nouvelle structure

## Étapes pour pousser la nouvelle structure sur GitHub

### 1. Vérifier les changements
```bash
git status
```

### 2. Ajouter tous les nouveaux fichiers
```bash
git add .
```

### 3. Créer un commit avec la nouvelle structure
```bash
git commit -m "refactor: Réorganisation en monorepo (frontend/backend/shared)"
```

### 4. Pousser vers GitHub
```bash
git push origin main
```

## Structure après migration

```
smart-pos/
├── frontend/     # Application React
├── backend/      # API Node.js
├── shared/       # Code partagé
└── database/     # Scripts SQL
```

## Notes importantes

- Les anciens fichiers à la racine sont maintenant dans `.gitignore`
- Les fichiers `.env` sont protégés et ne seront pas poussés
- La structure est maintenant prête pour Coolify
- Chaque partie (frontend/backend) peut être déployée indépendamment
