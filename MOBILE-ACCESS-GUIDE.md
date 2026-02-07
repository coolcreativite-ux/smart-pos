# Guide d'Accès Mobile

## En Développement (Local)

### Problème
Lorsque vous accédez à l'application depuis un mobile sur le même réseau WiFi, `localhost` ne fonctionne pas car il fait référence au mobile lui-même, pas à votre ordinateur.

### Solution

#### 1. Trouver votre adresse IP locale

**Sur Windows :**
```bash
ipconfig
```
Cherchez "Adresse IPv4" sous votre connexion WiFi (ex: `192.168.1.100`)

**Sur Mac/Linux :**
```bash
ifconfig
```
Cherchez l'adresse IP sous votre interface WiFi (ex: `192.168.1.100`)

#### 2. Configurer l'URL de l'API

Modifiez le fichier `frontend/.env.development` :

```env
# Remplacez localhost par votre IP locale
VITE_API_URL=http://192.168.1.100:5000
```

#### 3. Redémarrer le serveur frontend

```bash
cd frontend
npm run dev
```

#### 4. Accéder depuis le mobile

Ouvrez votre navigateur mobile et allez sur :
```
http://192.168.1.100:3000
```

## En Production

### Configuration Actuelle

L'application est déjà configurée pour fonctionner en production sur mobile :

**Frontend :** `https://smartpos.cooldigital.africa`  
**Backend API :** `https://api.smartpos.cooldigital.africa`

### Accès Mobile en Production

1. **Via le domaine :** Accédez simplement à `https://smartpos.cooldigital.africa` depuis votre navigateur mobile
2. **PWA (Progressive Web App) :** L'application peut être installée sur mobile comme une app native
3. **Mode Offline :** L'application fonctionne même sans connexion internet grâce au cache

### Installation PWA sur Mobile

**Sur Android (Chrome) :**
1. Ouvrez `https://smartpos.cooldigital.africa`
2. Appuyez sur le menu (⋮) → "Ajouter à l'écran d'accueil"
3. L'icône apparaîtra sur votre écran d'accueil

**Sur iOS (Safari) :**
1. Ouvrez `https://smartpos.cooldigital.africa`
2. Appuyez sur le bouton Partager (□↑)
3. Sélectionnez "Sur l'écran d'accueil"
4. Appuyez sur "Ajouter"

## Mode Offline

L'application fonctionne maintenant en mode offline si l'API n'est pas accessible :
- ✅ Utilise les paramètres en cache (localStorage)
- ✅ Timeout de 5 secondes pour éviter les blocages
- ✅ Messages d'erreur clairs dans la console
- ✅ Valeurs par défaut si aucun cache disponible
- ✅ Synchronisation automatique quand la connexion revient

## Vérification

Dans la console du navigateur, vous devriez voir :
- `✅ Paramètres app chargés depuis l'API` - Si l'API est accessible
- `⚠️ API non accessible - mode offline` - Si l'API n'est pas accessible
- `📦 Paramètres chargés depuis le cache local` - Si utilisation du cache
- `⏱️ Timeout API - utilisation du cache local` - Si l'API met trop de temps à répondre

## Optimisations Mobile

### Performances
- **Gzip activé** pour réduire la taille des fichiers
- **Cache immutable** pour les assets avec hash
- **Service Worker** pour le mode offline
- **Lazy loading** des composants

### Sécurité
- **HTTPS** en production
- **Headers de sécurité** configurés (X-Frame-Options, X-Content-Type-Options, etc.)
- **CORS** configuré correctement

### UX Mobile
- **Viewport optimisé** pour mobile
- **Touch-friendly** boutons et interactions
- **Responsive design** adaptatif
- **PWA installable** comme app native

## Notes Techniques

### Développement
- Les deux appareils (PC et mobile) doivent être sur le même réseau WiFi
- Le backend doit écouter sur `0.0.0.0` (déjà configuré)
- Le frontend Vite écoute déjà sur `0.0.0.0` (configuré dans vite.config.ts)

### Production
- **Frontend** : Servi par Nginx sur port 80/443
- **Backend** : Node.js sur port 3001 (proxifié par Nginx)
- **Base de données** : PostgreSQL via Supabase (pooler pour production)
- **CDN** : Assets statiques avec cache long terme

## Dépannage

### L'application ne charge pas sur mobile
1. Vérifiez que vous êtes sur le même réseau WiFi (développement)
2. Vérifiez que l'IP est correcte dans `.env.development`
3. Vérifiez que les serveurs sont démarrés (frontend + backend)
4. Vérifiez la console du navigateur pour les erreurs

### Mode offline ne fonctionne pas
1. Ouvrez la console du navigateur (F12 sur desktop)
2. Vérifiez les messages de log
3. Vérifiez le localStorage : `localStorage.getItem('appSettings')`
4. Effacez le cache si nécessaire : `localStorage.clear()`

### L'API est lente
- Le timeout est configuré à 5 secondes
- L'application bascule automatiquement en mode offline
- Les données en cache sont utilisées immédiatement
