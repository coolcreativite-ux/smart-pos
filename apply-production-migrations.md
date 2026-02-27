# Guide d'application des migrations en production

## Vérification préalable

Avant d'appliquer les migrations, vérifiez quelles tables/colonnes existent déjà en production.

### Connexion à la base de production

Utilisez les informations de `backend/.env.production` :

```bash
DATABASE_URL=postgresql://postgres.qihnlmqjqhbafxqiauqo:Eyemon@2019@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

## Migrations à appliquer

### Migration 1 : Système de facturation (001_add_invoice_system.sql)

**Tables créées :**
- `invoices` - Factures et reçus
- `invoice_items` - Lignes de facture
- `invoice_sequences` - Numérotation séquentielle
- `invoice_taxes` - Taxes additionnelles

**Colonnes ajoutées :**
- `customers.ncc` - Numéro de Compte Contribuable
- `customers.address` - Adresse du client

**Comment appliquer :**
```sql
-- Exécutez le contenu de database/migrations/001_add_invoice_system.sql
```

### Migration 2 : Informations entreprise (002_add_tenant_invoice_fields.sql)

**Colonnes ajoutées :**
- `tenants.ncc` - NCC de l'entreprise
- `tenants.address` - Adresse de l'entreprise
- `tenants.updated_at` - Date de mise à jour

**Comment appliquer :**
```sql
-- Exécutez le contenu de database/migrations/002_add_tenant_invoice_fields.sql
```

### Migration 3 : Retours de produits (add_return_transactions.sql)

**Tables créées :**
- `return_transactions` - Transactions de retour

**Comment appliquer :**
```sql
-- Exécutez le contenu de database/migrations/add_return_transactions.sql
```

## Ordre d'application recommandé

1. **Migration 001** - Système de facturation (dépendances : customers, tenants, products)
2. **Migration 002** - Champs tenant (dépendances : tenants)
3. **Migration 003** - Retours (dépendances : sales, users, tenants)

## Vérification post-migration

Après avoir appliqué les migrations, vérifiez :

```sql
-- Vérifier les tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('invoices', 'invoice_items', 'invoice_sequences', 'invoice_taxes', 'return_transactions')
ORDER BY table_name;

-- Vérifier les colonnes customers
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customers' 
  AND column_name IN ('ncc', 'address');

-- Vérifier les colonnes tenants
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tenants' 
  AND column_name IN ('ncc', 'address', 'updated_at');
```

## Rollback (si nécessaire)

Si vous devez annuler les migrations :

```sql
-- Rollback Migration 3
DROP TABLE IF EXISTS return_transactions CASCADE;

-- Rollback Migration 2
ALTER TABLE tenants DROP COLUMN IF EXISTS ncc;
ALTER TABLE tenants DROP COLUMN IF EXISTS address;
ALTER TABLE tenants DROP COLUMN IF EXISTS updated_at;

-- Rollback Migration 1
DROP TABLE IF EXISTS invoice_taxes CASCADE;
DROP TABLE IF EXISTS invoice_sequences CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
ALTER TABLE customers DROP COLUMN IF EXISTS ncc;
ALTER TABLE customers DROP COLUMN IF EXISTS address;
```

## Notes importantes

- **Sauvegarde** : Faites une sauvegarde de la base de données avant d'appliquer les migrations
- **Downtime** : Les migrations peuvent prendre quelques secondes, planifiez en conséquence
- **Permissions** : Assurez-vous d'avoir les droits nécessaires pour créer des tables et modifier le schéma
- **RLS** : Les migrations activent Row Level Security pour l'isolation multi-tenant
