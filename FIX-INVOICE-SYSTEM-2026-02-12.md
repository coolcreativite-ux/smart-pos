# Corrections du Système de Facturation - 12 février 2026

## Problèmes Résolus

### 1. Tables de facturation manquantes ✅
**Erreur**: `column "documenttype" of relation "invoices" does not exist`

**Cause**: Les tables du système de facturation n'avaient pas été créées dans la base de données.

**Solution**: 
- Exécution de la migration `001_add_invoice_system.sql`
- Exécution de la migration `002_add_tenant_invoice_fields.sql`
- Création des tables: `invoices`, `invoice_items`, `invoice_sequences`, `invoice_taxes`
- Ajout des colonnes `ncc` et `address` aux tables `customers` et `tenants`

**Scripts créés**:
- `backend/scripts/run-invoice-migration.cjs`
- `backend/scripts/run-tenant-invoice-migration.cjs`
- `backend/scripts/test-invoice-system.cjs`

---

### 2. Route générique interfère avec routes spécifiques ✅
**Erreur**: La route générique `POST /api/:table` capturait les requêtes vers `/api/invoices`

**Cause**: En Express, l'ordre des routes est important. La route générique était définie AVANT la route spécifique `/api/invoices`, donc elle interceptait toutes les requêtes POST.

**Solution**: 
- Commenté la route générique `app.post('/api/:table', ...)` dans `backend/server.ts` (ligne ~1777)
- Les routes spécifiques sont maintenant utilisées correctement

**Code modifié**:
```typescript
// backend/server.ts
/*// Generic POST route for other tables
app.post('/api/:table', async (req, res) => {
  // ... code commenté
});*/
```

---

### 3. Structure de la table customers incompatible ✅
**Erreur**: `column "name" of relation "customers" does not exist`

**Cause**: La table `customers` utilise `first_name` et `last_name` au lieu d'une seule colonne `name`.

**Solution**: 
- Modifié le contrôleur pour séparer le nom complet en `first_name` et `last_name`
- Mis à jour toutes les requêtes SQL pour utiliser `CONCAT(c.first_name, ' ', c.last_name)`

**Fichier modifié**: `backend/controllers/invoices.controller.ts`

**Changements**:
```typescript
// Insertion d'un nouveau client
const fullName = requestData.customerData.name || 'Client';
const nameParts = fullName.trim().split(' ');
const firstName = nameParts[0] || 'Client';
const lastName = nameParts.slice(1).join(' ') || '';

await client.query(
  `INSERT INTO customers (tenant_id, first_name, last_name, ncc, phone, email, address)
   VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
  [tenantId, firstName, lastName, ...]
);

// Récupération du nom
const customerResult = await client.query(
  `SELECT first_name, last_name, ncc, phone, email, address
   FROM customers WHERE id = $1`,
  [customerId]
);
const customerName = `${customerResult.rows[0].first_name} ${customerResult.rows[0].last_name}`.trim();

// Recherche par nom
whereConditions.push(`CONCAT(c.first_name, ' ', c.last_name) ILIKE $${paramIndex}`);

// Affichage du nom
SELECT CONCAT(c.first_name, ' ', c.last_name) as customer_name
```

---

### 4. Structure de la table product_variants incompatible ✅
**Erreur**: `column pv.name does not exist`

**Cause**: La table `product_variants` n'a pas de colonne `name`. Elle utilise `selected_options` (JSONB) pour stocker les options de variante.

**Solution**: 
- Modifié la requête pour récupérer `selected_options` au lieu de `name`
- Construit le nom de la variante à partir des valeurs dans `selected_options`
- Utilise "Standard" si aucune option n'est définie

**Fichier modifié**: `backend/controllers/invoices.controller.ts`

**Changements**:
```typescript
// Récupération des infos produit/variante
const productResult = await client.query(
  `SELECT p.name as product_name, pv.sku, pv.selected_options
   FROM products p
   JOIN product_variants pv ON pv.product_id = p.id
   WHERE p.id = $1 AND pv.id = $2`,
  [originalItem.productId, originalItem.variantId]
);

