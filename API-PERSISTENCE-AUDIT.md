# Audit de Persistance API - Smart POS

## Vue d'ensemble

Ce document audite toutes les opérations CRUD de l'application pour s'assurer qu'elles persistent correctement dans la base de données PostgreSQL via l'API backend.

## Légende

- ✅ **OK** : Opération persiste dans la DB
- ⚠️ **PARTIEL** : Certaines opérations persistent, d'autres non
- ❌ **MANQUANT** : Aucune persistance DB
- 🔍 **À VÉRIFIER** : Nécessite vérification

---

## 1. Users (Utilisateurs)

**Context**: `UserContext.tsx`
**Backend**: `/api/users`

| Opération | Frontend | Backend | Status |
|-----------|----------|---------|--------|
| CREATE | `addUser()` | `POST /api/users` | ✅ OK |
| READ | `loadUsers()` | `GET /api/users` | ✅ OK |
| UPDATE | `updateUser()` | ❌ Manquant | ❌ MANQUANT |
| DELETE | `deleteUser()` | `DELETE /api/users/:id` | ✅ OK |
| Change Password | `changePassword()` | ❌ Manquant | ❌ MANQUANT |

**Actions requises**:
- [ ] Ajouter `PATCH /api/users/:id` pour UPDATE
- [ ] Ajouter `PATCH /api/users/:id/password` pour Change Password

---

## 2. Products (Produits)

**Context**: `ProductContext.tsx`
**Backend**: `/api/products`

| Opération | Frontend | Backend | Status |
|-----------|----------|---------|--------|
| CREATE | `addProduct()` | `POST /api/products` | ✅ OK |
| READ | `loadProducts()` | `GET /api/products` | 🔍 À VÉRIFIER |
| UPDATE | `updateProduct()` | ❌ Manquant | ❌ MANQUANT |
| DELETE | `deleteProduct()` | ❌ Manquant | ❌ MANQUANT |

**Actions requises**:
- [ ] Vérifier si `loadProducts()` utilise l'API
- [ ] Ajouter `PATCH /api/products/:id` pour UPDATE
- [ ] Ajouter `DELETE /api/products/:id` pour DELETE

---

## 3. Categories (Catégories)

**Context**: `ProductContext.tsx`
**Backend**: `/api/categories`

| Opération | Frontend | Backend | Status |
|-----------|----------|---------|--------|
| CREATE | `addCategory()` | Auto-créé avec produit | ⚠️ PARTIEL |
| READ | `loadCategories()` | `GET /api/categories` | 🔍 À VÉRIFIER |
| UPDATE | `updateCategory()` | ❌ Manquant | ❌ MANQUANT |
| DELETE | `deleteCategory()` | ❌ Manquant | ❌ MANQUANT |

**Actions requises**:
- [ ] Vérifier si `loadCategories()` utilise l'API
- [ ] Ajouter `POST /api/categories` pour CREATE explicite
- [ ] Ajouter `PATCH /api/categories/:id` pour UPDATE
- [ ] Ajouter `DELETE /api/categories/:id` pour DELETE

---

## 4. Customers (Clients)

**Context**: `CustomerContext.tsx`
**Backend**: `/api/customers`

| Opération | Frontend | Backend | Status |
|-----------|----------|---------|--------|
| CREATE | `addCustomer()` | `POST /api/customers` | 🔍 À VÉRIFIER |
| READ | `loadCustomers()` | `GET /api/customers` | 🔍 À VÉRIFIER |
| UPDATE | `updateCustomer()` | ❌ Manquant | ❌ MANQUANT |
| DELETE | `deleteCustomer()` | ❌ Manquant | ❌ MANQUANT |

**Actions requises**:
- [ ] Vérifier si CREATE/READ utilisent l'API
- [ ] Ajouter `PATCH /api/customers/:id` pour UPDATE
- [ ] Ajouter `DELETE /api/customers/:id` pour DELETE

---

## 5. Suppliers (Fournisseurs)

**Context**: `SupplierContext.tsx`
**Backend**: `/api/suppliers` (à créer)

| Opération | Frontend | Backend | Status |
|-----------|----------|---------|--------|
| CREATE | `addSupplier()` | ❌ Manquant | ❌ MANQUANT |
| READ | Chargement initial | ❌ Manquant | ❌ MANQUANT |
| UPDATE | `updateSupplier()` | ❌ Manquant | ❌ MANQUANT |
| DELETE | `deleteSupplier()` | ❌ Manquant | ❌ MANQUANT |

**Actions requises**:
- [ ] Créer table `suppliers` dans la DB
- [ ] Ajouter `POST /api/suppliers` pour CREATE
- [ ] Ajouter `GET /api/suppliers` pour READ
- [ ] Ajouter `PATCH /api/suppliers/:id` pour UPDATE
- [ ] Ajouter `DELETE /api/suppliers/:id` pour DELETE

