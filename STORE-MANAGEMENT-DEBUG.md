# 🏪 Guide de Débogage - Gestion des Magasins

## Problème Résolu
Les magasins ajoutés en production étaient bien enregistrés dans la base de données mais ne s'affichaient pas après rechargement de la page.

## Causes Identifiées

### 1. Routes API Manquantes
❌ **Problème**: Le backend n'avait que la route `GET /api/stores`
✅ **Solution**: Ajout des routes manquantes:
- `POST /api/stores` - Créer un magasin
- `PUT /api/stores/:id` - Modifier un magasin
- `DELETE /api/stores/:id` - Supprimer un magasin

### 2. Pas de Rechargement Automatique
❌ **Problème**: Après ajout/modification/suppression, le contexte ne rechargeait pas les données depuis la DB
✅ **Solution**: Appel de `loadStores()` après chaque opération pour synchroniser avec la DB

### 3. Conflit localStorage vs DB
❌ **Problème**: Le localStorage pouvait contenir des données obsolètes
✅ **Solution**: La DB est maintenant la source de vérité, le localStorage est mis à jour depuis la DB

## Modifications Appliquées

### Backend (`backend/server.ts`)
```typescript
// Nouvelles routes ajoutées:

// POST /api/stores - Créer un magasin
app.post('/api/stores', async (req, res) => {
  const { tenant_id, name, location, phone } = req.body;
  // Insertion en DB avec validation
});

// PUT /api/stores/:id - Modifier un magasin
app.put('/api/stores/:id', async (req, res) => {
  const { name, location, phone } = req.body;
  // Mise à jour en DB
});

// DELETE /api/stores/:id - Supprimer un magasin
app.delete('/api/stores/:id', async (req, res) => {
  // Suppression en DB
});
```

### Frontend (`frontend/contexts/StoreContext.tsx`)
```typescript
// Après chaque opération, rechargement automatique:

const addStore = async (storeData) => {
  // ... ajout en DB
  await loadStores(); // ✅ Recharge depuis la DB
};

const updateStore = async (updatedStore) => {
  // ... mise à jour en DB
  await loadStores(); // ✅ Recharge depuis la DB
};

const deleteStore = async (storeId) => {
  // ... suppression en DB
  await loadStores(); // ✅ Recharge depuis la DB
};

// La DB est la source de vérité
const loadStores = async () => {
  const { data } = await db.from('stores');
  setAllStores(data);
  localStorage.setItem('globalStores', JSON.stringify(data)); // Sync
};
```

## Comment Tester en Production

### Test 1: Ajouter un Magasin
1. Connectez-vous en tant que Owner ou Admin
2. Allez dans **Paramètres** → **Magasins**
3. Cliquez sur **Ajouter Magasin**
4. Remplissez les informations:
   - Nom: "Test Store"
   - Emplacement: "123 Test Street"
   - Téléphone: "555-1234"
5. Cliquez sur **Enregistrer**
6. ✅ Le magasin doit apparaître immédiatement dans la liste
7. Rechargez la page (F5)
8. ✅ Le magasin doit toujours être visible

### Test 2: Modifier un Magasin
1. Cliquez sur **Modifier** sur un magasin existant
2. Changez le nom: "Test Store Updated"
3. Cliquez sur **Enregistrer**
4. ✅ Le changement doit être visible immédiatement
5. Rechargez la page (F5)
6. ✅ Le changement doit persister

### Test 3: Supprimer un Magasin
1. Cliquez sur **Supprimer** sur un magasin
2. Confirmez la suppression
3. ✅ Le magasin doit disparaître immédiatement
4. Rechargez la page (F5)
5. ✅ Le magasin ne doit pas réapparaître

### Test 4: Vérifier la Base de Données
Connectez-vous à votre base de données PostgreSQL et exécutez:
```sql
SELECT * FROM stores ORDER BY id DESC LIMIT 10;
```
✅ Vous devez voir tous les magasins créés

### Test 5: Vérifier les Logs Backend
```bash
# Si vous utilisez PM2
pm2 logs backend

# Ou consultez les logs du serveur
tail -f /var/log/backend.log
```

Vous devriez voir:
```
🏪 Création magasin: { tenant_id: 1, name: 'Test Store', ... }
✅ Magasin créé: { id: 5, tenant_id: 1, name: 'Test Store', ... }
✅ Magasins chargés depuis la base de données: 5
```

## Vérifications Console Navigateur

Ouvrez la console du navigateur (F12) et vérifiez:

