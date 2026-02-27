# Guide d'exécution de la migration SQL

## Prérequis
- PostgreSQL installé et en cours d'exécution
- Accès à la base de données de développement
- Variables d'environnement configurées dans `backend/.env.development`

## Option 1: Via psql (Recommandé)

### Windows (PowerShell)
```powershell
# Se connecter à PostgreSQL et exécuter la migration
$env:PGPASSWORD="votre_mot_de_passe"
psql -U postgres -d nom_de_votre_base -f database/migrations/001_add_invoice_system.sql
```

### Windows (CMD)
```cmd
set PGPASSWORD=votre_mot_de_passe
psql -U postgres -d nom_de_votre_base -f database/migrations/001_add_invoice_system.sql
```

### Linux/Mac
```bash
PGPASSWORD=votre_mot_de_passe psql -U postgres -d nom_de_votre_base -f database/migrations/001_add_invoice_system.sql
```

## Option 2: Via Supabase Dashboard

Si vous utilisez Supabase:

1. Ouvrez le Supabase Dashboard
2. Allez dans "SQL Editor"
3. Créez une nouvelle query
4. Copiez-collez le contenu de `database/migrations/001_add_invoice_system.sql`
5. Exécutez la query

## Option 3: Via pgAdmin

1. Ouvrez pgAdmin
2. Connectez-vous à votre serveur PostgreSQL
3. Sélectionnez votre base de données
4. Clic droit → "Query Tool"
5. Ouvrez le fichier `database/migrations/001_add_invoice_system.sql`
6. Exécutez (F5)

## Vérification de la migration

Après l'exécution, vérifiez que les tables ont été créées:

```sql
-- Vérifier les nouvelles tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('invoices', 'invoice_items', 'invoice_sequences', 'invoice_taxes');

-- Vérifier les nouvelles colonnes dans customers
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND column_name IN ('ncc', 'address');
```

Vous devriez voir:
- ✅ Table `invoices` créée
- ✅ Table `invoice_items` créée
- ✅ Table `invoice_sequences` créée
- ✅ Table `invoice_taxes` créée
- ✅ Colonnes `ncc` et `address` ajoutées à `customers`

## En cas d'erreur

### Erreur: "relation already exists"
La migration a déjà été exécutée. Pas besoin de la réexécuter.

### Erreur: "permission denied"
Assurez-vous d'avoir les droits suffisants sur la base de données.

### Erreur: "database does not exist"
Vérifiez le nom de votre base de données dans les variables d'environnement.

## Rollback (si nécessaire)

Pour annuler la migration:

```sql
-- Supprimer les tables dans l'ordre inverse
DROP TABLE IF EXISTS invoice_taxes CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoice_sequences CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;

-- Supprimer les colonnes ajoutées
ALTER TABLE customers DROP COLUMN IF EXISTS ncc;
ALTER TABLE customers DROP COLUMN IF EXISTS address;
```

## Prochaines étapes

Après la migration réussie:

1. ✅ Démarrer le backend: `cd backend && npm run dev`
2. ✅ Démarrer le frontend: `npm run dev`
3. ✅ Accéder à la page de test des factures
4. ✅ Tester la création d'une facture

## Support

En cas de problème, consultez:
- `backend/INVOICE-SYSTEM-README.md` - Documentation complète du système
- `IMPLEMENTATION-PROGRESS-2026-02-11.md` - État d'avancement
- `.kiro/specs/fne-invoice-system/` - Spécifications détaillées
