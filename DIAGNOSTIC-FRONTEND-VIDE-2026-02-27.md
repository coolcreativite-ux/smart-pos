# Diagnostic : Frontend vide malgré données en base

**Date**: 27 février 2026  
**Problème**: Le frontend n'affiche aucune donnée alors que la base de données contient des données

## Tests API effectués ✅

### 1. Produits
```powershell
GET /api/products (x-tenant-id: 4)
Résultat: 3 produits ✅
```

### 2. Clients
```powershell
GET /api/customers (x-tenant-id: 4)
Résultat: Plusieurs clients ✅
```

### 3. Ventes
```powershell
GET /api/sales (x-tenant-id: 4)
Résultat: Plusieurs ventes ✅
```

### 4. Factures
```powershell
GET /api/invoices (x-tenant-id: 4, x-user-id: 5)
Résultat: 17 factures ✅
```

## Diagnostic

L'API backend fonctionne correctement et retourne toutes les données. Le problème est dans le frontend.

## Erreurs console observées

1. **404 sur reset-password** (résolu - route existe et fonctionne)
2. **Erreur de parsing JSON** : Le serveur retournait du HTML au lieu de JSON

## Causes possibles

1. **Problème d'authentification** : Le contexte `user` n'est pas correctement initialisé
2. **Headers manquants** : Les headers `x-tenant-id` et `x-user-id` ne sont pas envoyés
3. **Cache navigateur** : Le navigateur utilise d'anciennes données en cache
4. **État du contexte** : Le InvoiceContext ne se met pas à jour correctement

## Actions à effectuer

### 1. Vider le cache du navigateur
- Ouvrir DevTools (F12)
- Aller dans Application > Storage
- Cliquer sur "Clear site data"
- Rafraîchir la page (Ctrl+Shift+R)

### 2. Vérifier les logs console
Rechercher dans la console les messages suivants :
```
🔍 [InvoiceHistory] useEffect déclenché
🔍 [InvoiceHistory] User: ...
🔍 [InvoiceHistory] TenantId: ...
🔍 [InvoiceHistory] UserId: ...
🔍 [InvoiceContext] Requête vers: ...
🔍 [InvoiceContext] Response status: ...
```

### 3. Vérifier l'objet user
Dans la console du navigateur, taper :
```javascript
localStorage.getItem('user')
```

### 4. Redémarrer le frontend
```bash
cd frontend
npm run dev
```

## Prochaines étapes

1. Copier TOUS les logs de la console (y compris ceux qui commencent par 🔍)
2. Vérifier si l'objet `user` est bien défini dans localStorage
3. Vider le cache et rafraîchir
4. Si le problème persiste, vérifier le code du AuthContext