---

## 6. Stores (Magasins)

**Context**: `StoreContext.tsx`
**Backend**: `/api/stores`

| Opération | Frontend | Backend | Status |
|-----------|----------|---------|--------|
| CREATE | `addStore()` | ❌ Manquant | ❌ MANQUANT |
| READ | Chargement initial | `GET /api/stores` | 🔍 À VÉRIFIER |
| UPDATE | `updateStore()` | ❌ Manquant | ❌ MANQUANT |
| DELETE | `deleteStore()` | ❌ Manquant | ❌ MANQUANT |

**Actions requises**:
- [ ] Vérifier si READ utilise l'API
- [ ] Ajouter `POST /api/stores` pour CREATE
- [ ] Ajouter `PATCH /api/stores/:id` pour UPDATE
- [ ] Ajouter `DELETE /api/stores/:id` pour DELETE

---

## 7. Promo Codes (Codes Promo)

**Context**: `PromoCodeContext.tsx`
**Backend**: `/api/promo-codes` (à créer)

| Opération | Frontend | Backend | Status |
|-----------|----------|---------|--------|
| CREATE | `addPromoCode()` | ❌ Manquant | ❌ MANQUANT |
| READ | Chargement initial | ❌ Manquant | ❌ MANQUANT |
| UPDATE | `updatePromoCode()` | ❌ Manquant | ❌ MANQUANT |
| DELETE | `deletePromoCode()` | ❌ Manquant | ❌ MANQUANT |

**Actions requises**:
- [ ] Créer table `promo_codes` dans la DB
- [ ] Ajouter `POST /api/promo-codes` pour CREATE
- [ ] Ajouter `GET /api/promo-codes` pour READ
- [ ] Ajouter `PATCH /api/promo-codes/:id` pour UPDATE
- [ ] Ajouter `DELETE /api/promo-codes/:id` pour DELETE

---

## 8. Sales History (Historique des Ventes)

**Context**: `SalesHistoryContext.tsx`
**Backend**: `/api/sales` (à créer)

| Opération | Frontend | Backend | Status |
|-----------|----------|---------|--------|
| CREATE | `addSale()` | ❌ Manquant | ❌ MANQUANT |
| READ | Chargement initial | ❌ Manquant | ❌ MANQUANT |
| UPDATE | `addReturnToSale()` | ❌ Manquant | ❌ MANQUANT |
| DELETE | `clearSalesHistory()` | ❌ Manquant | ❌ MANQUANT |

**Actions requises**:
- [ ] Créer table `sales` dans la DB
- [ ] Créer table `sale_items` dans la DB
- [ ] Ajouter `POST /api/sales` pour CREATE
- [ ] Ajouter `GET /api/sales` pour READ
- [ ] Ajouter `PATCH /api/sales/:id` pour UPDATE (retours)
- [ ] Ajouter `DELETE /api/sales` pour DELETE (clear history)

---

## 9. Licenses (Licences)

**Context**: `LicenseContext.tsx`
**Backend**: `/api/licenses`

| Opération | Frontend | Backend | Status |
|-----------|----------|---------|--------|
| CREATE | `generateLicense()` | `POST /api/licenses` | ✅ OK |
| READ | `loadLicenses()` | `GET /api/licenses` | ✅ OK |
| UPDATE | `activateLicenseForTenant()` | `PATCH /api/licenses/:id` | ✅ OK |
| DELETE | `revokeLicense()` | ❌ Manquant | ❌ MANQUANT |

**Actions requises**:
- [ ] Ajouter `DELETE /api/licenses/:id` pour DELETE

---

## 10. Settings (Paramètres)

**Context**: `SettingsContext.tsx`
**Backend**: `/api/settings`

| Opération | Frontend | Backend | Status |
|-----------|----------|---------|--------|
| READ | `loadSettings()` | `GET /api/settings/:tenantId` | ✅ OK |
| UPDATE | `updateSettings()` | `PUT /api/settings/:tenantId` | ✅ OK |

**Status**: ✅ **COMPLET**

---

## 11. Action Logs (Logs d'Actions)

**Context**: `ActionLogContext.tsx`
**Backend**: `/api/action-logs`

| Opération | Frontend | Backend | Status |
|-----------|----------|---------|--------|
| CREATE | `logAction()` | `POST /api/action-logs` | ✅ OK |
| READ | `loadLogs()` | `GET /api/action-logs` | ✅ OK |
| DELETE | `clearLogs()` | ❌ Manquant | ❌ MANQUANT |

**Actions requises**:
- [ ] Ajouter `DELETE /api/action-logs` pour DELETE

---

## 12. Inventory (Inventaire)

**Backend**: `/api/inventory`

