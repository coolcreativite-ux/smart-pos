# 🧪 Guide de Test du Système de Facturation FNE

## Vue d'ensemble

Ce guide vous accompagne pour tester le système de facturation FNE de bout en bout.

## Prérequis

### 1. Base de données
- [ ] PostgreSQL en cours d'exécution
- [ ] Migration SQL exécutée (voir `RUN-MIGRATION.md`)
- [ ] Tables créées: `invoices`, `invoice_items`, `invoice_sequences`, `invoice_taxes`

### 2. Backend
- [ ] Dépendances installées: `cd backend && npm install`
- [ ] Variables d'environnement configurées dans `backend/.env.development`
- [ ] Backend démarré: `npm run dev` (port 5000)

### 3. Frontend
- [ ] Dépendances installées: `npm install`
- [ ] Frontend démarré: `npm run dev`
- [ ] Compte utilisateur créé et connecté

## Étape 1: Vérifier l'installation

### Vérifier le backend
```bash
# Tester la santé du backend
curl http://localhost:5000/api/health

# Devrait retourner:
# {"status":"healthy","database":"connected","timestamp":"..."}
```

### Vérifier les tables
```sql
-- Dans psql ou pgAdmin
SELECT COUNT(*) FROM invoices;
SELECT COUNT(*) FROM invoice_items;
SELECT COUNT(*) FROM invoice_sequences;
SELECT COUNT(*) FROM invoice_taxes;
```

## Étape 2: Accéder à la page de test

1. Ouvrez votre navigateur
2. Connectez-vous à l'application
3. Accédez à la page de test (à intégrer dans le menu)
4. Vous devriez voir l'interface de test avec les boutons "Tester Facture" et "Tester Reçu"

## Étape 3: Test Facture B2B

### Scénario: Facture pour une entreprise locale

1. **Cliquez sur "Tester Facture"**

2. **Sélectionnez "B2B - Entreprise"**
   - Vérifiez que l'info-bulle indique "NCC requis"

3. **Renseignez les informations générales:**
   - Type de document: Standard
   - Date d'échéance: (choisir une date future)
   - Mode de paiement: Virement

4. **Renseignez le client:**
   - Nom: "Entreprise Test SARL"
   - NCC: "CI-ABJ-2024-A-12345"
   - Adresse: "Abidjan, Cocody"

5. **Ajoutez des articles:**
   - Cliquez sur "Ajouter un article"
   - Sélectionnez un produit
   - Quantité: 2
   - Prix HT: 10000
   - TVA: 18%
   - Vérifiez que le total TTC s'affiche: 23 600 FCFA

6. **Ajoutez un deuxième article:**
   - Quantité: 1
   - Prix HT: 5000
   - Remise: 10%
   - TVA: 9%
   - Vérifiez le calcul automatique

7. **Vérifiez les totaux:**
   - Total HT doit être calculé
   - TVA 18% et TVA 9% doivent être séparées
   - Total TTC doit être correct

8. **Générez la facture:**
   - Cliquez sur "Générer la facture"
   - Attendez la confirmation
   - Vérifiez le message de succès

### Résultat attendu:
- ✅ Facture créée avec numéro: 2025-00001
- ✅ PDF généré dans `backend/uploads/invoices/{tenantId}/2025/`
- ✅ CSV généré dans le même dossier
- ✅ Données enregistrées dans la base

## Étape 4: Test Reçu B2C

### Scénario: Reçu pour un particulier avec paiement en espèces

1. **Cliquez sur "Tester Reçu"**

2. **Sélectionnez "B2C - Particulier"**
   - Vérifiez que l'info-bulle indique "Nom, téléphone, email requis"

3. **Renseignez les informations générales:**
   - Type de document: Standard
   - Mode de paiement: **Espèces** (important!)

4. **Renseignez le client:**
   - Nom: "Jean Kouassi"
   - Téléphone: "+225 01 02 03 04 05"
   - Email: "jean.kouassi@example.com"

5. **Ajoutez un article:**
   - Quantité: 1
   - Prix HT: 8000
   - TVA: 18%

6. **Vérifiez le timbre de quittance:**
   - Dans la section "Remises et taxes"
   - Vous devriez voir "Timbre de quittance: 100 FCFA"
   - ⚠️ Ajouté automatiquement car paiement en espèces

7. **Vérifiez les totaux:**
   - Total HT: 8 000 FCFA
   - TVA 18%: 1 440 FCFA
   - Timbre: 100 FCFA
   - **Total TTC: 9 540 FCFA**

8. **Générez le reçu:**
   - Cliquez sur "Générer le reçu"
   - Vérifiez la confirmation

### Résultat attendu:
- ✅ Reçu créé avec numéro: 2025-00002
- ✅ Timbre de quittance inclus automatiquement
- ✅ PDF et CSV générés

## Étape 5: Test Avoir (Crédit Note)

### Scénario: Avoir pour retour de marchandise

1. **Ouvrez le générateur de facture**

2. **Sélectionnez:**
   - Type de document: **Avoir (crédit)**
   - Type de facturation: B2B
   - Mode de paiement: Virement

3. **Renseignez le client et les articles**

4. **Générez l'avoir**

### Résultat attendu:
- ✅ Avoir créé avec numéro: **A-2025-00001**
- ✅ Préfixe "A-" ajouté automatiquement

## Étape 6: Test Proforma

### Scénario: Facture proforma pour devis

1. **Ouvrez le générateur de facture**

2. **Sélectionnez:**
   - Type de document: **Proforma**
   - Type de facturation: B2C

3. **Renseignez et générez**

### Résultat attendu:
- ✅ Proforma créée avec numéro: **P-2025-00001**
- ✅ Préfixe "P-" ajouté automatiquement

## Étape 7: Test des remises

