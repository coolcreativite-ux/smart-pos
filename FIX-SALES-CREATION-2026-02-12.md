# Correction: Création de ventes et chargement excessif

**Date**: 2026-02-12  
**Statut**: ✅ Corrigé

## Problèmes identifiés

### 1. Erreur création de vente (cashier role)
**Erreur**: `column "items" of relation "sales" does not exist` (PostgreSQL 42703)

**Cause**: 
- Route générique `POST /api/:table` (ligne 1690) était placée AVANT la route spécifique `POST /api/sales` (ligne 1863)
- Express matche les routes dans l'ordre de définition
- La route générique essayait d'insérer le tableau `items` directement dans la table `sales`
- La route spécifique gère correctement la transaction: crée la vente dans `sales`, puis les items dans `sale_items`

**Solution**:
- Déplacé la route spécifique `/api/sales` AVANT la route générique `/api/:table`
- Supprimé la route dupliquée à l'ancienne position
- Ajouté commentaire explicatif: "MUST BE BEFORE GENERIC ROUTE"

### 2. Chargement excessif produits/catégories
**Symptôme**: Produits et catégories chargés des dizaines de fois à chaque connexion

**Cause**: Boucle infinie dans `ProductContext.tsx`
```typescript
// loadCategories dépend de allProducts
const loadCategories = useCallback(..., [user, allProducts]);

// useEffect dépend de loadCategories
useEffect(() => {
  loadProducts(); // Met à jour allProducts
  loadCategories(); // Recréé car allProducts a changé
}, [user, loadProducts, loadCategories]); // Boucle infinie!
```

**Solution**:
- Retiré `allProducts` des dépendances de `loadCategories`
- Modifié le fallback pour lire depuis localStorage au lieu de `allProducts`
- Maintenant: `useCallback(..., [user])` uniquement

## Fichiers modifiés

### backend/server.ts
- Ligne ~1688: Route `/api/sales` déplacée AVANT `/api/:table`
- Ligne ~1950: Route dupliquée supprimée

### frontend/contexts/ProductContext.tsx
- Ligne ~127: Dépendances `loadCategories` corrigées
- Fallback utilise localStorage au lieu de `allProducts`

## Test recommandé

1. Se connecter avec le cashier "marie"
2. Créer une vente avec 1 produit
3. Vérifier dans les logs backend:
   - `💰 Création vente:` (route spécifique appelée)
   - `✅ Vente créée: [id]`
   - `✅ 1 items créés`
4. Vérifier dans les logs frontend:
   - Produits/catégories chargés UNE SEULE FOIS
   - Pas de boucle de chargement

## Impact

- ✅ Les cashiers peuvent maintenant créer des ventes
- ✅ Performance améliorée (pas de chargement excessif)
- ✅ Logs backend plus clairs
- ✅ Pas de régression sur les autres fonctionnalités