| Opération | Frontend | Backend | Status |
|-----------|----------|---------|--------|
| READ | Chargement produits | `GET /api/inventory` | ✅ OK |
| UPDATE | Ajustements stock | `POST /api/inventory/update` | ✅ OK |

**Status**: ✅ **COMPLET**

---

## Résumé Global

### Par Statut

| Status | Nombre | Pourcentage |
|--------|--------|-------------|
| ✅ Complet | 15 | 31% |
| ⚠️ Partiel | 1 | 2% |
| ❌ Manquant | 32 | 67% |

### Par Entité

| Entité | CREATE | READ | UPDATE | DELETE | Score |
|--------|--------|------|--------|--------|-------|
| Users | ✅ | ✅ | ❌ | ✅ | 75% |
| Products | ✅ | 🔍 | ❌ | ❌ | 25% |
| Categories | ⚠️ | 🔍 | ❌ | ❌ | 12% |
| Customers | 🔍 | 🔍 | ❌ | ❌ | 0% |
| Suppliers | ❌ | ❌ | ❌ | ❌ | 0% |
| Stores | ❌ | 🔍 | ❌ | ❌ | 0% |
| Promo Codes | ❌ | ❌ | ❌ | ❌ | 0% |
| Sales | ❌ | ❌ | ❌ | ❌ | 0% |
| Licenses | ✅ | ✅ | ✅ | ❌ | 75% |
| Settings | - | ✅ | ✅ | - | 100% |
| Action Logs | ✅ | ✅ | - | ❌ | 67% |
| Inventory | - | ✅ | ✅ | - | 100% |

---

## Plan d'Action Prioritaire

### Phase 1 : Critique (Données essentielles)
1. **Users** : Ajouter UPDATE et Change Password
2. **Products** : Ajouter UPDATE et DELETE
3. **Customers** : Vérifier et compléter toutes les opérations
4. **Sales** : Créer toute la persistance (critique pour l'historique)

### Phase 2 : Important (Fonctionnalités avancées)
5. **Stores** : Compléter toutes les opérations
6. **Categories** : Ajouter UPDATE et DELETE
7. **Licenses** : Ajouter DELETE (révocation)
8. **Action Logs** : Ajouter DELETE (clear logs)

### Phase 3 : Secondaire (Fonctionnalités optionnelles)
9. **Suppliers** : Créer toute la persistance
10. **Promo Codes** : Créer toute la persistance

---

## Endpoints Backend à Créer

### Users
```typescript
PATCH /api/users/:id
PATCH /api/users/:id/password
```

### Products
```typescript
PATCH /api/products/:id
DELETE /api/products/:id
```

### Categories
```typescript
POST /api/categories
PATCH /api/categories/:id
DELETE /api/categories/:id
```

### Customers
```typescript
PATCH /api/customers/:id
DELETE /api/customers/:id
```

### Suppliers
```typescript
POST /api/suppliers
GET /api/suppliers
PATCH /api/suppliers/:id
DELETE /api/suppliers/:id
```

### Stores
```typescript
POST /api/stores
PATCH /api/stores/:id
DELETE /api/stores/:id
```

### Promo Codes
```typescript
POST /api/promo-codes
GET /api/promo-codes
PATCH /api/promo-codes/:id
DELETE /api/promo-codes/:id
```

### Sales
```typescript
POST /api/sales
GET /api/sales
PATCH /api/sales/:id
DELETE /api/sales
```

### Licenses
```typescript
DELETE /api/licenses/:id
```

### Action Logs
```typescript
DELETE /api/action-logs
```

---

## Estimation du Travail

| Phase | Endpoints | Temps estimé |
|-------|-----------|--------------|
| Phase 1 | 8 endpoints | 4-6 heures |
| Phase 2 | 8 endpoints | 3-4 heures |
| Phase 3 | 8 endpoints | 3-4 heures |
| **Total** | **24 endpoints** | **10-14 heures** |

---

## Notes Importantes

1. **Transactions** : Les ventes doivent utiliser des transactions SQL pour garantir la cohérence
2. **Cascade Delete** : Définir les règles de suppression en cascade dans la DB
3. **Validation** : Ajouter la validation des données côté backend
4. **Permissions** : Vérifier les permissions utilisateur pour chaque opération
5. **Audit Trail** : Toutes les modifications doivent être loggées dans action_logs

---

## Prochaines Étapes

1. Valider cet audit avec l'équipe
2. Prioriser les phases selon les besoins business
3. Créer les endpoints manquants phase par phase
4. Tester chaque endpoint avec des cas réels
5. Mettre à jour les contextes frontend pour utiliser les nouveaux endpoints
6. Documenter chaque endpoint dans une API documentation

---

**Date de l'audit** : 7 février 2026
**Auditeur** : Kiro AI Assistant
**Version** : 1.0
