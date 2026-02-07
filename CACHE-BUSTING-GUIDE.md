# Guide du Système de Cache-Busting Automatique 🔄

## 🎯 Objectif

Permettre aux utilisateurs de voir automatiquement les nouvelles versions de l'application sans avoir à vider manuellement le cache de leur navigateur.

---

## ✅ Fonctionnalités Implémentées

### 1. Hash Automatique des Fichiers (Vite)

**Fichier** : `frontend/vite.config.ts`

Vite génère automatiquement des noms de fichiers avec hash unique :
- `main.js` → `main.a1b2c3d4.js`
- `style.css` → `style.e5f6g7h8.css`

**Avantage** : Chaque déploiement génère de nouveaux noms de fichiers, forçant le navigateur à télécharger les nouvelles versions.

```typescript
output: {
  entryFileNames: 'assets/[name].[hash].js',
  chunkFileNames: 'assets/[name].[hash].js',
  assetFileNames: 'assets/[name].[hash].[ext]'
}
```

---

### 2. Headers HTTP Optimisés (Nginx)

**Fichier** : `frontend/nginx.conf`

#### Stratégie de Cache

| Fichier | Stratégie | Durée | Raison |
|---------|-----------|-------|--------|
| `index.html` | NO CACHE | 0 | Toujours récupérer la dernière version |
| `sw.js` | NO CACHE | 0 | Service Worker doit être à jour |
| `manifest.json` | NO CACHE | 0 | Métadonnées de l'app |
| `/assets/*.js` | CACHE LONG | 1 an | Hash unique, immutable |
| `/assets/*.css` | CACHE LONG | 1 an | Hash unique, immutable |
| Images/Fonts | CACHE COURT | 7 jours | Peuvent changer |

#### Headers pour index.html
```nginx
location = /index.html {
    add_header Cache-Control "no-cache, no-store, must-revalidate" always;
    add_header Pragma "no-cache" always;
    add_header Expires "0" always;
}
```

#### Headers pour les assets avec hash
```nginx
location ~* ^/assets/.*\.(js|css)$ {
    expires 1y;
    add_header Cache-Control "public, immutable" always;
}
```

---

### 3. Service Worker Intelligent

**Fichier** : `frontend/sw.js`

#### Version du Cache
```javascript
const CACHE_VERSION = 'v4'; // INCRÉMENTER À CHAQUE DÉPLOIEMENT
```

#### Stratégies de Cache

1. **Network First pour index.html**
   - Toujours récupérer depuis le réseau
   - Fallback sur le cache si hors ligne

2. **Network First pour les API**
   - Données toujours fraîches
   - Fallback sur le cache si hors ligne

3. **Network First pour les assets**
   - Récupérer les nouveaux fichiers avec hash
   - Mettre en cache pour utilisation hors ligne

#### Détection Automatique des Mises à Jour

Le Service Worker :
- S'installe immédiatement (`skipWaiting()`)
- Prend le contrôle de tous les clients (`claim()`)
- Supprime les anciens caches
- Notifie les clients qu'une nouvelle version est disponible

```javascript
self.addEventListener('activate', (event) => {
  // Notifier tous les clients
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'NEW_VERSION',
        version: CACHE_VERSION
      });
    });
  });
});
```

---

### 4. Notification de Mise à Jour (React)

**Fichier** : `frontend/components/UpdateNotification.tsx`

#### Fonctionnalités

1. **Détection Automatique**
   - Écoute les messages du Service Worker
   - Vérifie les mises à jour toutes les 5 minutes
   - Vérifie quand l'utilisateur revient sur l'onglet

2. **Notification Visuelle**
   - Affichage en bas à droite
   - Design moderne avec gradient
   - Animation d'apparition

3. **Actions Utilisateur**
   - **Mettre à jour maintenant** : Recharge la page immédiatement
   - **Plus tard** : Masque la notification (réapparaîtra au prochain check)

#### Code de Vérification
```typescript
// Vérifier les mises à jour toutes les 5 minutes
const checkForUpdates = () => {
  navigator.serviceWorker.getRegistration().then((registration) => {
    if (registration) {
      registration.update();
    }
  });
};

// Vérifier aussi quand l'utilisateur revient sur l'onglet
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    checkForUpdates();
  }
});
```

---

## 🔄 Workflow de Mise à Jour

### Scénario : Nouveau Déploiement

1. **Développeur** : Push le code sur GitHub
2. **Coolify** : Build et déploie la nouvelle version
3. **Vite** : Génère de nouveaux fichiers avec hash
   - `main.a1b2c3d4.js` → `main.x9y8z7w6.js`
4. **Nginx** : Sert le nouveau `index.html` (no-cache)
5. **Navigateur** : Télécharge le nouveau `index.html`
6. **Service Worker** : Détecte la nouvelle version
7. **React** : Affiche la notification de mise à jour
8. **Utilisateur** : Clique sur "Mettre à jour maintenant"
9. **Navigateur** : Recharge la page avec les nouveaux fichiers

### Timeline

```
T+0s    : Déploiement sur Coolify
T+30s   : Build terminé, nouvelle version en ligne
T+1min  : Utilisateur visite l'app
T+1min  : Service Worker détecte la nouvelle version
T+1min  : Notification affichée
T+1min  : Utilisateur clique "Mettre à jour"
T+1min  : Page rechargée avec la nouvelle version ✅
```

---

## 🧪 Tests

### Test 1 : Vérifier le Hash des Fichiers

1. Déployer l'application
2. Ouvrir DevTools > Network
3. Vérifier que les fichiers JS/CSS ont un hash :
   ```
   main.a1b2c3d4.js
   style.e5f6g7h8.css
   ```

### Test 2 : Vérifier les Headers HTTP

