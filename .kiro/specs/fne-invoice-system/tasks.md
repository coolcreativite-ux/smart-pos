# Plan d'Implémentation: Système de Facturation FNE

## Vue d'ensemble

Ce plan d'implémentation transforme la conception du système de facturation FNE en tâches de développement séquentielles. Le système génère des factures et reçus professionnels PDF avec l'identité complète de l'entreprise, fonctionnant en parallèle avec le système de tickets thermiques existant.

## Approche d'implémentation

- Développement incrémental par phases
- Chaque tâche construit sur les précédentes
- Tests intégrés comme sous-tâches
- Checkpoints réguliers pour validation
- Tâches optionnelles marquées avec "*" pour MVP rapide

## Tâches

- [x] 1. Phase 1: Configuration de la base de données
  - [x] 1.1 Créer le script de migration pour les nouvelles tables
    - Créer le fichier de migration SQL dans `backend/migrations/`
    - Ajouter la colonne `ncc` et `address` à la table `customers`
    - Créer la table `invoices` avec tous les champs requis
    - Créer la table `invoice_items` avec relation vers `invoices`
    - Créer la table `invoice_sequences` pour la numérotation
    - Créer la table `invoice_taxes` pour les taxes additionnelles
    - Ajouter tous les index nécessaires pour performance
    - Ajouter les contraintes de clés étrangères et checks
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

  - [ ]* 1.2 Écrire les tests de migration
    - Tester que toutes les tables sont créées correctement
    - Tester les contraintes d'intégrité référentielle
    - Tester les index
    - _Requirements: 15.6_

  - [x] 1.3 Exécuter la migration sur l'environnement de développement
    - Appliquer la migration sur la base de données de dev
    - Vérifier que toutes les tables existent
    - Vérifier les permissions et accès
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_


