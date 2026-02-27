# 📄 Système de Facturation - Smart POS

## 🎉 Système Complètement Opérationnel!

Le système de facturation professionnel est maintenant **100% fonctionnel** et intégré dans votre application Smart POS.

## ⚡ Démarrage Rapide

```powershell
.\start-app.ps1
```

Puis ouvrez: **http://localhost:3000** → Onglet **"Factures"**

## ✨ Fonctionnalités

### Types de Documents
- 📄 **Factures** - Documents officiels avec TVA
- 🧾 **Reçus** - Documents simplifiés

### Types de Facturation
- 👤 **B2C** (Particuliers) - Nom, téléphone, email
- 🏢 **B2B** (Entreprises) - Nom, NCC (numéro contribuable)
- 🌍 **B2F** (Clients étrangers)
- 🏛️ **B2G** (Administration)

### Calculs Automatiques
- ✅ TVA 18% (taux ivoirien)
- ✅ Remises par article
- ✅ Remise globale
- ✅ Timbre de quittance (100 FCFA pour espèces)

### Génération Automatique
- 📑 PDF professionnel avec logo
- 📊 Export CSV
- 🔢 Numérotation séquentielle (2026-00001)

## 🎯 Utilisation

### Créer une Facture

1. **Onglet "Factures"** → **"+ Nouvelle Facture"**
2. **Sélectionner le type** (B2C ou B2B)
3. **Remplir les infos client**
4. **Ajouter des articles** (depuis votre inventaire)
5. **Configurer** (paiement, remise, échéance)
6. **Générer!**

### Consulter l'Historique

- Liste complète des factures
- Filtres par date, client, montant
- Téléchargement PDF/CSV
- Détails complets

## 🔒 Permissions

Accès réservé aux rôles:
- ✅ **Owner** (Propriétaire)
- ✅ **Admin** (Administrateur)

## 📁 Fichiers Importants

### Documentation
- `DEMARRAGE-RAPIDE.md` - Guide express
- `GUIDE-DEMARRAGE-FACTURES.md` - Guide complet
- `STATUT-SYSTEME-FACTURES.md` - État du système

### Scripts
- `start-app.ps1` - Démarrage automatique
- `check-db-tables.cjs` - Vérification DB
- `test-invoice-creation.cjs` - Test API

### Code Source

**Backend:**
- `backend/controllers/invoices.controller.ts`
- `backend/routes/invoices.routes.ts`
- `backend/services/` (5 services)

**Frontend:**
- `frontend/pages/InvoicesPage.tsx`
- `frontend/contexts/InvoiceContext.tsx`
- `frontend/components/invoices/` (5 composants)

**Base de Données:**
- `database/migrations/001_add_invoice_system.sql`

## 🔧 Diagnostic

### Vérifier la Base de Données
```powershell
node check-db-tables.cjs
```

### Tester l'API
```powershell
node test-invoice-creation.cjs
```

### Vérifier le Backend
```
http://localhost:5000/api/health
```

## 📊 Architecture

```
┌─────────────────────────────────────────┐
│           Frontend (React)              │
│  - InvoicesPage                         │
│  - InvoiceGenerator                     │
│  - InvoiceContext                       │
└──────────────┬──────────────────────────┘
               │ HTTP/REST
┌──────────────▼──────────────────────────┐
│        Backend (Express/Node)           │
│  - InvoicesController                   │
│  - InvoiceNumberService                 │
│  - TaxCalculationService                │
│  - PDFGenerationService                 │
│  - CSVExportService                     │
└──────────────┬──────────────────────────┘
               │ SQL
┌──────────────▼──────────────────────────┐
│      PostgreSQL (Supabase)              │
│  - invoices                             │
│  - invoice_items                        │
│  - invoice_taxes                        │
│  - invoice_sequences                    │
└─────────────────────────────────────────┘
```

## 🎨 Personnalisation

Les factures utilisent automatiquement:
- Logo de votre entreprise
- Nom et coordonnées
- NCC (pour factures B2B)
- Couleurs de votre marque

Configuration dans: **Paramètres** → **Informations Entreprise**

## 💡 Exemples

### Facture B2C (Particulier)
```
Client: Jean Kouassi
Téléphone: 0123456789
Email: jean@example.com

Article: Ordinateur Portable
Quantité: 1
Prix HT: 500,000 FCFA
TVA 18%: 90,000 FCFA
Total TTC: 590,000 FCFA
```

### Facture B2B (Entreprise)
```
Client: Cool Digital Africa
NCC: CI-ABJ-2024-M-12345
Adresse: Abidjan, Cocody

Article: Licence Logiciel
Quantité: 10
Prix HT: 1,000,000 FCFA
TVA 18%: 180,000 FCFA
Total TTC: 1,180,000 FCFA
```

## 🚨 Résolution de Problèmes

### Erreur 500
→ Vérifiez les logs du terminal backend

### "fetchCustomers is not a function"
→ Rechargez la page (Ctrl+R)

### Tables manquantes
→ Exécutez la migration dans pgAdmin

### Backend ne répond pas
→ Vérifiez qu'il est démarré: `cd backend && npm run dev`

## 📞 Support

1. Consultez `GUIDE-DEMARRAGE-FACTURES.md`
2. Vérifiez les logs (backend terminal + console navigateur F12)
3. Exécutez les scripts de diagnostic

## 🎓 Conformité

Le système respecte:
- ✅ Normes de facturation ivoiriennes
- ✅ TVA 18% (taux standard)
- ✅ Timbre de quittance (100 FCFA)
- ✅ Numérotation séquentielle obligatoire
- ✅ Mentions légales (NCC, adresse)

## 🚀 Prêt à Utiliser!

Tout est configuré et fonctionnel. Lancez simplement:

```powershell
.\start-app.ps1
```

Et commencez à créer vos factures professionnelles! 🎉

---

**Version:** 1.0.0  
**Date:** 11 février 2026  
**Statut:** ✅ Production Ready