```bash
# Vérifier index.html (doit être no-cache)
curl -I https://smartpos.cooldigital.africa/

# Vérifier un asset (doit être immutable)
curl -I https://smartpos.cooldigital.africa/assets/main.a1b2c3d4.js
```

**Résultat attendu** :
- `index.html` : `Cache-Control: no-cache, no-store, must-revalidate`
- `main.js` : `Cache-Control: public, immutable`

### Test 3 : Vérifier le Service Worker

1. Ouvrir DevTools > Application > Service Workers
2. Vérifier que le SW est actif
3. Vérifier la version du cache dans Console :
   ```javascript
   caches.keys().then(console.log)
   // Résultat : ["gemini-pos-v4"]
   ```

### Test 4 : Simuler une Mise à Jour

1. Modifier `CACHE_VERSION` dans `sw.js` : `v4` → `v5`
2. Déployer
3. Ouvrir l'application
4. Attendre 5 secondes
5. Vérifier que la notification apparaît

---

## 🔧 Maintenance

### Incrémenter la Version du Cache

**Quand** : À chaque déploiement avec changements significatifs

**Comment** :
1. Ouvrir `frontend/sw.js`
2. Modifier `CACHE_VERSION` :
   ```javascript
   const CACHE_VERSION = 'v5'; // v4 → v5
   ```
3. Commit et push

**Automatisation** : Vous pouvez automatiser cela avec un script :

```javascript
// scripts/bump-cache-version.js
const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '../frontend/sw.js');
let content = fs.readFileSync(swPath, 'utf8');

// Extraire la version actuelle
const match = content.match(/CACHE_VERSION = 'v(\d+)'/);
if (match) {
  const currentVersion = parseInt(match[1]);
  const newVersion = currentVersion + 1;
  
  // Remplacer
  content = content.replace(
    /CACHE_VERSION = 'v\d+'/,
    `CACHE_VERSION = 'v${newVersion}'`
  );
  
  fs.writeFileSync(swPath, content);
  console.log(`✅ Version du cache mise à jour : v${currentVersion} → v${newVersion}`);
}
```

**Utilisation** :
```bash
node scripts/bump-cache-version.js
git add frontend/sw.js
git commit -m "chore: bump cache version"
git push
```

---

## 📊 Monitoring

### Métriques à Surveiller

1. **Taux de mise à jour**
   - Combien d'utilisateurs cliquent sur "Mettre à jour maintenant"
   - Combien cliquent sur "Plus tard"

2. **Temps de détection**
   - Temps entre le déploiement et la notification

3. **Erreurs de cache**
   - Erreurs lors du chargement des assets
   - Erreurs du Service Worker

### Logs à Vérifier

**Console du navigateur** :
```
[SW] Installation de la nouvelle version: v5
[SW] Cache ouvert: gemini-pos-v5
[SW] Suppression de l'ancien cache: gemini-pos-v4
[SW] Activation de la nouvelle version: v5
[Update] Nouvelle version détectée: v5
[Update] Vérification des mises à jour...
```

---

## 🚨 Dépannage

### Problème 1 : La notification n'apparaît pas

**Causes possibles** :
1. Service Worker non enregistré
2. Version du cache non incrémentée
3. Navigateur ne supporte pas les Service Workers

**Solutions** :
1. Vérifier dans DevTools > Application > Service Workers
2. Vérifier `CACHE_VERSION` dans `sw.js`
3. Tester dans un navigateur moderne (Chrome, Firefox, Edge)

### Problème 2 : Les utilisateurs voient toujours l'ancienne version

**Causes possibles** :
1. Cache du navigateur trop agressif
2. Headers HTTP incorrects
3. Hash des fichiers non généré

**Solutions** :
1. Vérifier les headers avec `curl -I`
2. Vérifier la config Nginx
3. Vérifier la config Vite

### Problème 3 : Erreur "Failed to fetch"

**Causes possibles** :
1. Service Worker essaie de cacher des ressources externes
2. Problème de CORS

**Solutions** :
1. Vérifier que seules les ressources locales sont cachées
2. Ajouter les headers CORS appropriés

---

## 📝 Bonnes Pratiques

### 1. Incrémenter la Version à Chaque Déploiement

✅ **Bon** :
```javascript
// Déploiement 1
const CACHE_VERSION = 'v4';

// Déploiement 2
const CACHE_VERSION = 'v5';
```

❌ **Mauvais** :
```javascript
// Oublier d'incrémenter
const CACHE_VERSION = 'v4'; // Toujours v4 !
```

### 2. Tester Localement Avant de Déployer

```bash
# Build local
cd frontend
npm run build

# Servir localement
npx serve dist

# Tester dans le navigateur
open http://localhost:3000
```

### 3. Documenter les Changements

Dans le commit message, mentionner :
- Les changements fonctionnels
- La nouvelle version du cache
- Les tests effectués

```bash
git commit -m "feat: add new feature X

- Added feature X
- Updated cache version to v5
- Tested update notification
"
```

---

## 🎯 Résultat Final

### Avant (Sans Cache-Busting)

❌ Utilisateurs doivent vider le cache manuellement
❌ Confusion : "Pourquoi je ne vois pas les changements ?"
❌ Support : Beaucoup de tickets "ça ne marche pas"

### Après (Avec Cache-Busting)

✅ Mise à jour automatique détectée
✅ Notification claire et élégante
✅ Un clic pour mettre à jour
✅ Expérience utilisateur fluide
✅ Moins de tickets support

---

## 📞 Support

Pour toute question :
- Consulter ce guide
- Vérifier les logs du Service Worker
- Tester dans DevTools
- Contacter l'équipe technique

---

**Date de création** : 7 février 2026
**Dernière mise à jour** : 7 février 2026
**Version** : 1.0
**Status** : ✅ Implémenté et testé
