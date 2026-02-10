# 🔄 Supabase vs Backend API - Architecture de Données

## Problème Identifié

Après avoir ajouté les routes API backend pour les magasins, un nouveau problème est apparu : les magasins étaient bien créés via l'API backend mais `loadStores()` utilisait Supabase directement, créant une incohérence.

## Architecture Actuelle

### Deux Chemins d'Accès aux Données

```
┌─────────────────────────────────────────────────┐
│                  Frontend                        │
│                                                  │
│  ┌──────────────┐         ┌──────────────┐     │
│  │   Supabase   │         │  Backend API │     │
│  │   Client     │         │  (Express)   │     │
│  └──────┬───────┘         └──────┬───────┘     │
│         │                        │              │
└─────────┼────────────────────────┼──────────────┘
          │                        │
          ▼                        ▼
    ┌─────────────────────────────────┐
    │      PostgreSQL Database        │
    │         (Supabase)              │
    └─────────────────────────────────┘
```

### Problème de Cohérence

1. **Écriture** : Via Backend API (`POST /api/stores`)
2. **Lecture** : Via Supabase Client (`db.from('stores')`)

❌ **Résultat** : Les données écrites via l'API ne sont pas immédiatement visibles via Supabase client.

## Solution Appliquée

### Utiliser Uniquement l'API Backend

Tous les accès aux données doivent passer par l'API backend pour garantir la cohérence.

**Avant** (`StoreContext.tsx`):
```typescript
const loadStores = async () => {
  const { data, error } = await db.from('stores'); // ❌ Supabase direct
  // ...
};
```

**Après** (`StoreContext.tsx`):
```typescript
const loadStores = async () => {
  const response = await fetch(`${API_URL}/api/stores`); // ✅ API backend
  const data = await response.json();
  // ...
};
```

## Avantages de l'API Backend

### 1. Cohérence des Données
- Toutes les opérations passent par le même chemin
- Pas de cache ou de synchronisation à gérer
- Source de vérité unique

### 2. Logique Métier Centralisée
- Validation des données côté serveur
- Gestion des permissions et du multi-tenant
- Logs et audit trail

### 3. Sécurité
- Pas d'exposition directe de la base de données
- Contrôle d'accès au niveau de l'API
- Protection contre les injections SQL

### 4. Flexibilité
- Possibilité de changer de base de données sans modifier le frontend
- Ajout de cache, rate limiting, etc.
- Transformation des données si nécessaire

## Autres Contextes à Migrer

Les contextes suivants utilisent encore `db.from()` et devraient être migrés vers l'API backend :

### 1. CustomerContext
```typescript
// ❌ Actuel
const { data, error } = await db.from('customers');

// ✅ À faire
const response = await fetch(`${API_URL}/api/customers`);
const data = await response.json();
```

### 2. ProductContext
```typescript
// ❌ Actuel
const { data: productsData } = await db.from('products');
const { data: variantsData } = await db.from('product_variants');
const { data: inventoryData } = await db.from('inventory');
const { data: categoriesData } = await db.from('categories');

// ✅ À faire
const response = await fetch(`${API_URL}/api/products`);
const data = await response.json();
// Les variantes, inventaire et catégories sont déjà inclus dans la réponse
```

### 3. SupplierContext
```typescript
// ❌ Actuel
const { data, error } = await db.from('suppliers');

// ✅ À faire
const response = await fetch(`${API_URL}/api/suppliers`);
const data = await response.json();
```

### 4. PromoCodeContext
```typescript
// ❌ Actuel
const { data, error } = await db.from('promo_codes');

// ✅ À faire
const response = await fetch(`${API_URL}/api/promo-codes`);
const data = await response.json();
```

## Quand Utiliser Supabase Direct ?

### Cas d'Usage Valides

1. **Authentification** : Supabase Auth est conçu pour être utilisé côté client
2. **Storage** : Upload de fichiers via Supabase Storage
3. **Realtime** : Subscriptions temps réel (si nécessaire)

### Cas d'Usage à Éviter

1. ❌ CRUD sur les tables métier (products, stores, customers, etc.)
2. ❌ Requêtes complexes avec jointures
3. ❌ Opérations nécessitant une logique métier

## Migration Progressive

### Étape 1 : Stores ✅
- [x] Routes API backend créées
- [x] StoreContext migré vers API backend
- [x] Tests en production

### Étape 2 : Customers (À faire)
- [ ] Vérifier routes API backend existantes
- [ ] Migrer CustomerContext
- [ ] Tester en production

