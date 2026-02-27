# Guide de Test: Prix d'Achat dans le Frontend

## 🎯 Objectif
Vérifier que le prix d'achat (costPrice) s'affiche correctement dans l'interface de modification de produit.

## 📋 Prérequis

1. Backend en cours d'exécution:
   ```bash
   cd backend
   npm run dev
   ```

2. Frontend en cours d'exécution:
   ```bash
   npm run dev
   ```

3. Connexion avec un utilisateur valide (ex: admin/admin123)

## 🧪 Test Automatique (HTML)

### Option 1: Test avec fichier HTML standalone

1. Ouvrir le fichier `test-frontend-cost-price.html` dans un navigateur
2. Le test charge automatiquement les produits depuis l'API
3. Vérifier les résultats:
   - ✅ Tous les produits doivent avoir `costPrice` en camelCase
   - ✅ Aucun produit ne doit avoir `cost_price` en snake_case
   - ✅ Les valeurs doivent être > 0 pour les produits avec prix d'achat

4. Cliquer sur "Créer un produit de test" pour tester la création
5. Vérifier que le nouveau produit affiche correctement:
   - Prix de vente: 199.99 €
   - Prix d'achat: 125.50 €
   - Stock: 50

## 🖱️ Test Manuel (Interface React)

### Étape 1: Créer un nouveau produit

1. Se connecter au frontend (http://localhost:5173 ou votre port)
2. Aller dans "Gestion des Produits"
3. Cliquer sur "Ajouter un produit"
4. Remplir le formulaire:
   - **Nom**: Test Prix Achat
   - **Catégorie**: Électronique (ou autre)
   - **Prix de vente**: 150.00
   - **Prix d'achat**: 89.50 ← IMPORTANT
   - **Stock initial**: 25
5. Cliquer sur "Enregistrer"

### Étape 2: Vérifier l'affichage immédiat

Après l'enregistrement, vérifier dans la liste des produits:
- ✅ Le produit apparaît immédiatement
- ✅ La catégorie affiche "Électronique" (pas "Autre")
- ✅ Le prix d'achat affiche "89.50 €" (pas "0 €")
- ✅ Le prix de vente affiche "150.00 €"
- ✅ Le stock affiche "25"

### Étape 3: Modifier le produit

1. Cliquer sur le produit créé pour l'éditer
2. Vérifier dans le formulaire de modification:
   - ✅ Le champ "Prix d'achat" contient "89.50"
   - ✅ Le champ "Prix de vente" contient "150.00"
   - ✅ Le champ "Stock" contient "25"
   - ✅ La catégorie sélectionnée est "Électronique"

3. Modifier le prix d'achat à "95.00"
4. Enregistrer
5. Vérifier que la modification est bien prise en compte

### Étape 4: Vérifier dans la console du navigateur

1. Ouvrir les DevTools (F12)
2. Aller dans l'onglet "Console"
3. Taper:
   ```javascript
   // Récupérer les produits depuis l'API
   fetch('http://localhost:5000/api/products')
     .then(r => r.json())
     .then(products => {
       console.log('Produits:', products);
       products.forEach(p => {
         console.log(`${p.name}:`, p.variants[0]);
         console.log('  - costPrice:', p.variants[0].costPrice);
         console.log('  - cost_price:', p.variants[0].cost_price);
       });
     });
   ```

4. Vérifier dans la sortie:
   - ✅ `costPrice` est présent (camelCase)
   - ✅ `cost_price` est `undefined` (pas de snake_case)
   - ✅ La valeur de `costPrice` correspond au prix d'achat saisi

## 🔍 Points de Vérification Détaillés

### Dans ProductForm.tsx

Le composant utilise:
```typescript
value={(variant as any).costPrice}
```

Cela signifie qu'il cherche la propriété `costPrice` (camelCase) dans l'objet variant.

### Dans l'API Backend

**POST /api/products** retourne maintenant:
```json
{
  "variants": [{
    "costPrice": 89.50,  // ✅ camelCase
    "price": 150.00
  }]
}
```

**GET /api/products** retourne:
```json
{
  "variants": [{
    "costPrice": 89.5,   // ✅ camelCase
    "price": 150
  }]
}
```

## ❌ Problèmes Possibles

### Problème 1: Prix d'achat affiche 0
**Cause**: L'API retourne `cost_price` au lieu de `costPrice`
**Solution**: Vérifier que le backend a été redémarré avec les dernières modifications

### Problème 2: Prix d'achat ne se sauvegarde pas
**Cause**: Le formulaire n'envoie pas `costPrice` dans la requête
**Solution**: Vérifier que ProductForm.tsx envoie bien `costPrice` dans les données

### Problème 3: Prix d'achat disparaît après modification
**Cause**: Le endpoint PATCH ne retourne pas `costPrice`
**Solution**: Vérifier que le endpoint PATCH retourne aussi le format camelCase

## 🎉 Résultat Attendu

Après tous les tests:
- ✅ Le prix d'achat s'affiche correctement à la création
- ✅ Le prix d'achat s'affiche correctement à la modification
- ✅ Le prix d'achat se sauvegarde correctement
- ✅ Le format est cohérent (camelCase) partout
- ✅ Aucune propriété snake_case n'est présente

## 📊 Commandes de Vérification Rapide

### Vérifier un produit spécifique dans la DB:
```bash
cd backend
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT pv.*, p.name FROM product_variants pv JOIN products p ON pv.product_id = p.id LIMIT 5')
  .then(r => console.table(r.rows))
  .then(() => process.exit());
"
```

### Tester l'API directement:
```bash
# Créer un produit
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test API",
    "category": "Test",
    "variants": [{"price": 100, "costPrice": 75, "stock_quantity": 10}],
    "tenantId": 1,
    "storeId": 1
  }'

# Récupérer les produits
curl http://localhost:5000/api/products | json_pp
```

## 📝 Notes

- Le test HTML (`test-frontend-cost-price.html`) est autonome et ne nécessite pas React
- Il teste directement l'API et affiche les résultats de manière visuelle
- Pour tester l'interface React complète, utilisez le test manuel
- Les deux tests sont complémentaires