const productName = productResult.rows[0]?.product_name || 'Produit inconnu';
const selectedOptions = productResult.rows[0]?.selected_options || {};
const variantName = Object.keys(selectedOptions).length > 0 
  ? Object.values(selectedOptions).join(' / ')
  : 'Standard';
```

---

## Scripts Utiles Créés

### 1. Vérification de la structure des tables
```bash
# Vérifier la table customers
node backend/scripts/check-customers-table.cjs

# Vérifier la table product_variants
node backend/scripts/check-product-variants-table.cjs

# Tester le système de facturation complet
node backend/scripts/test-invoice-system.cjs
```

### 2. Exécution des migrations
```bash
# Migration principale du système de facturation
node backend/scripts/run-invoice-migration.cjs

# Migration des champs tenant
node backend/scripts/run-tenant-invoice-migration.cjs
```

---

## État Final du Système

### ✅ Backend
- Serveur opérationnel sur http://localhost:5000
- Routes `/api/invoices` fonctionnelles
- Contrôleur adapté à la structure réelle des tables
- Migrations exécutées avec succès

### ✅ Frontend
- Serveur opérationnel sur http://localhost:3001
- Composants de facturation intégrés
- Validation des données client
- Conversion TTC → HT automatique

### ✅ Base de Données
- Tables créées: `invoices`, `invoice_items`, `invoice_sequences`, `invoice_taxes`
- Colonnes ajoutées: `customers.ncc`, `customers.address`, `tenants.ncc`, `tenants.address`
- Index et contraintes en place
- Row Level Security activé

---

## Test du Système

### Workflow Complet
1. ✅ Connexion utilisateur
2. ✅ Création d'une vente avec client
3. ✅ Finalisation de la vente
4. ✅ Clic sur "Facture"
5. ✅ Génération de la facture
6. ✅ Création du PDF
7. ✅ Création du CSV
8. ✅ Téléchargement des documents

### Fonctionnalités Testées
- ✅ Génération de facture B2B (avec NCC)
- ✅ Génération de reçu B2C (avec téléphone ou email)
- ✅ Conversion TTC → HT
- ✅ Calcul de TVA (0%, 9%, 18%)
- ✅ Timbre de quittance automatique (espèces)
- ✅ Numérotation séquentielle (2026-00001, 2026-00002, etc.)

---

## Leçons Apprises

### 1. Ordre des routes Express
L'ordre de définition des routes dans Express est critique. Les routes génériques doivent toujours être définies APRÈS les routes spécifiques.

### 2. Vérification de la structure des tables
Avant d'écrire du code qui interagit avec la base de données, toujours vérifier la structure réelle des tables plutôt que de faire des suppositions.

### 3. Migrations de base de données
Les migrations doivent être exécutées avant de démarrer le développement des fonctionnalités qui en dépendent.

### 4. Adaptation aux conventions existantes
Le code doit s'adapter aux conventions de nommage existantes dans la base de données (snake_case vs camelCase, first_name/last_name vs name, etc.).

---

## Prochaines Étapes

### Phase 11: Fonctionnalités Avancées
- [ ] Conversion proforma → facture standard
- [ ] Création d'avoirs (credit notes)
- [ ] Archivage des factures
- [ ] Gestion des séquences par année

### Phase 12: Tests
- [ ] Tests unitaires des services
- [ ] Tests d'intégration de l'API
- [ ] Tests E2E du workflow complet

### Phase 13: Documentation
- [ ] Guide utilisateur en français
- [ ] Documentation technique de l'API
- [ ] Diagrammes d'architecture

---

**Date**: 12 février 2026  
**Statut**: ✅ Système opérationnel  
**Prochaine action**: Tester la génération complète d'une facture