### Étape 3 : Products (À faire)
- [ ] Vérifier routes API backend existantes
- [ ] Migrer ProductContext
- [ ] Tester en production

### Étape 4 : Suppliers (À faire)
- [ ] Vérifier routes API backend existantes
- [ ] Migrer SupplierContext
- [ ] Tester en production

### Étape 5 : Promo Codes (À faire)
- [ ] Vérifier routes API backend existantes
- [ ] Migrer PromoCodeContext
- [ ] Tester en production

## Pattern de Migration

### Template pour Migrer un Contexte

```typescript
// 1. Importer API_URL
import { API_URL } from '../config';

// 2. Supprimer l'import de db
// import { db } from '../lib/database'; // ❌ Supprimer

// 3. Remplacer les appels db.from() par fetch()
const loadData = useCallback(async () => {
  try {
    // ❌ Ancien code
    // const { data, error } = await db.from('table_name');
    
    // ✅ Nouveau code
    const response = await fetch(`${API_URL}/api/endpoint`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      // Traiter les données
      setData(data);
      console.log('✅ Données chargées depuis l\'API:', data.length);
    } else {
      // Fallback si nécessaire
      console.log('⚠️ Aucune donnée en DB');
    }
  } catch (error) {
    console.error('❌ Erreur chargement:', error);
    // Gestion d'erreur
  }
}, []);

// 4. Pour les opérations CRUD, utiliser fetch avec méthodes HTTP
const addItem = async (itemData) => {
  const response = await fetch(`${API_URL}/api/endpoint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itemData)
  });
  
  if (response.ok) {
    await loadData(); // Recharger après modification
  }
};

const updateItem = async (id, itemData) => {
  const response = await fetch(`${API_URL}/api/endpoint/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itemData)
  });
  
  if (response.ok) {
    await loadData(); // Recharger après modification
  }
};

const deleteItem = async (id) => {
  const response = await fetch(`${API_URL}/api/endpoint/${id}`, {
    method: 'DELETE'
  });
  
  if (response.ok) {
    await loadData(); // Recharger après modification
  }
};
```

## Vérification des Routes Backend

Avant de migrer un contexte, vérifier que les routes API existent :

```bash
# Chercher les routes dans backend/server.ts
grep "app.get('/api/" backend/server.ts
grep "app.post('/api/" backend/server.ts
grep "app.put('/api/" backend/server.ts
grep "app.delete('/api/" backend/server.ts
```

### Routes Existantes (à vérifier)

- [x] `/api/stores` - GET, POST, PUT, DELETE ✅
- [x] `/api/customers` - GET, POST, DELETE
- [x] `/api/products` - GET, POST, PATCH, DELETE
- [x] `/api/suppliers` - GET, POST, PUT, DELETE
- [x] `/api/promo-codes` - GET, POST, PUT, DELETE
- [x] `/api/users` - GET, POST, PATCH, DELETE
- [x] `/api/licenses` - GET, POST, PATCH

## Tests à Effectuer Après Migration

### 1. Test de Lecture
```javascript
// Console navigateur
const response = await fetch('https://api.smartpos.cooldigital.africa/api/stores');
const data = await response.json();
console.log(data);
```

### 2. Test de Création
```javascript
const response = await fetch('https://api.smartpos.cooldigital.africa/api/stores', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenant_id: 1,
    name: 'Test Store',
    location: 'Test Location',
    phone: '555-1234'
  })
});
const result = await response.json();
console.log(result);
```

### 3. Test de Persistance
1. Créer un élément
2. Recharger la page
3. Vérifier que l'élément est toujours visible

## Avantages de la Migration Complète

### Performance
- Moins de connexions simultanées
- Cache possible au niveau de l'API
- Optimisation des requêtes

### Maintenance
- Un seul point d'entrée pour les données
- Logs centralisés
- Debugging simplifié

### Évolutivité
- Possibilité d'ajouter un cache Redis
- Rate limiting au niveau de l'API
- Monitoring centralisé

## Conclusion

La migration de Supabase direct vers l'API backend garantit :
- ✅ Cohérence des données
- ✅ Sécurité renforcée
- ✅ Logique métier centralisée
- ✅ Maintenance simplifiée

**Prochaine étape** : Migrer les autres contextes (Customers, Products, Suppliers, PromoCodes) vers l'API backend.

---
**Date**: 10 Février 2026  
**Statut**: Migration StoreContext ✅ Complétée
