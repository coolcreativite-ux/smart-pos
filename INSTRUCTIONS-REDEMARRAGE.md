# 🚨 INSTRUCTIONS IMPORTANTES - Redémarrage Backend

## Problème Actuel
L'API retourne `items: undefined` parce que le serveur backend n'a PAS été redémarré avec le fix SQL.

## ✅ Solution en 3 Étapes

### Étape 1: Arrêter le Backend
Dans le terminal où le backend tourne:
```bash
Ctrl+C
```

### Étape 2: Redémarrer le Backend
```bash
cd backend
npm run dev
```

Attendez de voir:
```
Backend POS running on http://localhost:5000
✅ Connexion à PostgreSQL réussie
```

### Étape 3: Tester l'API
Dans un NOUVEAU terminal:
```bash
node test-api-raw.cjs
```

Vous devriez voir:
```
✅ Received XX sales
📦 First item:
  Quantity: 2
  Quantity type: number
```

### Étape 4: Nettoyer le Cache Frontend
1. Ouvrir `clear-sales-cache.html` dans le navigateur
2. Cliquer sur "Nettoyer globalSalesHistory"
3. Cliquer sur "Recharger l'application"

## ⚠️ Important
Le fix SQL (`jsonb_each_text`) est déjà dans le code `backend/server.ts` ligne 2068.
MAIS le serveur doit être redémarré pour que le changement prenne effet!

## 🔍 Vérification
Après redémarrage, exécutez:
```bash
node test-api-raw.cjs
```

Si vous voyez toujours `items: undefined`, le serveur n'a pas été correctement redémarré.

## 📝 Note sur le "20" au lieu de "2"
Ce problème ne peut PAS se produire si `items: undefined`.
Si vous voyez vraiment "20", cela signifie:
1. Soit le backend a été redémarré et retourne maintenant les items
2. Soit les données viennent du cache localStorage (anciennes données)

Dans les deux cas, nettoyer le cache localStorage résoudra le problème d'affichage.
