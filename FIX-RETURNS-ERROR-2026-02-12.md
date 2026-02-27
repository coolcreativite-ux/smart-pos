# Correction: Erreur 500 lors des retours de produits

**Date**: 2026-02-12  
**Statut**: ✅ Corrigé

## Problème

Lors d'un retour de produit, l'application affiche une erreur 500:
```
PATCH http://localhost:5000/api/sales/sale_1770905688025_24rxtgw 500 (Internal Server Error)
❌ Erreur enregistrement retour: Error: Erreur lors de l'enregistrement du retour
```

## Causes

### Cause 1: Incompatibilité des identifiants (Backend)
Le frontend envoyait `cartItemId` au format `"productId-variantId"` mais le backend cherchait dans `sale_items.id` (entier).

**Solution**: Extraire `variant_id` du `cartItemId` et utiliser `sale_id` + `variant_id` pour identifier l'item.

### Cause 2: ID de vente incorrect (Frontend) ⚠️ PRINCIPAL
Après création d'une vente en DB, le frontend sauvegardait la vente avec l'ID temporaire (`sale_xxx`) au lieu de l'UUID retourné par la DB.

**Flux problématique**:
1. Frontend génère ID temporaire: `sale_1770905688025_24rxtgw`
2. Backend crée la vente et retourne UUID: `a1caf858-57eb-49f1-b8c8-8386d7aae7bf`
3. Frontend sauvegarde la vente avec l'ID temporaire ❌
4. Lors du retour, frontend envoie l'ID temporaire
5. Backend cherche `sale_id = 'sale_1770905688025_24rxtgw'` → Aucune vente trouvée → Erreur 500

**Code problématique** (SalesHistoryContext.tsx ligne ~157):
```typescript
const createdSale = await response.json();
console.log('✅ Vente créée dans la DB:', createdSale.id);

// ❌ Sauvegarde avec l'ancien ID temporaire
saveToGlobal([saleWithTenant, ...allSales]);
```

**Solution**:
```typescript
const createdSale = await response.json();
console.log('✅ Vente créée dans la DB:', createdSale.id);

// ✅ Remplacer l'ID temporaire par l'UUID de la DB
const saleWithDbId: Sale = {
  ...saleWithTenant,
  id: createdSale.id  // UUID de la DB
};
saveToGlobal([saleWithDbId, ...allSales]);
```

## Fichiers modifiés

1. `backend/server.ts` (ligne ~1950): Route PATCH `/api/sales/:id` - Extraction du variant_id
2. `frontend/contexts/SalesHistoryContext.tsx` (ligne ~157): Utilisation de l'UUID retourné par la DB

## Test complet

1. ✅ Créer une vente avec plusieurs produits
2. ✅ Vérifier que l'ID affiché est un UUID (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
3. ✅ Aller dans l'historique des ventes
4. ✅ Cliquer sur "Retour" pour un produit
5. ✅ Sélectionner la quantité à retourner
6. ✅ Cliquer sur "Émettre crédit magasin" → Devrait fonctionner sans erreur
7. ✅ Cliquer sur "Échanger" → Devrait fonctionner sans erreur
8. ✅ Vérifier que le stock est remis à jour
9. ✅ Vérifier que le crédit magasin est ajouté au client

## Note importante

Après ce fix, les ventes créées auront le bon UUID. Les anciennes ventes avec l'ID temporaire dans localStorage ne pourront pas être retournées. Pour nettoyer:
- Vider le localStorage: `localStorage.removeItem('globalSalesHistory')`
- Ou recharger les ventes depuis la DB (elles ont déjà les bons UUIDs)