### Scénario: Facture avec remises multiples

1. **Créez une facture B2C**

2. **Ajoutez 3 articles:**
   - Article 1: 10 000 FCFA, remise 5%
   - Article 2: 15 000 FCFA, remise 10%
   - Article 3: 20 000 FCFA, sans remise

3. **Ajoutez une remise globale de 5%**

4. **Vérifiez les calculs:**
   - Remises par article appliquées d'abord
   - Puis remise globale sur le sous-total
   - TVA calculée sur le montant après remises

### Résultat attendu:
- ✅ Calculs corrects à chaque étape
- ✅ Totaux mis à jour en temps réel

## Étape 8: Test de validation

### Scénario: Tester les validations

1. **Essayez de créer une facture B2B sans NCC:**
   - ❌ Devrait afficher une erreur
   - Message: "NCC requis pour facturation B2B"

2. **Essayez de créer une facture sans articles:**
   - ❌ Devrait afficher une erreur
   - Message: "Au moins un article requis"

3. **Essayez avec un NCC invalide:**
   - NCC: "INVALID"
   - ❌ Devrait afficher une erreur
   - Message: "Format NCC invalide"

4. **Essayez avec une quantité négative:**
   - ❌ Devrait afficher une erreur

### Résultat attendu:
- ✅ Toutes les validations fonctionnent
- ✅ Messages d'erreur clairs et précis

## Étape 9: Vérifier les fichiers générés

### Localisation des fichiers
```
backend/uploads/invoices/
  └── {tenantId}/
      └── 2025/
          ├── 2025-00001.pdf
          ├── 2025-00001.csv
          ├── 2025-00002.pdf
          ├── 2025-00002.csv
          ├── A-2025-00001.pdf
          ├── A-2025-00001.csv
          ├── P-2025-00001.pdf
          └── P-2025-00001.csv
```

### Vérifier le PDF
1. Ouvrez un fichier PDF généré
2. Vérifiez la présence de:
   - ✅ Logo entreprise (si configuré)
   - ✅ Informations entreprise
   - ✅ Type de document (FACTURE/REÇU/AVOIR/PROFORMA)
   - ✅ Numéro de document
   - ✅ Informations client
   - ✅ Tableau des articles
   - ✅ Détail TVA par taux
   - ✅ Total TTC en gras
   - ❌ PAS de logo FNE
   - ❌ PAS de QR code FNE
   - ❌ PAS de placeholders FNE

### Vérifier le CSV
1. Ouvrez un fichier CSV dans Excel/LibreOffice
2. Vérifiez la structure:
   - ✅ Section informations document
   - ✅ Section informations client
   - ✅ Section articles
   - ✅ Section totaux
   - ✅ Format compatible tableur

## Étape 10: Vérifier la base de données

```sql
-- Vérifier les factures créées
SELECT 
  invoice_number,
  document_type,
  invoice_type,
  document_subtype,
  total_ttc
FROM invoices
ORDER BY created_at DESC
LIMIT 10;

-- Vérifier les articles
SELECT 
  i.invoice_number,
  ii.product_name,
  ii.quantity,
  ii.unit_price_ht,
  ii.tva_rate,
  ii.total_ttc
FROM invoice_items ii
JOIN invoices i ON i.id = ii.invoice_id
ORDER BY i.created_at DESC;

-- Vérifier les séquences
SELECT * FROM invoice_sequences;

-- Vérifier les taxes additionnelles
SELECT 
  i.invoice_number,
  it.tax_name,
  it.tax_amount
FROM invoice_taxes it
JOIN invoices i ON i.id = it.invoice_id;
```

## Checklist finale

### Backend
- [ ] Migration SQL exécutée avec succès
- [ ] Backend démarré sans erreurs
- [ ] Endpoints API accessibles
- [ ] Fichiers PDF générés correctement
- [ ] Fichiers CSV générés correctement

### Frontend
- [ ] Formulaire s'affiche correctement
- [ ] Tous les types de facturation fonctionnent
- [ ] Calculs en temps réel corrects
- [ ] Validations fonctionnent
- [ ] Messages d'erreur clairs
- [ ] Génération réussie

### Fonctionnalités
- [ ] Facture B2B avec NCC
- [ ] Reçu B2C avec téléphone/email
- [ ] Timbre de quittance automatique (espèces)
- [ ] Remises par article
- [ ] Remise globale
- [ ] TVA 0%, 9%, 18%
- [ ] Avoirs (préfixe A-)
- [ ] Proformas (préfixe P-)
- [ ] Numérotation séquentielle

### Qualité
- [ ] Interface responsive
- [ ] Pas d'erreurs console
- [ ] Performance acceptable
- [ ] UX intuitive

## Problèmes courants

### "Cannot connect to backend"
- Vérifiez que le backend est démarré
- Vérifiez l'URL dans `VITE_API_URL`

### "Table does not exist"
- Exécutez la migration SQL
- Vérifiez la connexion à la base

### "Validation errors"
- Vérifiez les champs requis selon le type
- B2B: NCC requis
- B2C/B2F/B2G: Nom, téléphone, email requis

### "PDF generation failed"
- Vérifiez que le dossier `uploads/invoices` existe
- Vérifiez les permissions d'écriture

## Support

En cas de problème:
1. Consultez les logs backend dans la console
2. Consultez les logs frontend dans la console navigateur
3. Vérifiez `backend/INVOICE-SYSTEM-README.md`
4. Vérifiez `IMPLEMENTATION-PROGRESS-2026-02-11.md`

## Prochaines étapes

Après les tests réussis:
1. Intégrer dans le menu principal
2. Ajouter la page historique des factures
3. Implémenter la prévisualisation
4. Ajouter les fonctionnalités avancées (conversion proforma, etc.)

---

**Bon test! 🚀**
