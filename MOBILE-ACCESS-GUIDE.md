# Guide d'Accès Mobile

## Problème
Lorsque vous accédez à l'application depuis un mobile sur le même réseau WiFi, `localhost` ne fonctionne pas car il fait référence au mobile lui-même, pas à votre ordinateur.

## Solution

### 1. Trouver votre adresse IP locale

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

### 2. Configurer l'URL de l'API

Modifiez le fichier `frontend/.env.development` :

```env
# Remplacez localhost par votre IP locale
VITE_API_URL=http://192.168.1.100:5000
```

### 3. Redémarrer le serveur frontend

```bash
cd frontend
npm run dev
```

### 4. Accéder depuis le mobile

Ouvrez votre navigateur mobile et allez sur :
```
http://192.168.1.100:3000
```

## Mode Offline

L'application fonctionne maintenant en mode offline si l'API n'est pas accessible :
- ✅ Utilise les paramètres en cache (localStorage)
- ✅ Timeout de 5 secondes pour éviter les blocages
- ✅ Messages d'erreur clairs dans la console
- ✅ Valeurs par défaut si aucun cache disponible

## Vérification

Dans la console du navigateur, vous devriez voir :
- `✅ Paramètres app chargés depuis l'API` - Si l'API est accessible
- `⚠️ API non accessible - mode offline` - Si l'API n'est pas accessible
- `📦 Paramètres chargés depuis le cache local` - Si utilisation du cache

## Notes

- Les deux appareils (PC et mobile) doivent être sur le même réseau WiFi
- Le backend doit écouter sur `0.0.0.0` (déjà configuré)
- Le frontend Vite écoute déjà sur `0.0.0.0` (configuré dans vite.config.ts)
