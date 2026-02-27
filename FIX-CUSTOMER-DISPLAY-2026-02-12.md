# Correction: Affichage "Anonyme" pour les clients

**Date**: 2026-02-12  
**Statut**: ✅ Corrigé

## Problème

Lorsqu'un client est associé à une vente, son nom s'affiche comme "Anonyme" ou "undefined undefined" au lieu du vrai nom.

## Cause

Deux problèmes identifiés:

### 1. Mapping incorrect après création client
Dans `CustomerContext.tsx`, après avoir créé un client en DB, l'objet retourné utilisait:
```typescript
const newCustomer: Customer = {
  id: result.id,
  tenantId: user.tenantId,
  ...customerData,  // ❌ Utilise les données du formulaire
  // ...
};
```

Le `result` de la DB contient `first_name` et `last_name`, mais on utilisait `customerData` qui contient `firstName` et `lastName`. L'objet retourné n'avait donc pas les bons champs mappés.

### 2. Pas de fallback dans l'affichage
Dans `SalesCart.tsx` ligne 257:
```typescript
<p>{assignedCustomer.firstName} {assignedCustomer.lastName}</p>
```

Si `firstName` ou `lastName` sont `undefined`, ça affiche "undefined undefined".

## Solution

### 1. Mapping correct des champs DB
```typescript
const newCustomer: Customer = {
  id: result.id,
  tenantId: result.tenant_id || user.tenantId,
  firstName: result.first_name || customerData.firstName,
  lastName: result.last_name || customerData.lastName,
  email: result.email || customerData.email,
  phone: result.phone || customerData.phone,
  salesHistoryIds: [],
  loyaltyPoints: result.loyalty_points || 0,
  storeCredit: parseFloat(result.store_credit || 0),
  storeId: result.store_id || currentStore?.id || 1,
};
```

### 2. Fallback dans l'affichage
```typescript
<p>
  {assignedCustomer.firstName || 'Anonyme'} {assignedCustomer.lastName || ''}
</p>
```

## Fichiers modifiés

- `frontend/contexts/CustomerContext.tsx` (ligne ~119): Mapping correct des champs DB
- `frontend/components/SalesCart.tsx` (ligne ~257): Ajout de fallback pour l'affichage

## Test

1. Créer un nouveau client (ex: "ADELEYE RACHEL")
2. L'assigner à une vente
3. Vérifier que le nom s'affiche correctement dans le panier
4. Les initiales doivent aussi s'afficher correctement (AR)

## Note sur les erreurs de connexion

Les logs montrent aussi des erreurs `ERR_CONNECTION_REFUSED/RESET`. Ceci est causé par:
- Le backend qui crash temporairement à cause de trop de requêtes simultanées
- La boucle infinie de chargement (déjà corrigée dans le commit précédent)

Après le redémarrage du backend, tout fonctionne correctement et la vente est créée avec succès.
