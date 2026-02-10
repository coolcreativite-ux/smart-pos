# 🔍 Guide de Débogage - Logos en Production

## Problème
Les logos uploadés dans l'Administration Système ne s'affichent pas en production.

## Cause Identifiée
Le fichier `frontend/constants.ts` construisait l'URL de l'API manuellement avec `window.location.hostname:5000` au lieu d'utiliser la configuration centralisée `API_URL` de `config.ts`.

## Solution Appliquée
✅ Modification de `frontend/constants.ts` pour utiliser `API_URL` depuis `config.ts`
✅ Création d'un outil de test: `frontend/test-logo-production.html`

## Comment Tester en Production

### Étape 1: Accéder à l'outil de test
Ouvrez dans votre navigateur:
```
https://smartpos.cooldigital.africa/test-logo-production.html
```

### Étape 2: Vider le cache
1. Cliquez sur "🗑️ Vider le Cache"
2. Vérifiez que le message de succès s'affiche

### Étape 3: Tester l'API
1. Cliquez sur "🔌 Tester l'API"
2. Vérifiez que les URLs des logos s'affichent correctement
3. Les URLs doivent ressembler à:
   - `https://api.smartpos.cooldigital.africa/uploads/logos/logo-xxxxx.png`
   - OU une URL externe comme `https://i.imgur.com/xxxxx.png`

### Étape 4: Prévisualiser les logos
1. Cliquez sur "🖼️ Prévisualiser"
2. Les logos doivent s'afficher dans la page
3. Si erreur de chargement, vérifier:
   - Le fichier existe bien sur le serveur backend
   - Le serveur backend sert bien les fichiers statiques via `/uploads`
   - Les permissions du dossier `backend/uploads/logos/` sont correctes

### Étape 5: Recharger l'application
1. Cliquez sur "🔄 Recharger l'App"
2. Les logos doivent maintenant s'afficher dans l'application

## Vérifications Backend

### 1. Vérifier que le dossier existe
```bash
ls -la backend/uploads/logos/
```

### 2. Vérifier les permissions
```bash
chmod -R 755 backend/uploads/
```

### 3. Vérifier que le backend sert les fichiers statiques
Dans `backend/server.ts`, cette ligne doit être présente:
```typescript
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

### 4. Tester l'accès direct au fichier
Ouvrez dans le navigateur:
```
https://api.smartpos.cooldigital.africa/uploads/logos/[nom-du-fichier].png
```

## Vérifications Frontend

### 1. Vérifier la configuration de l'API
Dans `frontend/.env.production`:
```env
VITE_API_URL=https://api.smartpos.cooldigital.africa
```

### 2. Vérifier le cache du navigateur
Ouvrir la console du navigateur (F12) et exécuter:
```javascript
localStorage.removeItem('saas_branding_cache');
location.reload();
```

### 3. Vérifier les requêtes réseau
1. Ouvrir les DevTools (F12)
2. Onglet "Network"
3. Recharger la page
4. Chercher la requête vers `/api/app-settings`
5. Vérifier la réponse contient `saas_logo_url` et `saas_favicon_url`

## Problèmes Courants

### ❌ Erreur 404 sur `/uploads/logos/xxx.png`
**Cause**: Le fichier n'existe pas sur le serveur backend
**Solution**: 
- Ré-uploader le logo depuis l'Administration Système
- Vérifier que le dossier `backend/uploads/logos/` existe
- Vérifier les permissions du dossier

### ❌ Erreur CORS
**Cause**: Le backend ne permet pas les requêtes depuis le frontend
**Solution**: Vérifier la configuration CORS dans `backend/server.ts`:
```typescript
app.use(cors());
```

### ❌ Logo ne s'affiche pas après upload
**Cause**: Cache localStorage non vidé
**Solution**: 
```javascript
localStorage.removeItem('saas_branding_cache');
```

### ❌ URL Imgur ne fonctionne pas
**Cause**: URL incorrecte (doit être un lien direct vers l'image)
**Format correct**: `https://i.imgur.com/xxxxx.png`
**Format incorrect**: `https://imgur.com/xxxxx`

## Architecture des Logos

### Logo SaaS (Global)
- **Uploadé par**: SuperAdmin
- **Stocké dans**: Base de données (`app_settings` table)
- **Affiché dans**: Header, Login, Landing Page
- **Types**: 
  - Logo principal (rectangulaire, ratio 3.33:1)
  - Favicon (carré, ratio 1:1)

### Logo Magasin (Par Tenant)
- **Uploadé par**: Owner/Admin
- **Stocké dans**: Base de données (`stores` table)
- **Affiché dans**: Tickets/Reçus uniquement
- **Personnalisable**: Par chaque client

## Commandes Utiles

### Redéployer le frontend
```bash
cd frontend
npm run build
# Copier le contenu de dist/ vers le serveur
```

### Redémarrer le backend
```bash
cd backend
npm run dev  # ou pm2 restart en production
```

### Vérifier les logs backend
```bash
pm2 logs backend
# ou
tail -f backend/logs/error.log
```

## Contact Support
Si le problème persiste après avoir suivi ce guide, vérifier:
1. Les logs du backend
2. Les logs du serveur web (nginx/apache)
3. Les permissions des fichiers
4. La configuration DNS/SSL

---
**Dernière mise à jour**: 2026-02-10