- [ ] 2. Phase 2: Services Backend - Génération de numéros et calculs
  - [ ] 2.1 Implémenter InvoiceNumberService
    - Créer `backend/services/InvoiceNumberService.ts`
    - Implémenter `getNextNumber()` avec gestion des préfixes (standard, A-, P-)
    - Implémenter `incrementSequence()` avec gestion des transactions
    - Implémenter `initializeSequence()` pour nouvelles années
    - Gérer l'isolation multi-tenant dans toutes les méthodes
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 16.2_

  - [ ]* 2.2 Écrire les tests de propriété pour InvoiceNumberService
    - **Property 5: Sequential Number Format**
    - **Validates: Requirements 3.1**
    - **Property 6: Credit Note Number Format**
    - **Validates: Requirements 3.2, 13.2**
    - **Property 7: Proforma Number Format**
    - **Validates: Requirements 3.3, 14.2**
    - **Property 8: Year-Based Sequence Isolation**
    - **Validates: Requirements 3.4, 3.5**

  - [ ]* 2.3 Écrire les tests unitaires pour InvoiceNumberService
    - Tester la génération de numéros pour différentes années
    - Tester les préfixes A- et P-
    - Tester l'isolation multi-tenant
    - Tester les cas limites (première facture, changement d'année)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 2.4 Implémenter TaxCalculationService
    - Créer `backend/services/TaxCalculationService.ts`
    - Implémenter `calculateHT()` pour conversion TTC → HT
    - Implémenter `calculateTVA()` pour calcul de TVA
    - Implémenter `applyDiscount()` pour remises
    - Implémenter `calculateInvoiceTotals()` avec logique complète
    - Implémenter `calculateTVASummary()` pour groupement par taux
    - Implémenter `addTimbreIfCash()` pour timbre de quittance automatique
    - Arrondir tous les montants à 2 décimales
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.2, 6.4, 7.2, 7.3_

  - [ ]* 2.5 Écrire les tests de propriété pour TaxCalculationService
    - **Property 11: HT Calculation from TTC**
    - **Validates: Requirements 5.2**
    - **Property 12: Total HT Summation**
    - **Validates: Requirements 5.3**
    - **Property 13: TVA Grouping and Summation**
    - **Validates: Requirements 5.4**
    - **Property 14: Total TTC Calculation**
    - **Validates: Requirements 5.5**
    - **Property 15: Decimal Precision**
    - **Validates: Requirements 5.6**
    - **Property 16: Line Item Discount Application**
    - **Validates: Requirements 6.2**
    - **Property 17: Global Discount Application**
    - **Validates: Requirements 6.4**
    - **Property 19: Automatic Timbre for Cash**
    - **Validates: Requirements 7.2, 8.3**
    - **Property 20: No Timbre for Non-Cash**
    - **Validates: Requirements 7.3**

  - [ ]* 2.6 Écrire les tests unitaires pour TaxCalculationService
    - Tester les calculs avec différents taux de TVA (0%, 9%, 18%)
    - Tester les remises (par article et globale)
    - Tester le timbre de quittance (espèces vs autres modes)
    - Tester les cas limites (montants très petits, très grands)
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 6.2, 6.4, 7.2_

  - [ ] 2.7 Implémenter ValidationService
    - Créer `backend/services/ValidationService.ts`
    - Implémenter `validateInvoice()` avec validation complète
    - Implémenter validation spécifique par type (B2B, B2C, B2F, B2G)
    - Implémenter `validateNCC()` pour format NCC ivoirien
    - Implémenter `validateEmail()` et `validatePhone()`
    - Retourner des messages d'erreur détaillés par champ
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 19.1, 19.2, 19.3, 19.4, 19.5_

  - [ ]* 2.8 Écrire les tests de propriété pour ValidationService
    - **Property 2: B2B Validation**
    - **Validates: Requirements 2.2, 4.3**
    - **Property 3: Non-B2B Validation**
    - **Validates: Requirements 2.3, 2.4, 2.5, 4.4**
    - **Property 4: Required Fields Validation**
    - **Validates: Requirements 2.6, 19.2**
    - **Property 54: Minimum Line Items Validation**
    - **Validates: Requirements 19.1**
    - **Property 55: Line Item Validity Validation**
    - **Validates: Requirements 19.3**
    - **Property 56: TVA Rate Validation**
    - **Validates: Requirements 19.4**

  - [ ]* 2.9 Écrire les tests unitaires pour ValidationService
    - Tester validation B2B avec et sans NCC
    - Tester validation B2C/B2F/B2G avec champs manquants
    - Tester validation des articles (quantité, prix, TVA)
    - Tester validation des formats (NCC, email, téléphone)
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 19.1, 19.2, 19.3, 19.4_


- [ ] 3. Checkpoint 1 - Services de base
  - Vérifier que tous les tests passent
  - Vérifier que les services de calcul fonctionnent correctement
  - Demander à l'utilisateur si des questions se posent

- [ ] 4. Phase 3: Services Backend - Génération de documents
  - [ ] 4.1 Implémenter PDFGenerationService
    - Créer `backend/services/PDFGenerationService.ts`
    - Installer et configurer la bibliothèque PDF (jsPDF ou pdfkit)
    - Implémenter `generateInvoicePDF()` avec template professionnel
    - Créer le layout: header avec logo, infos entreprise, infos client
    - Créer la table des articles avec toutes les colonnes
    - Créer la section totaux avec détail TVA par taux
    - Ajouter footer avec message commercial
    - Implémenter `savePDF()` pour stockage dans structure de dossiers
    - Implémenter `getPDF()` pour récupération
    - Format A4 avec marges professionnelles
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10, 10.1, 10.2, 10.3_

  - [ ]* 4.2 Écrire les tests unitaires pour PDFGenerationService
    - Tester génération PDF avec données complètes
    - Tester inclusion de tous les éléments requis
    - Tester format A4 et marges
    - Tester absence d'éléments FNE
    - Tester stockage et récupération de fichiers
    - _Requirements: 9.1, 9.5, 9.6, 9.9, 9.10, 10.1, 10.2, 10.3_

  - [ ] 4.3 Implémenter CSVExportService
    - Créer `backend/services/CSVExportService.ts`
    - Implémenter `generateInvoiceCSV()` avec format structuré
    - Créer section header avec infos facture et client
    - Créer section articles (une ligne par article)
    - Créer section totaux avec détail TVA
    - Gérer l'échappement des caractères spéciaux
    - Implémenter `saveCSV()` pour stockage
    - Implémenter `getCSV()` pour récupération
    - _Requirements: 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

  - [ ]* 4.4 Écrire les tests de propriété pour CSVExportService
    - **Property 34: CSV Generation Completeness**
    - **Validates: Requirements 11.2**
    - **Property 35: CSV Column Structure**
    - **Validates: Requirements 11.3**
    - **Property 36: CSV Line Item Rows**
    - **Validates: Requirements 11.4**
    - **Property 37: CSV Summary Rows**
    - **Validates: Requirements 11.5**
    - **Property 38: CSV Format Validity**
    - **Validates: Requirements 11.6**

  - [ ]* 4.5 Écrire les tests unitaires pour CSVExportService
    - Tester génération CSV avec différents nombres d'articles
    - Tester format et structure des colonnes
    - Tester échappement des caractères spéciaux
    - Tester parsing par applications tableur
    - _Requirements: 11.2, 11.3, 11.4, 11.5, 11.6_


- [ ] 5. Phase 4: API Backend - Endpoints REST
  - [ ] 5.1 Créer les types TypeScript pour l'API
    - Créer `backend/types/invoice.types.ts`
    - Définir toutes les interfaces: Invoice, InvoiceItem, InvoiceTax, InvoiceSequence
    - Définir les types de requête/réponse pour chaque endpoint
    - Définir les types de validation et erreurs
    - _Requirements: Tous (types utilisés partout)_

  - [ ] 5.2 Implémenter POST /api/invoices
    - Créer `backend/routes/invoices.routes.ts`
    - Créer `backend/controllers/invoices.controller.ts`
    - Implémenter la création de facture/reçu
    - Valider les données avec ValidationService
    - Générer le numéro avec InvoiceNumberService
    - Calculer les totaux avec TaxCalculationService
    - Sauvegarder dans la base de données (transaction)
    - Générer PDF avec PDFGenerationService
    - Générer CSV avec CSVExportService
    - Retourner la réponse avec URLs des fichiers
    - Gérer les erreurs et rollback
    - _Requirements: 1.3, 1.4, 2.1, 3.1, 3.2, 3.3, 5.1-5.6, 10.1-10.3, 11.2-11.7_

  - [ ]* 5.3 Écrire les tests d'intégration pour POST /api/invoices
    - Tester création de facture B2B complète
    - Tester création de reçu B2C
    - Tester création d'avoir et proforma
    - Tester validation des erreurs
    - Tester génération des fichiers PDF et CSV
    - Tester isolation multi-tenant
    - _Requirements: 1.3, 1.4, 2.1, 3.1, 3.2, 3.3_

  - [ ] 5.4 Implémenter GET /api/invoices
    - Implémenter la liste des factures avec pagination
    - Implémenter les filtres: date, client, numéro, type, montant
    - Appliquer l'isolation multi-tenant
    - Optimiser les requêtes avec index
    - Retourner les métadonnées de pagination
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 16.1, 16.3_

  - [ ]* 5.5 Écrire les tests de propriété pour GET /api/invoices
    - **Property 40: Multi-Criteria Filtering**
    - **Validates: Requirements 12.3, 12.4**
    - **Property 47: Tenant Isolation in Operations**
    - **Validates: Requirements 16.1, 16.3, 16.4**

  - [ ]* 5.6 Écrire les tests d'intégration pour GET /api/invoices
    - Tester pagination
    - Tester chaque filtre individuellement
    - Tester combinaisons de filtres
    - Tester isolation multi-tenant
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 16.3_

  - [ ] 5.7 Implémenter GET /api/invoices/:id
    - Implémenter la récupération des détails complets
    - Inclure les articles, taxes, infos client
    - Vérifier l'isolation multi-tenant
    - Gérer les erreurs 404 et 403
    - _Requirements: 12.5, 16.1, 16.3_

  - [ ] 5.8 Implémenter GET /api/invoices/:id/pdf
    - Récupérer le chemin du PDF depuis la base
    - Lire le fichier PDF
    - Retourner avec headers appropriés (Content-Type, Content-Disposition)
    - Gérer les erreurs de fichier manquant
    - _Requirements: 10.4, 20.4_

  - [ ] 5.9 Implémenter GET /api/invoices/:id/csv
    - Récupérer le chemin du CSV depuis la base
    - Lire le fichier CSV
    - Retourner avec headers appropriés
    - Gérer les erreurs de fichier manquant
    - _Requirements: 11.7, 20.4_

  - [ ] 5.10 Implémenter GET /api/invoices/next-number
    - Récupérer le prochain numéro disponible
    - Gérer les différents sous-types (standard, avoir, proforma)
    - Appliquer l'isolation multi-tenant
    - _Requirements: 3.1, 3.2, 3.3, 16.2_

  - [ ] 5.11 Ajouter l'authentification et autorisation
    - Vérifier le JWT sur tous les endpoints
    - Vérifier les permissions par rôle
    - Implémenter les middlewares d'authentification
    - Logger les accès pour audit
    - _Requirements: 16.1, 16.3, 16.4_

  - [ ]* 5.12 Écrire les tests de sécurité pour l'API
    - Tester accès sans authentification (doit échouer)
    - Tester accès aux données d'un autre tenant (doit échouer)
    - Tester permissions par rôle
    - _Requirements: 16.1, 16.3, 16.4_


- [ ] 6. Checkpoint 2 - API Backend
  - Vérifier que tous les endpoints fonctionnent
  - Tester les endpoints avec Postman ou curl
  - Vérifier l'isolation multi-tenant
  - Vérifier la génération des fichiers PDF et CSV
  - Demander à l'utilisateur si des questions se posent

- [ ] 7. Phase 5: Frontend - Composants de base
  - [ ] 7.1 Créer les types TypeScript frontend
    - Créer `frontend/types/invoice.types.ts`
    - Définir les interfaces pour les formulaires
    - Définir les types de réponse API
    - Définir les types d'état des composants
    - _Requirements: Tous (types utilisés partout)_

  - [ ] 7.2 Créer InvoiceContext pour la gestion d'état
    - Créer `frontend/contexts/InvoiceContext.tsx`
    - Implémenter le state management pour les factures
    - Fournir les fonctions: createInvoice, fetchInvoices, fetchInvoiceDetails
    - Gérer le cache des données
    - Gérer les états de chargement et erreurs
    - _Requirements: 1.3, 1.4, 12.1_

  - [ ] 7.3 Créer InvoiceTypeSelector component
    - Créer `frontend/components/invoices/InvoiceTypeSelector.tsx`
    - Afficher 4 cartes pour B2B, B2C, B2F, B2G
    - Ajouter descriptions pour chaque type
    - Gérer la sélection et le changement de type
    - Styling professionnel et responsive
    - _Requirements: 2.1_

  - [ ]* 7.4 Écrire les tests unitaires pour InvoiceTypeSelector
    - Tester le rendu des 4 options
    - Tester la sélection d'un type
    - Tester le changement de type
    - _Requirements: 2.1_

  - [ ] 7.5 Créer InvoiceItemRow component
    - Créer `frontend/components/invoices/InvoiceItemRow.tsx`
    - Afficher les champs: produit, quantité, prix HT, remise, TVA
    - Calculer et afficher les totaux de ligne en temps réel
    - Permettre la modification et suppression
    - Validation des champs
    - _Requirements: 6.1, 6.2, 9.5, 21.2, 21.3_

  - [ ] 7.6 Créer InvoiceTotalsDisplay component
    - Créer `frontend/components/invoices/InvoiceTotalsDisplay.tsx`
    - Afficher: Total HT, Remises, TVA par taux, Autres taxes, Total TTC
    - Mise à jour en temps réel lors des changements
    - Styling professionnel avec mise en évidence du Total TTC
    - _Requirements: 5.3, 5.4, 5.5, 9.6, 21.2, 21.3_

  - [ ] 7.7 Créer CustomerSelector component
    - Créer `frontend/components/invoices/CustomerSelector.tsx`
    - Recherche et sélection de client existant
    - Affichage des infos client (nom, NCC, téléphone, email)
    - Option pour créer un nouveau client
    - Auto-complétion depuis la base de données
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 21.4_

  - [ ]* 7.8 Écrire les tests unitaires pour les composants de base
    - Tester InvoiceItemRow avec différentes valeurs
    - Tester InvoiceTotalsDisplay avec différents totaux
    - Tester CustomerSelector avec recherche
    - _Requirements: 6.1, 9.5, 9.6, 21.2, 21.3_


- [ ] 8. Phase 6: Frontend - Formulaire de génération
  - [ ] 8.1 Créer InvoiceGenerator component (partie 1: structure)
    - Créer `frontend/components/invoices/InvoiceGenerator.tsx`
    - Implémenter la structure du formulaire
    - Ajouter InvoiceTypeSelector en haut
    - Ajouter section informations générales (date, échéance, paiement)
    - Ajouter CustomerSelector
    - Gérer l'état du formulaire avec useState
    - _Requirements: 1.3, 1.4, 2.1, 8.1_

  - [ ] 8.2 Créer InvoiceGenerator component (partie 2: articles)
    - Ajouter la section articles avec InvoiceItemRow
    - Implémenter l'ajout d'articles
    - Implémenter la suppression d'articles
    - Implémenter la modification d'articles
    - Intégrer ProductSelector pour auto-complétion
    - _Requirements: 6.1, 9.5, 21.5_

  - [ ] 8.3 Créer InvoiceGenerator component (partie 3: remises et taxes)
    - Ajouter le champ remise globale
    - Ajouter la section taxes additionnelles
    - Permettre l'ajout/suppression de taxes personnalisées
    - Gérer le timbre de quittance automatique pour espèces
    - _Requirements: 6.3, 6.4, 7.1, 7.2, 7.3_

  - [ ] 8.4 Créer InvoiceGenerator component (partie 4: totaux et validation)
    - Intégrer InvoiceTotalsDisplay
    - Implémenter la validation en temps réel
    - Afficher les messages d'erreur par champ
    - Calculer les totaux en temps réel avec useMemo
    - Debounce les recalculs (300ms)
    - _Requirements: 5.1-5.6, 19.1-19.6, 21.2, 21.3, 21.6_

  - [ ] 8.5 Créer InvoiceGenerator component (partie 5: soumission)
    - Ajouter les boutons: Prévisualiser, Annuler
    - Implémenter la validation finale avant prévisualisation
    - Gérer les états de chargement
    - Afficher les erreurs de validation
    - Gérer la navigation vers prévisualisation
    - _Requirements: 17.1, 19.5, 19.6, 21.7_

  - [ ]* 8.6 Écrire les tests de propriété pour InvoiceGenerator
    - **Property 63: Real-Time Total Updates**
    - **Validates: Requirements 21.2, 21.3**
    - **Property 64: Auto-Population from Database**
    - **Validates: Requirements 21.4, 21.5**

  - [ ]* 8.7 Écrire les tests unitaires pour InvoiceGenerator
    - Tester l'ajout/suppression d'articles
    - Tester la validation des champs
    - Tester le calcul des totaux
    - Tester l'auto-complétion client et produit
    - Tester le timbre de quittance automatique
    - _Requirements: 6.1, 7.2, 19.1-19.6, 21.2-21.5_


- [x] 9. Phase 7: Frontend - Prévisualisation et génération
  - [x] 9.1 Créer InvoicePreview component (partie 1: layout)
    - Créer `frontend/components/invoices/InvoicePreview.tsx`
    - Créer le layout professionnel A4/A5
    - Implémenter la section header avec logo et infos entreprise
    - Afficher le type de document (FACTURE/REÇU/AVOIR/PROFORMA)
    - Afficher le numéro de document
    - _Requirements: 9.1, 9.2, 9.9, 13.4, 14.3, 17.2, 18.1, 18.2, 18.3_

  - [x] 9.2 Créer InvoicePreview component (partie 2: contenu)
    - Implémenter la section dates et paiement
    - Implémenter la section informations client
    - Implémenter la table des articles
    - Implémenter la section totaux avec détail TVA
    - Ajouter le footer avec message commercial
    - _Requirements: 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

  - [x] 9.3 Créer InvoicePreview component (partie 3: actions)
    - Ajouter les boutons: Retour (éditer), Confirmer et générer
    - Implémenter le retour en mode édition
    - Implémenter la confirmation et appel API
    - Gérer les états de chargement pendant génération
    - Afficher succès et proposer téléchargement
    - _Requirements: 17.3, 17.4, 17.5_

  - [ ]* 9.4 Écrire les tests de propriété pour InvoicePreview
    - **Property 23: Company Header Inclusion**
    - **Validates: Requirements 9.1, 18.1, 18.2, 18.3**
    - **Property 26: Line Items Table Structure**
    - **Validates: Requirements 9.5**
    - **Property 27: Totals Section Completeness**
    - **Validates: Requirements 9.6**
    - **Property 31: No FNE Elements**
    - **Validates: Requirements 9.10**
    - **Property 49: Preview Without Persistence**
    - **Validates: Requirements 17.2**

  - [ ]* 9.5 Écrire les tests unitaires pour InvoicePreview
    - Tester le rendu avec données complètes
    - Tester l'affichage de tous les éléments requis
    - Tester l'absence d'éléments FNE
    - Tester le retour en édition
    - Tester la génération finale
    - _Requirements: 9.1-9.10, 17.2-17.5_


- [ ] 10. Checkpoint 3 - Génération de factures
  - Tester le workflow complet: formulaire → prévisualisation → génération
  - Vérifier que les PDF et CSV sont générés correctement
  - Vérifier que tous les calculs sont corrects
  - Vérifier l'affichage professionnel
  - Demander à l'utilisateur si des questions se posent

- [x] 11. Phase 8: Frontend - Historique et recherche
  - [x] 11.1 Créer InvoiceHistory component (partie 1: liste)
    - Créer `frontend/components/invoices/InvoiceHistory.tsx`
    - Implémenter la liste des factures avec pagination
    - Afficher: numéro, date, client, type, montant, statut
    - Implémenter le tri par colonne
    - Gérer le chargement et les erreurs
    - _Requirements: 12.1, 12.2_

  - [x] 11.2 Créer InvoiceHistory component (partie 2: filtres)
    - Ajouter les filtres: plage de dates, client, numéro, type, montant
    - Implémenter l'application des filtres
    - Implémenter la réinitialisation des filtres
    - Afficher le nombre de résultats
    - _Requirements: 12.3, 12.4_

  - [x] 11.3 Créer InvoiceHistory component (partie 3: actions)
    - Ajouter les actions par ligne: Voir détails, Télécharger PDF, Télécharger CSV
    - Implémenter la vue détails (modal ou page)
    - Implémenter le téléchargement PDF
    - Implémenter le téléchargement CSV
    - Implémenter l'impression PDF
    - _Requirements: 10.4, 10.5, 11.7, 12.5_

  - [ ]* 11.4 Écrire les tests de propriété pour InvoiceHistory
    - **Property 39: Invoice History Display Fields**
    - **Validates: Requirements 12.2**
    - **Property 40: Multi-Criteria Filtering**
    - **Validates: Requirements 12.3, 12.4**

  - [ ]* 11.5 Écrire les tests unitaires pour InvoiceHistory
    - Tester l'affichage de la liste
    - Tester la pagination
    - Tester chaque filtre
    - Tester les combinaisons de filtres
    - Tester les téléchargements
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 11.6 Créer InvoiceDetailsModal component
    - Créer `frontend/components/invoices/InvoiceDetailsModal.tsx`
    - Afficher tous les détails de la facture
    - Afficher les articles, totaux, infos client
    - Ajouter les boutons de téléchargement et impression
    - Styling professionnel
    - _Requirements: 12.5_


- [x] 12. Phase 9: Intégration avec SalesCart
  - [x] 12.1 Modifier SalesCart component
    - Ouvrir `frontend/components/sales/SalesCart.tsx`
    - Ajouter 3 boutons après finalisation de vente: "Imprimer Ticket", "Générer Facture", "Générer Reçu"
    - Implémenter l'ouverture de InvoiceGenerator avec données de vente pré-remplies
    - Passer le type de document (invoice/receipt) au générateur
    - Conserver le système de tickets thermiques inchangé
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 12.2 Écrire les tests de propriété pour l'intégration
    - **Property 1: Workflow Isolation**
    - **Validates: Requirements 1.2, 1.5**

  - [ ]* 12.3 Écrire les tests d'intégration pour SalesCart
    - Tester que le système de tickets fonctionne toujours
    - Tester l'ouverture du générateur de factures
    - Tester l'ouverture du générateur de reçus
    - Tester le pré-remplissage des données
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 12.4 Ajouter la navigation vers l'historique
    - Ajouter un lien/bouton dans le menu principal vers InvoiceHistory
    - Implémenter le routing pour la page historique
    - Ajouter les permissions d'accès par rôle
    - _Requirements: 12.1_

  - [x] 12.5 Créer la page Invoices
    - Créer `frontend/pages/Invoices.tsx`
    - Intégrer InvoiceHistory component
    - Ajouter un bouton "Nouvelle facture" pour création manuelle
    - Gérer le routing et la navigation
    - _Requirements: 12.1_


- [x] 13. Checkpoint 4 - Intégration complète
  - Tester le workflow complet depuis SalesCart
  - Vérifier que les tickets thermiques fonctionnent toujours
  - Vérifier la génération de factures et reçus depuis une vente
  - Vérifier l'historique et la recherche
  - Vérifier les téléchargements PDF et CSV
  - Demander à l'utilisateur si des questions se posent
  - Demander à l'utilisateur si des questions se posent

- [x] 14. Phase 10: Gestion des informations entreprise
  - [x] 14.1 Modifier le profil entreprise pour ajouter NCC
    - Ouvrir le composant de gestion du profil entreprise
    - Ajouter le champ NCC avec validation
    - Ajouter le champ adresse complète
    - Sauvegarder dans la base de données
    - _Requirements: 18.1, 18.2_

  - [x] 14.2 Implémenter la validation des infos entreprise
    - Vérifier que les infos entreprise sont complètes avant génération
    - Afficher un avertissement si des champs manquent
    - Permettre quand même la génération (avec avertissement)
    - _Requirements: 18.4_

  - [ ]* 14.3 Écrire les tests de propriété pour les infos entreprise
    - **Property 51: Company Information Retrieval**
    - **Validates: Requirements 18.1, 18.2**
    - **Property 52: Company Information Warning**
    - **Validates: Requirements 18.4**
    - **Property 53: Company Information Consistency**
    - **Validates: Requirements 18.5**

  - [ ]* 14.4 Écrire les tests unitaires pour les infos entreprise
    - Tester la récupération des infos
    - Tester l'affichage de l'avertissement
    - Tester la cohérence sur plusieurs factures
    - _Requirements: 18.1, 18.2, 18.4, 18.5_


- [ ] 15. Phase 11: Fonctionnalités avancées
  - [ ] 15.1 Implémenter la conversion proforma → facture standard
    - Ajouter un bouton "Convertir en facture" sur les proformas
    - Créer une nouvelle facture standard avec nouveau numéro
    - Copier tous les articles et informations
    - Marquer la relation entre proforma et facture
    - _Requirements: 14.4_

  - [ ] 15.2 Implémenter la création d'avoirs
    - Ajouter un bouton "Créer avoir" sur les factures
    - Pré-remplir le formulaire avec les données de la facture originale
    - Permettre la modification des quantités/montants
    - Générer avec préfixe A-
    - Enregistrer la référence à la facture originale
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [ ]* 15.3 Écrire les tests de propriété pour les fonctionnalités avancées
    - **Property 41: Credit Note Label Display**
    - **Validates: Requirements 13.4**
    - **Property 42: Credit Note Storage Identification**
    - **Validates: Requirements 13.5**
    - **Property 43: Proforma Label Display**
    - **Validates: Requirements 14.3**
    - **Property 44: Proforma Conversion**
    - **Validates: Requirements 14.4**
    - **Property 45: Proforma Storage Identification**
    - **Validates: Requirements 14.5**

  - [ ]* 15.4 Écrire les tests unitaires pour les fonctionnalités avancées
    - Tester la conversion proforma → facture
    - Tester la création d'avoirs
    - Tester les préfixes A- et P-
    - Tester les références entre documents
    - _Requirements: 13.1-13.5, 14.3-14.5_

  - [ ] 15.5 Implémenter l'archivage des factures
    - Créer le système de stockage structuré par tenant/année
    - Implémenter la logique d'archivage lors de suppression de tenant
    - Créer les scripts de maintenance pour archivage automatique
    - _Requirements: 20.1, 20.2, 20.5, 20.6_

  - [ ]* 15.6 Écrire les tests de propriété pour l'archivage
    - **Property 59: File Storage Structure**
    - **Validates: Requirements 20.1, 20.2**
    - **Property 61: File Retrieval Round-Trip**
    - **Validates: Requirements 20.4**
    - **Property 62: Tenant Deletion Archival**
    - **Validates: Requirements 20.6**


- [ ] 16. Checkpoint 5 - Fonctionnalités complètes
  - Tester la conversion proforma → facture
  - Tester la création d'avoirs
  - Tester l'archivage des fichiers
  - Vérifier la structure de stockage
  - Demander à l'utilisateur si des questions se posent

- [ ] 17. Phase 12: Tests end-to-end et validation
  - [ ]* 17.1 Écrire les tests E2E pour le workflow complet
    - Tester: Vente → Génération facture → Téléchargement PDF
    - Tester: Vente → Génération reçu → Téléchargement CSV
    - Tester: Création facture manuelle → Prévisualisation → Génération
    - Tester: Recherche dans historique → Téléchargement
    - Tester: Création proforma → Conversion en facture
    - Tester: Création facture → Création avoir
    - _Requirements: Tous (workflow complet)_

  - [ ]* 17.2 Écrire les tests de propriété restants
    - Implémenter tous les tests de propriété non encore écrits
    - Vérifier que chaque propriété du design a un test correspondant
    - Configurer fast-check avec 100 itérations minimum
    - Ajouter les tags de référence aux propriétés
    - _Requirements: Tous (couverture complète des propriétés)_

  - [ ]* 17.3 Écrire les tests de performance
    - Tester génération de 100 factures simultanées
    - Tester recherche dans historique avec 10000+ factures
    - Tester génération PDF avec factures de 100+ articles
    - Mesurer les temps de réponse
    - _Requirements: Performance_

  - [ ]* 17.4 Écrire les tests de sécurité
    - Tester l'isolation multi-tenant complète
    - Tester les permissions par rôle
    - Tester la protection contre les injections SQL
    - Tester la validation des entrées
    - _Requirements: 16.1, 16.2, 16.3, 16.4_

  - [ ]* 17.5 Vérifier la couverture de code
    - Exécuter les outils de couverture de code
    - Vérifier minimum 80% backend, 70% frontend
    - Identifier et tester les branches non couvertes
    - _Requirements: Tous_


- [ ] 18. Phase 13: Documentation et déploiement
  - [ ] 18.1 Créer la documentation utilisateur
    - Rédiger le guide d'utilisation en français
    - Documenter le workflow de création de factures
    - Documenter les différents types de facturation (B2B, B2C, B2F, B2G)
    - Documenter la recherche et l'historique
    - Ajouter des captures d'écran
    - Expliquer les avoirs et proformas
    - _Requirements: Documentation_

  - [ ] 18.2 Créer la documentation technique
    - Documenter l'architecture du système
    - Documenter les API endpoints avec exemples
    - Documenter le schéma de base de données
    - Documenter les services backend
    - Documenter les composants frontend
    - Ajouter des diagrammes d'architecture
    - _Requirements: Documentation_

  - [ ] 18.3 Créer les scripts de déploiement
    - Créer le script de migration de base de données
    - Créer le script de création des dossiers de stockage
    - Créer le script de configuration des permissions
    - Documenter la procédure de déploiement
    - _Requirements: Déploiement_

  - [ ] 18.4 Préparer l'environnement de production
    - Configurer les variables d'environnement
    - Configurer le stockage des fichiers (local ou cloud)
    - Configurer les backups automatiques
    - Configurer le monitoring et les logs
    - _Requirements: Déploiement_

  - [ ] 18.5 Exécuter la migration en production
    - Créer un backup complet de la base de données
    - Exécuter les migrations SQL
    - Vérifier l'intégrité des données
    - Créer les dossiers de stockage
    - Tester les endpoints en production
    - _Requirements: Déploiement_

  - [ ] 18.6 Former les utilisateurs
    - Organiser une session de formation
    - Présenter les nouvelles fonctionnalités
    - Démontrer le workflow complet
    - Répondre aux questions
    - Distribuer la documentation
    - _Requirements: Formation_


- [ ] 19. Checkpoint final - Validation complète
  - Vérifier que tous les tests passent (unitaires, propriétés, intégration, E2E)
  - Vérifier que la documentation est complète
  - Vérifier que le système fonctionne en production
  - Tester avec des utilisateurs réels
  - Collecter les retours et ajuster si nécessaire
  - Demander à l'utilisateur si des questions se posent

## Notes importantes

### Tâches optionnelles (marquées avec *)
Les tâches marquées avec "*" sont optionnelles et peuvent être sautées pour un MVP plus rapide. Elles incluent principalement:
- Tests de propriété (property-based tests)
- Tests unitaires détaillés
- Tests de performance
- Tests de sécurité avancés
- Documentation extensive

### Ordre d'exécution
Les tâches doivent être exécutées dans l'ordre séquentiel pour garantir que chaque phase construit sur les précédentes. Les checkpoints permettent de valider le travail avant de continuer.

### Références aux exigences
Chaque tâche référence les exigences spécifiques qu'elle implémente (format: _Requirements: X.Y_). Cela permet de tracer chaque fonctionnalité jusqu'aux exigences d'origine.

### Tests basés sur propriétés
Les tests de propriété utilisent fast-check avec minimum 100 itérations. Chaque test doit inclure un commentaire référençant la propriété du document de design:
```typescript
// Feature: fne-invoice-system, Property {number}: {property_text}
```

### Isolation multi-tenant
L'isolation multi-tenant est critique et doit être testée à chaque niveau:
- Base de données (Row-Level Security)
- API (filtrage par tenant_id)
- Frontend (contexte utilisateur)
- Fichiers (structure de dossiers par tenant)

### Performance
Les objectifs de performance sont:
- Génération de facture simple: < 2 secondes
- Génération de facture complexe (50+ articles): < 5 secondes
- Recherche dans historique: < 1 seconde
- Téléchargement PDF: < 3 secondes

### Sécurité
Tous les endpoints API doivent:
- Vérifier l'authentification JWT
- Vérifier les permissions par rôle
- Appliquer l'isolation multi-tenant
- Valider toutes les entrées
- Logger les actions sensibles

## Dépendances techniques

### Backend
- Node.js + Express + TypeScript
- PostgreSQL (via Supabase)
- jsPDF ou pdfkit (génération PDF)
- fast-check (property-based testing)
- Jest (tests unitaires)

### Frontend
- React + TypeScript
- React Context (state management)
- Axios (API calls)
- React Testing Library (tests)
- fast-check (property-based testing)

### Infrastructure
- Supabase (base de données PostgreSQL)
- Stockage fichiers (local ou cloud S3)
- Système de backup automatique
- Monitoring et logs
