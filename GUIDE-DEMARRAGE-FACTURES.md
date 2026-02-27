# Guide de Démarrage - Système de Facturation

## ✅ État Actuel

Le système de facturation est **complètement configuré** :

- ✅ Tables de base de données créées (invoices, invoice_items, invoice_taxes, invoice_sequences)
- ✅ Backend configuré avec tous les endpoints
- ✅ Frontend avec interface complète
- ✅ Intégration dans le Dashboard (onglet "Factures")
- ✅ Permissions configurées pour le rôle Owner

## 🚀 Démarrage de l'Application

### Option 1: Script Automatique (Recommandé)

```powershell
.\start-app.ps1
```

Ce script démarre automatiquement le backend ET le frontend.

### Option 2: Démarrage Manuel

**Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

## 📋 Vérification du Système

### 1. Vérifier la Base de Données

```powershell
node check-db-tables.cjs
```

Résultat attendu: ✓ Toutes les tables de facturation sont présentes

### 2. Vérifier le Backend

Ouvrez: http://localhost:5000/api/health

Résultat attendu: `{"status":"ok",...}`

### 3. Vérifier le Frontend

Ouvrez: http://localhost:3000

## 🎯 Utilisation du Système de Facturation

### Accès

1. Connectez-vous avec un compte **Owner** ou **Admin**
2. Cliquez sur l'onglet **"Factures"** dans le Dashboard
3. Vous verrez deux boutons:
   - **+ Nouvelle Facture** (document officiel)
   - **+ Nouveau Reçu** (document simplifié)

### Créer une Facture

1. Cliquez sur **"+ Nouvelle Facture"**
2. Sélectionnez le type de facturation:
   - **B2C** (Particulier) - Nécessite: nom, téléphone, email
   - **B2B** (Entreprise) - Nécessite: nom, NCC (numéro contribuable)
3. Remplissez les informations client
4. Ajoutez des articles (produits de votre inventaire)
5. Configurez:
   - Mode de paiement (Espèces ajoute automatiquement le timbre de 100 FCFA)
   - Remise globale (optionnel)
   - Date d'échéance (optionnel)
6. Cliquez sur **"Générer la facture"**

### Fonctionnalités

- ✅ Numérotation automatique (format: 2026-00001, A-2026-00001, P-2026-00001)
- ✅ Calcul automatique de la TVA (18% par défaut)
- ✅ Timbre de quittance automatique pour paiements en espèces (100 FCFA)
- ✅ Génération PDF automatique
- ✅ Export CSV automatique
- ✅ Historique complet des factures
- ✅ Filtres et recherche

## 🔧 Résolution de Problèmes

### Erreur 500 lors de la création

**Cause probable:** Backend non démarré ou erreur de connexion DB

**Solution:**
1. Vérifiez que le backend est démarré: `curl http://localhost:5000/api/health`
2. Vérifiez les logs du terminal backend pour l'erreur exacte
3. Vérifiez la connexion DB: `node check-db-tables.cjs`

### "fetchCustomers is not a function"

**Cause:** Contextes non chargés correctement

**Solution:**
1. Rechargez la page (Ctrl+R)
2. Vérifiez que le backend est démarré
3. Vérifiez la console du navigateur pour d'autres erreurs

### "Cannot read properties of undefined"

**Cause:** Données non chargées

**Solution:**
1. Vérifiez que vous avez des produits dans l'inventaire
2. Vérifiez que le backend répond: http://localhost:5000/api/products
3. Rechargez la page

### Tables manquantes

**Solution:**
1. Ouvrez pgAdmin ou un client PostgreSQL
2. Connectez-vous à la base `smart_pos`
3. Exécutez le fichier: `database/migrations/001_add_invoice_system.sql`

## 📊 Structure des Données

### Types de Documents

- **invoice** (Facture) - Document officiel avec TVA
- **receipt** (Reçu) - Document simplifié

### Types de Facturation

- **B2C** (Business to Consumer) - Particuliers
- **B2B** (Business to Business) - Entreprises (nécessite NCC)
- **B2F** (Business to Foreign) - Clients étrangers
- **B2G** (Business to Government) - Administration

### Sous-types

- **standard** - Facture normale (format: 2026-00001)
- **avoir** - Avoir/crédit (format: A-2026-00001)
- **proforma** - Proforma (format: P-2026-00001)

## 🎨 Personnalisation

Les factures utilisent automatiquement:
- Logo de l'entreprise (depuis les paramètres)
- Nom et coordonnées de l'entreprise
- NCC de l'entreprise (pour factures B2B)

## 📞 Support

Si vous rencontrez des problèmes:

1. Vérifiez les logs du backend (terminal)
2. Vérifiez la console du navigateur (F12)
3. Exécutez les scripts de diagnostic:
   - `node check-db-tables.cjs`
   - `node test-invoice-creation.cjs` (après démarrage du backend)

## 🎉 Prêt à Utiliser!

Le système est maintenant complètement opérationnel. Démarrez l'application avec `.\start-app.ps1` et commencez à créer vos factures!