### Après Ajout d'un Magasin
```
✅ Magasin ajouté en DB: { id: 5, tenant_id: 1, ... }
✅ Magasins chargés depuis la base de données: 5
```

### Après Rechargement de la Page
```
✅ Magasins chargés depuis la base de données: 5
```

### Si Erreur
```
❌ Erreur lors de l'ajout du magasin en DB: [détails]
```

## Problèmes Courants

### ❌ Magasin créé mais pas visible après rechargement
**Cause**: Routes API manquantes ou erreur de connexion DB
**Solution**: 
1. Vérifier que le backend a bien les routes POST/PUT/DELETE
2. Vérifier les logs backend pour voir si l'insertion a réussi
3. Vérifier la connexion à la base de données

### ❌ Erreur 404 sur POST /api/stores
**Cause**: Backend pas à jour
**Solution**: 
1. Vérifier que le déploiement Coolify est terminé
2. Redémarrer le backend: `pm2 restart backend`
3. Vérifier la version du code déployé

### ❌ Magasin visible mais données incorrectes
**Cause**: Cache localStorage obsolète
**Solution**: 
```javascript
// Dans la console du navigateur
localStorage.removeItem('globalStores');
location.reload();
```

### ❌ Erreur "tenant_id requis"
**Cause**: L'utilisateur n'est pas correctement authentifié
**Solution**: 
1. Se déconnecter et se reconnecter
2. Vérifier que `user.tenantId` est défini dans le contexte Auth

## Architecture Multi-Tenant

### Filtrage par Tenant
Les magasins sont automatiquement filtrés selon le rôle:

- **SuperAdmin**: Voit TOUS les magasins (tous tenants)
- **Owner/Admin**: Voit les magasins de son tenant uniquement
- **Manager/Cashier**: Voit uniquement le magasin assigné

### Exemple de Données
```javascript
// Tenant 1 (Cool Digital)
{ id: 1, tenantId: 1, name: "Siège Principal", ... }
{ id: 2, tenantId: 1, name: "Succursale Ouest", ... }

// Tenant 2 (Autre Client)
{ id: 3, tenantId: 2, name: "Boutique Centre", ... }
```

Un Owner du tenant 1 ne verra que les magasins 1 et 2.

## Commandes Utiles

### Vérifier les Magasins en DB
```sql
-- Tous les magasins
SELECT * FROM stores;

-- Par tenant
SELECT * FROM stores WHERE tenant_id = 1;

-- Avec comptage
SELECT tenant_id, COUNT(*) as nb_stores 
FROM stores 
GROUP BY tenant_id;
```

### Nettoyer le Cache (si nécessaire)
```javascript
// Console navigateur
localStorage.clear();
location.reload();
```

### Redémarrer le Backend
```bash
# Avec PM2
pm2 restart backend

# Ou avec npm
cd backend
npm run dev
```

## Flux de Données

```
┌─────────────────┐
│  Utilisateur    │
│  Ajoute Store   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  StoreContext   │
│  addStore()     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  POST /api/     │
│  stores         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PostgreSQL DB  │
│  INSERT INTO    │
│  stores         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  loadStores()   │
│  Recharge DB    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  UI Update      │
│  Liste visible  │
└─────────────────┘
```

## Checklist de Déploiement

Avant de déployer en production, vérifier:

- [ ] Routes API stores (POST/PUT/DELETE) présentes dans `backend/server.ts`
- [ ] `loadStores()` appelé après chaque opération dans `StoreContext.tsx`
- [ ] Table `stores` existe en DB avec colonnes: `id`, `tenant_id`, `name`, `location`, `phone`
- [ ] Backend redémarré après déploiement
- [ ] Cache navigateur vidé pour les tests
- [ ] Logs backend accessibles pour debugging

## Support

Si le problème persiste:

1. **Vérifier les logs backend**: Chercher les messages d'erreur
2. **Vérifier la DB**: Confirmer que les données sont bien insérées
3. **Vérifier la console navigateur**: Chercher les erreurs réseau
4. **Tester l'API directement**: Utiliser Postman ou curl

### Test API Direct
```bash
# Créer un magasin
curl -X POST https://api.smartpos.cooldigital.africa/api/stores \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": 1,
    "name": "Test Store",
    "location": "123 Test St",
    "phone": "555-1234"
  }'

# Lister les magasins
curl https://api.smartpos.cooldigital.africa/api/stores
```

---
**Dernière mise à jour**: 2026-02-10
**Version**: 1.1.0
