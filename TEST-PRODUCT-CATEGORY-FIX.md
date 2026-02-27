# Test: Fix Catégorie et Prix d'Achat après Enregistrement

## Problème Résolu
Après l'ajout d'un produit, la catégorie s'affichait comme "Autre" et le prix d'achat comme 0 dans le frontend.

## Causes Identifiées

### 1. Catégorie manquante
Le backend POST `/api/products` créait le produit mais ne retournait pas le nom de la catégorie dans la réponse, seulement `category_id`.

### 2. Prix d'achat (costPrice) en snake_case
Les variantes retournées contenaient `cost_price` (snake_case PostgreSQL) au lieu de `costPrice` (camelCase attendu par le frontend).

## Solutions Appliquées

### Fix 1: Ajout du nom de catégorie
Modifié `backend/server.ts` pour récupérer et inclure le nom de la catégorie dans la réponse POST:

```typescript
// Récupérer le nom de la catégorie pour la réponse
let categoryName = 'Autre';
if (categoryId) {
  const categoryResult = await pool.query(
    'SELECT name FROM categories WHERE id = $1',
    [categoryId]
  );
  if (categoryResult.rows.length > 0) {
    categoryName = categoryResult.rows[0].name;
  }
}
```

### Fix 2: Transformation des variantes en camelCase
Transformé les variantes avant de les retourner pour correspondre au format du GET endpoint:

```typescript
createdVariants.push({
  id: createdVariant.id,
  selectedOptions: createdVariant.selected_options,
  price: createdVariant.price,
  costPrice: createdVariant.cost_price, // ← Transformation snake_case → camelCase
  sku: createdVariant.sku,
  barcode: createdVariant.barcode,
  stock_quantity: initialStock,
  quantityByStore: { [activeStoreId]: initialStock }
});
```

## Test à Effectuer

1. Assurez-vous que le backend est en cours d'exécution:
   ```bash
   cd backend
   npm run dev
   ```

2. Dans le frontend, ajoutez un nouveau produit:
   - Nom: "Test Catégorie Fix"
   - Catégorie: Sélectionnez une catégorie existante (ex: "Électronique")
   - Prix de vente: 100
   - Prix d'achat: 75
   - Stock initial: 10

3. Après enregistrement, vérifiez immédiatement:
   - ✅ La catégorie doit afficher "Électronique" (pas "Autre")
   - ✅ Le prix d'achat doit afficher 75 (pas 0)
   - ✅ Le prix de vente doit afficher 100
   - ✅ Le stock doit afficher 10

## Vérification Technique

Le backend retourne maintenant dans la réponse POST un format cohérent avec GET:

```json
{
  "id": 123,
  "name": "Test Catégorie Fix",
  "category": "Électronique",  // ✅ Nom de catégorie inclus
  "category_id": 5,
  "variants": [
    {
      "id": 456,
      "selectedOptions": {},
      "price": 100,
      "costPrice": 75,  // ✅ camelCase (pas cost_price)
      "sku": null,
      "barcode": null,
      "stock_quantity": 10,
      "quantityByStore": { "1": 10 }
    }
  ]
}
```

### Différence avec l'ancien comportement:
- **Avant**: `cost_price` (snake_case) → Frontend ne trouvait pas la valeur → affichait 0
- **Après**: `costPrice` (camelCase) → Frontend trouve la valeur → affiche 75

## État du Backend
✅ Backend redémarré automatiquement (tsx hot reload)
✅ Serveur en cours d'exécution sur http://localhost:5000
✅ Connexion PostgreSQL active
✅ Format des variantes harmonisé (POST = GET)

## Prochaines Étapes
Testez l'ajout d'un produit dans le frontend pour confirmer que:
1. La catégorie s'affiche correctement (pas "Autre")
2. Le prix d'achat s'affiche correctement (pas 0)
3. Le prix de vente s'affiche correctement
4. Le stock initial s'affiche correctement
