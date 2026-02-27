# 🔍 Debug: Erreur 500 Backend

## ❌ Erreur Rencontrée
```
POST http://localhost:5000/api/invoices 500 (Internal Server Error)
```

## ✅ Correctif Frontend Appliqué
- ✅ `showToast` remplacé par `addToast` dans InvoiceGenerator

## 🔍 Diagnostic Backend Requis

### 1. Vérifier les Logs Backend
Dans le terminal où tourne le backend, cherchez l'erreur détaillée après avoir cliqué sur "Générer la Facture".

**Erreurs possibles:**
- ❌ Table `invoices` n'existe pas → Migration non exécutée
- ❌ Colonne manquante → Schéma de base de données incomplet
- ❌ Erreur de validation → Données invalides
- ❌ Erreur de connexion DB → PostgreSQL non démarré

### 2. Vérifier la Migration
```bash
# Vérifier si les tables existent
psql -U postgres -d smart_pos -c "\dt"
```

**Tables requises:**
- `invoices`
- `invoice_items`
- `invoice_taxes`

### 3. Exécuter la Migration (si nécessaire)
```bash
cd database
psql -U postgres -d smart_pos -f migrations/001_add_invoice_system.sql
```

## 📋 Checklist de Diagnostic

- [ ] Logs backend consultés
- [ ] Message d'erreur identifié
- [ ] Tables de facturation existent
- [ ] PostgreSQL démarré et accessible
- [ ] Migrations exécutées

## 🔧 Solutions Possibles

### Si "Table invoices does not exist"
```bash
cd database
psql -U postgres -d smart_pos -f migrations/001_add_invoice_system.sql
```

### Si "Column does not exist"
Vérifier que la migration est complète:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'invoices';
```

### Si "Connection refused"
Démarrer PostgreSQL:
```bash
# Windows
net start postgresql-x64-14

# Ou via services.msc
```

## 📊 Informations Utiles

**Endpoint:** `POST /api/invoices`  
**Contrôleur:** `backend/controllers/invoices.controller.ts`  
**Migration:** `database/migrations/001_add_invoice_system.sql`

## 🚀 Après Correction

1. Redémarrer le backend si nécessaire
2. Rafraîchir le frontend (`Ctrl + Shift + R`)
3. Réessayer de créer une facture

---

**Prochaine étape:** Consultez les logs backend et partagez le message d'erreur exact.
