# Guide d'Import de Données Excel vers Smart POS

## 📋 Vue d'ensemble

Ce guide explique comment importer des données Excel existantes dans votre application Smart POS via Supabase.

---

## 🎯 Étape 1: Préparer vos fichiers Excel

### Format requis pour chaque type de données:

### **A. Produits (Products)**

Créez un fichier Excel avec ces colonnes **exactement dans cet ordre**:

| tenant_id | name | category_id | description | image_url | price | cost_price | sku | barcode | stock_quantity | store_id | low_stock_threshold |
|-----------|------|-------------|-------------|-----------|-------|------------|-----|---------|----------------|----------|---------------------|
| 1 | T-Shirt Blanc | 1 | T-shirt en coton | https://... | 15000 | 8000 | TS-001 | 123456789 | 50 | 1 | 10 |
| 1 | Jean Slim | 1 | Jean bleu | https://... | 25000 | 12000 | JN-001 | 987654321 | 30 | 1 | 5 |

**Notes importantes:**
- `tenant_id`: Utilisez `1` (ou l'ID de votre tenant)
- `category_id`: Créez d'abord les catégories, puis utilisez leur ID
- `image_url`: URL d'image (optionnel, peut être vide)
- `price` et `cost_price`: En FCFA (sans virgule ni espace)
- `store_id`: ID du magasin (généralement `1`)

---

### **B. Catégories (Categories)**

| tenant_id | name | description |
|-----------|------|-------------|
| 1 | Vêtements | Articles vestimentaires |
| 1 | Accessoires | Sacs, ceintures, etc. |
| 1 | Chaussures | Tous types de chaussures |

**⚠️ IMPORTANT:** Importez les catégories AVANT les produits!

---

### **C. Clients (Customers)**

| tenant_id | first_name | last_name | email | phone | loyalty_points | store_credit | store_id |
|-----------|------------|-----------|-------|-------|----------------|--------------|----------|
| 1 | Jean | Dupont | jean@email.com | +225 01 02 03 04 | 0 | 0 | 1 |
| 1 | Marie | Kouassi | marie@email.com | +225 05 06 07 08 | 0 | 0 | 1 |

---

### **D. Fournisseurs (Suppliers)**

| tenant_id | name | contact_person | email | phone | address |
|-----------|------|----------------|-------|-------|---------|
| 1 | Textile Africa | M. Sow | contact@textile.com | +225 05 06 07 08 | Abidjan, Côte d'Ivoire |
| 1 | Global Retail | Mme Diop | sales@global.com | +225 09 10 11 12 | Dakar, Sénégal |

---

### **E. Magasins (Stores)**

| tenant_id | name | location | phone |
|-----------|------|----------|-------|
| 1 | Magasin Principal | Avenue de l'Indépendance, Abidjan | +225 01 02 03 04 |
| 1 | Succursale Ouest | Centre Commercial, Cocody | +225 05 06 07 08 |

---

## 🔄 Étape 2: Convertir Excel en CSV

### Méthode 1: Excel/LibreOffice
1. Ouvrir votre fichier Excel
2. **Fichier** → **Enregistrer sous**
3. Choisir le format: **CSV UTF-8 (délimité par des virgules) (*.csv)**
4. Cliquer sur **Enregistrer**

### Méthode 2: Google Sheets
1. Ouvrir votre fichier dans Google Sheets
2. **Fichier** → **Télécharger** → **Valeurs séparées par des virgules (.csv)**

**⚠️ Important:** Assurez-vous que l'encodage est **UTF-8** pour supporter les caractères accentués.

---

## 📤 Étape 3: Importer dans Supabase

### 1. Accéder à Supabase
- Aller sur: https://supabase.com/dashboard
- Se connecter avec votre compte
- Sélectionner votre projet: `lsujhpaxdsirlnllangt`

### 2. Ouvrir le Table Editor
- Dans le menu de gauche, cliquer sur **Table Editor**

### 3. Importer les Catégories (À FAIRE EN PREMIER)
1. Sélectionner la table **`categories`**
2. Cliquer sur **Insert** → **Import data from CSV**
3. Sélectionner votre fichier `categories.csv`
4. Vérifier le mapping des colonnes:
   - Colonne 1 Excel → `tenant_id`
   - Colonne 2 Excel → `name`
   - Colonne 3 Excel → `description`
5. Cliquer sur **Import**
6. **Noter les IDs** des catégories créées (vous en aurez besoin pour les produits)

### 4. Importer les Magasins
1. Sélectionner la table **`stores`**
2. Cliquer sur **Insert** → **Import data from CSV**
3. Sélectionner votre fichier `stores.csv`
4. Vérifier le mapping des colonnes
5. Cliquer sur **Import**

### 5. Importer les Produits
1. Sélectionner la table **`products`**
2. Cliquer sur **Insert** → **Import data from CSV**
3. Sélectionner votre fichier `products.csv`
4. Vérifier le mapping des colonnes
5. Cliquer sur **Import**

### 6. Créer les Variantes de Produits
Pour chaque produit importé, vous devez créer au moins une variante:

**Option A: Via SQL (Recommandé pour import en masse)**

Exécuter dans le SQL Editor de Supabase:

```sql
-- Créer une variante par défaut pour chaque produit
INSERT INTO product_variants (product_id, selected_options, price, cost_price, sku, barcode)
SELECT 
    p.id,
    '{}'::jsonb,
    15000, -- Remplacer par le prix du produit
    8000,  -- Remplacer par le coût
    p.sku,
    p.barcode
FROM products p
WHERE NOT EXISTS (
    SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id
);
```

**Option B: Via l'interface (pour quelques produits)**
1. Aller dans la table **`product_variants`**
2. Cliquer sur **Insert row**
3. Remplir:
   - `product_id`: ID du produit
   - `selected_options`: `{}`
   - `price`: Prix de vente
   - `cost_price`: Prix d'achat
   - `sku`: Référence
   - `barcode`: Code-barres

### 7. Créer les Entrées d'Inventaire
Pour chaque variante, créer une entrée d'inventaire:

```sql
-- Créer l'inventaire pour chaque variante
INSERT INTO inventory (variant_id, store_id, quantity)
SELECT 
    pv.id,
    1, -- ID du magasin principal
    50 -- Quantité initiale (à ajuster)
FROM product_variants pv
WHERE NOT EXISTS (
    SELECT 1 FROM inventory i WHERE i.variant_id = pv.id AND i.store_id = 1
);
```

### 8. Importer les Clients
1. Sélectionner la table **`customers`**
2. Cliquer sur **Insert** → **Import data from CSV**
3. Sélectionner votre fichier `customers.csv`
4. Vérifier le mapping des colonnes
5. Cliquer sur **Import**

### 9. Importer les Fournisseurs
1. Sélectionner la table **`suppliers`**
2. Cliquer sur **Insert** → **Import data from CSV**
3. Sélectionner votre fichier `suppliers.csv`
4. Vérifier le mapping des colonnes
5. Cliquer sur **Import**

---

## ✅ Étape 4: Vérification

### Vérifier dans Supabase:
1. Aller dans **Table Editor**
2. Vérifier chaque table:
   - ✅ `categories`: Toutes les catégories sont présentes
   - ✅ `stores`: Tous les magasins sont présents
   - ✅ `products`: Tous les produits sont présents
   - ✅ `product_variants`: Chaque produit a au moins une variante
   - ✅ `inventory`: Chaque variante a une entrée d'inventaire
   - ✅ `customers`: Tous les clients sont présents
   - ✅ `suppliers`: Tous les fournisseurs sont présents

### Vérifier dans l'Application:
1. Se connecter à https://smartpos.cooldigital.africa
2. Aller dans **Produits** → Vérifier que les produits s'affichent
3. Aller dans **Clients** → Vérifier que les clients s'affichent
4. Aller dans **Inventaire** → Vérifier les stocks

---

## 🚨 Problèmes Courants et Solutions

### Problème 1: Erreur "Foreign key constraint"
**Cause:** Vous essayez d'importer des produits avant les catégories
**Solution:** Importez toujours dans cet ordre:
1. Categories
2. Stores
3. Products
4. Product_variants
5. Inventory
6. Customers
7. Suppliers

### Problème 2: Caractères accentués mal affichés
**Cause:** Encodage incorrect du CSV
**Solution:** Réenregistrer le CSV en UTF-8

### Problème 3: Les produits ne s'affichent pas dans l'app
**Cause:** Pas de variantes ou pas d'inventaire
**Solution:** Exécuter les requêtes SQL de création de variantes et d'inventaire

### Problème 4: Erreur "tenant_id not found"
**Cause:** Le tenant_id n'existe pas
**Solution:** Utiliser `1` comme tenant_id (créé lors de l'installation)

---

## 📊 Templates Excel à Télécharger

Je vous recommande de créer des templates Excel avec les colonnes exactes pour faciliter la préparation des données.

### Structure minimale pour démarrer:

**1. categories.csv**
```csv
tenant_id,name,description
1,Vêtements,Articles vestimentaires
1,Accessoires,Sacs et accessoires
```

**2. stores.csv**
```csv
tenant_id,name,location,phone
1,Magasin Principal,Abidjan,+225 01 02 03 04
```

**3. products.csv**
```csv
tenant_id,name,category_id,description,image_url,low_stock_threshold
1,T-Shirt Blanc,1,T-shirt en coton,,10
1,Jean Slim,1,Jean bleu,,5
```

**4. Ensuite exécuter le SQL pour créer variantes et inventaire**

---

## 💡 Conseils Pro

1. **Commencez petit:** Importez d'abord 5-10 produits pour tester
2. **Sauvegardez:** Gardez une copie de vos fichiers Excel originaux
3. **Vérifiez les IDs:** Notez les IDs des catégories et magasins créés
4. **Utilisez SQL:** Pour les imports en masse, SQL est plus rapide
5. **Testez:** Vérifiez dans l'app après chaque import

---

## 🆘 Besoin d'Aide?

Si vous rencontrez des problèmes:
1. Vérifiez que toutes les colonnes sont présentes
2. Vérifiez l'ordre d'import (catégories → produits)
3. Vérifiez que les IDs de référence existent (category_id, store_id, etc.)
4. Consultez les logs d'erreur dans Supabase

---

## 🎉 Félicitations!

Une fois l'import terminé, vos données Excel sont maintenant dans Smart POS et prêtes à être utilisées!

**Prochaines étapes:**
- Vérifier les stocks
- Configurer les paramètres du magasin
- Former les utilisateurs
- Commencer les ventes!
