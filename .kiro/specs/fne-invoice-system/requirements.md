# Requirements Document - Système de Facturation FNE

## Introduction

Ce document définit les exigences pour l'ajout d'un système de facturation professionnelle dans l'application Smart POS. Le système génère des **factures et reçus PDF professionnels** avec l'identité de l'entreprise, contenant toutes les informations commerciales et fiscales nécessaires. Ces documents servent à la fois de factures commerciales pour les clients et de référence pour que le gérant puisse saisir les informations sur la plateforme FNE officielle (https://fne.dgi.gouv.ci/) si nécessaire. Le système préserve également le système existant de tickets thermiques pour les petits commerces.

## Glossary

- **FNE**: Facture Normalisée Électronique - système de facturation électronique obligatoire en Côte d'Ivoire
- **RNE**: Reçu Normalisé Électronique - reçu détaillé conforme aux normes FNE
- **DGI**: Direction Générale des Impôts de Côte d'Ivoire
- **NCC**: Numéro de Compte Contribuable - identifiant fiscal unique des entreprises
- **Smart_POS**: Le système de point de vente existant
- **Invoice_Generator**: Le nouveau module de génération de factures et reçus FNE
- **Thermal_Ticket_System**: Le système actuel d'impression de tickets thermiques
- **Tenant**: Une instance d'entreprise utilisant Smart POS (multi-tenant)
- **Professional_Invoice**: Facture PDF professionnelle générée par Smart POS avec l'identité de l'entreprise
- **Professional_Receipt**: Reçu PDF professionnel généré par Smart POS avec l'identité de l'entreprise
- **B2B**: Business to Business - facturation entre entreprises locales
- **B2C**: Business to Consumer - facturation aux particuliers
- **B2F**: Business to Foreign - facturation internationale
- **B2G**: Business to Government - facturation aux administrations
- **HT**: Hors Taxes
- **TTC**: Toutes Taxes Comprises
- **TVA**: Taxe sur la Valeur Ajoutée

## Requirements

### Requirement 1: Dual Invoice System

**User Story:** En tant que gérant de commerce, je veux pouvoir choisir entre un ticket thermique rapide, une facture professionnelle, et un reçu professionnel, afin de m'adapter aux besoins de chaque transaction sans perturber mon flux de travail actuel.

#### Acceptance Criteria

1. WHEN a sale is completed, THE Smart_POS SHALL provide options: "Print Ticket", "Generate Invoice", and "Generate Receipt"
2. WHEN "Print Ticket" is selected, THE Thermal_Ticket_System SHALL function exactly as before without any modification
3. WHEN "Generate Invoice" is selected, THE Invoice_Generator SHALL open a detailed invoice creation form
4. WHEN "Generate Receipt" is selected, THE Invoice_Generator SHALL open a detailed receipt creation form with the same structure as invoices
5. THE Smart_POS SHALL maintain separate workflows for thermal tickets, professional invoices, and professional receipts without interference

### Requirement 2: Invoice Type Selection

**User Story:** En tant qu'utilisateur, je veux sélectionner le type de facturation (B2B, B2C, B2F, B2G), afin de générer une facture avec les informations appropriées selon le type de client.

#### Acceptance Criteria

1. WHEN creating an invoice, THE Invoice_Generator SHALL display four invoice type options: B2B, B2C, B2F, B2G
2. WHEN B2B is selected, THE Invoice_Generator SHALL require NCC field for the customer
3. WHEN B2C is selected, THE Invoice_Generator SHALL require customer name, phone, and email fields
4. WHEN B2F is selected, THE Invoice_Generator SHALL require customer name, phone, and email fields
5. WHEN B2G is selected, THE Invoice_Generator SHALL require specific government entity information fields
6. THE Invoice_Generator SHALL validate that required fields for the selected type are completed before allowing invoice generation

### Requirement 3: Sequential Invoice Numbering

**User Story:** En tant que système comptable, je veux générer des numéros de facture séquentiels uniques par tenant et par année, afin de faciliter la traçabilité et la comptabilité.

#### Acceptance Criteria

1. WHEN a new document is created, THE Invoice_Generator SHALL generate a sequential invoice number in format: Year + "-" + Sequential (e.g., 2025-00001)
2. WHEN the document type is credit note (avoir), THE Invoice_Generator SHALL use prefix "A-" (e.g., A-2025-00001)
3. WHEN the document type is proforma, THE Invoice_Generator SHALL use prefix "P-" (e.g., P-2025-00001)
4. FOR ALL documents within a tenant, THE Invoice_Generator SHALL maintain separate sequential counters per year
5. WHEN a new year begins, THE Invoice_Generator SHALL reset the sequential counter to 1 for that tenant
6. THE Invoice_Generator SHALL display the invoice number prominently on the document

### Requirement 4: Customer Information Management

**User Story:** En tant qu'utilisateur, je veux enregistrer et gérer les informations fiscales des clients (NCC, coordonnées), afin de générer rapidement des factures conformes.

#### Acceptance Criteria

1. WHEN creating or editing a customer, THE Smart_POS SHALL provide an optional NCC field
2. WHEN creating or editing a customer, THE Smart_POS SHALL provide fields for name, phone, and email
3. WHEN selecting a customer for B2B invoice, THE Invoice_Generator SHALL validate that the customer has a valid NCC
4. WHEN selecting a customer for B2C/B2F/B2G invoice, THE Invoice_Generator SHALL validate that the customer has name, phone, and email
5. THE Smart_POS SHALL store customer NCC and contact information in the database

### Requirement 5: Ivorian Tax Calculation

**User Story:** En tant que système de facturation, je veux calculer automatiquement les taxes selon les taux ivoiriens (0%, 9%, 18%), afin de garantir la conformité fiscale et réduire les erreurs de calcul.

#### Acceptance Criteria

1. WHEN adding a product to an invoice, THE Invoice_Generator SHALL allow selection of TVA rate: 0% (exonéré), 9% (réduit), or 18% (normal)
2. WHEN a TVA rate is selected, THE Invoice_Generator SHALL calculate the HT amount from the TTC price
3. WHEN calculating invoice totals, THE Invoice_Generator SHALL sum all HT amounts to produce Total HT
4. WHEN calculating invoice totals, THE Invoice_Generator SHALL sum all TVA amounts grouped by rate to produce Total TVA
5. WHEN calculating invoice totals, THE Invoice_Generator SHALL compute Total TTC as Total HT + Total TVA + Other Taxes
6. FOR ALL tax calculations, THE Invoice_Generator SHALL round amounts to 2 decimal places

### Requirement 6: Discount Management

**User Story:** En tant qu'utilisateur, je veux appliquer des remises par article et une remise globale, afin de gérer les promotions et négociations commerciales.

#### Acceptance Criteria

1. WHEN adding a product to an invoice, THE Invoice_Generator SHALL allow entry of a discount percentage for that line item
2. WHEN a line item discount is applied, THE Invoice_Generator SHALL calculate the discounted HT amount before TVA calculation
3. WHEN all line items are entered, THE Invoice_Generator SHALL allow entry of a global discount percentage
4. WHEN a global discount is applied, THE Invoice_Generator SHALL apply it to the subtotal before final tax calculations
5. WHEN calculating totals, THE Invoice_Generator SHALL display the total discount amount separately

### Requirement 7: Additional Taxes and Fees

**User Story:** En tant qu'utilisateur, je veux ajouter d'autres taxes et le timbre de quittance, afin de respecter toutes les obligations fiscales ivoiriennes.

#### Acceptance Criteria

1. WHEN creating an invoice, THE Invoice_Generator SHALL allow addition of other taxes with custom names and amounts
2. WHEN payment method is "Espèces" (cash), THE Invoice_Generator SHALL automatically add a "Timbre de quittance" fee
3. WHEN payment method is not cash, THE Invoice_Generator SHALL not include timbre de quittance
4. WHEN calculating Total TTC, THE Invoice_Generator SHALL include all additional taxes and fees

### Requirement 8: Payment Method Selection

**User Story:** En tant qu'utilisateur, je veux sélectionner le mode de paiement, afin de documenter correctement la transaction sur la facture.

#### Acceptance Criteria

1. WHEN creating an invoice, THE Invoice_Generator SHALL provide payment method options: Carte bancaire, Chèque, Espèces, Mobile money, Virement, A terme
2. WHEN a payment method is selected, THE Invoice_Generator SHALL display it on the generated invoice
3. WHEN "Espèces" is selected, THE Invoice_Generator SHALL trigger timbre de quittance addition
4. THE Invoice_Generator SHALL store the payment method with the invoice record

### Requirement 9: Professional Invoice and Receipt Template

**User Story:** En tant qu'utilisateur, je veux générer une facture ou un reçu professionnel avec l'identité de mon entreprise et tous les détails commerciaux, afin de fournir un document officiel à mes clients.

#### Acceptance Criteria

1. WHEN generating an invoice or receipt, THE Invoice_Generator SHALL include company header with company logo and full company details (name, address, phone, email, NCC)
2. WHEN generating an invoice or receipt, THE Invoice_Generator SHALL include the invoice number prominently (e.g., Facture N° 2025-00001)
3. WHEN generating an invoice or receipt, THE Invoice_Generator SHALL include invoice date and due date (if applicable)
4. WHEN generating an invoice or receipt, THE Invoice_Generator SHALL include customer information according to document type
5. WHEN generating an invoice or receipt, THE Invoice_Generator SHALL display line items in a professional table format with columns: N°, Description, Quantity, Unit Price HT, Discount %, Total HT, TVA Rate, TVA Amount, Total TTC
6. WHEN generating an invoice or receipt, THE Invoice_Generator SHALL display totals section with: Total HT, Total Discounts, Total TVA (by rate with separate lines for 0%, 9%, 18%), Other Taxes, Total TTC
7. WHEN generating an invoice or receipt, THE Invoice_Generator SHALL include payment method and payment terms
8. WHEN generating an invoice or receipt, THE Invoice_Generator SHALL include optional commercial message footer
9. THE Invoice_Generator SHALL format the invoice or receipt for A4 or A5 paper size with professional, clean layout
10. THE Invoice_Generator SHALL NOT include any FNE-specific elements (no FNE logo, no QR code placeholder, no FNE number placeholder)

### Requirement 10: Invoice and Receipt PDF Export

**User Story:** En tant qu'utilisateur, je veux exporter la facture ou le reçu de référence en PDF, afin de l'archiver, l'imprimer et l'utiliser pour la saisie sur la plateforme FNE.

#### Acceptance Criteria

1. WHEN an invoice or receipt is generated, THE Invoice_Generator SHALL create a PDF document
2. WHEN creating the PDF, THE Invoice_Generator SHALL preserve all formatting and layout from the template
3. WHEN the PDF is created, THE Invoice_Generator SHALL store it in the system with a unique filename
4. WHEN the user requests, THE Invoice_Generator SHALL allow download of the PDF file
5. WHEN the user requests, THE Invoice_Generator SHALL allow printing of the PDF file

### Requirement 11: Data Export for Accounting

**User Story:** En tant qu'utilisateur, je veux exporter les données de la facture ou du reçu en format CSV, afin de pouvoir les importer dans mes outils comptables ou la plateforme FNE.

#### Acceptance Criteria

1. WHEN an invoice or receipt is generated, THE Invoice_Generator SHALL provide an "Export CSV" option
2. WHEN export is requested, THE Invoice_Generator SHALL generate a CSV file with all invoice/receipt information
3. WHEN exporting data, THE Invoice_Generator SHALL include columns: Invoice Number, Date, Customer Name, Customer NCC, Line Item Description, Quantity, Unit Price HT, Discount %, TVA Rate, TVA Amount, Total HT, Total TTC
4. WHEN exporting line items, THE Invoice_Generator SHALL create one row per line item
5. WHEN exporting totals, THE Invoice_Generator SHALL include summary rows with: Total HT, TVA by rate, Total TVA, Other Taxes, Total TTC
6. THE Invoice_Generator SHALL format the CSV file for easy import into spreadsheet applications
7. WHEN the user requests, THE Invoice_Generator SHALL allow download of the CSV export file

### Requirement 12: Invoice History and Search

**User Story:** En tant qu'utilisateur, je veux consulter l'historique des factures avec recherche et filtres, afin de retrouver rapidement une facture spécifique.

#### Acceptance Criteria

1. THE Smart_POS SHALL provide an invoice history view listing all generated invoices
2. WHEN viewing invoice history, THE Smart_POS SHALL display: invoice number, date, customer name, invoice type, total amount, status
3. WHEN searching invoices, THE Smart_POS SHALL allow filtering by: date range, customer name, invoice number, invoice type, amount range
4. WHEN a search filter is applied, THE Smart_POS SHALL display only invoices matching all active filters
5. WHEN an invoice is selected from history, THE Smart_POS SHALL display the full invoice details and allow PDF download

### Requirement 13: Credit Notes (Factures d'Avoir)

**User Story:** En tant qu'utilisateur, je veux générer des factures d'avoir avec préfixe "A-", afin de documenter les retours et annulations.

#### Acceptance Criteria

1. WHEN creating a credit note, THE Invoice_Generator SHALL use the same form as standard invoices
2. WHEN generating a credit note number, THE Invoice_Generator SHALL prepend "A-" to the sequential number (e.g., A-2025-00001)
3. WHEN creating a credit note, THE Invoice_Generator SHALL allow reference to the original invoice number
4. WHEN displaying a credit note, THE Invoice_Generator SHALL clearly mark it as "FACTURE D'AVOIR" or "AVOIR"
5. THE Invoice_Generator SHALL store credit notes separately identifiable from standard invoices

### Requirement 14: Proforma Invoices

**User Story:** En tant qu'utilisateur, je veux générer des factures proforma avec préfixe "P-", afin de fournir des devis formels aux clients.

#### Acceptance Criteria

1. WHEN creating a proforma invoice, THE Invoice_Generator SHALL use the same form as standard invoices
2. WHEN generating a proforma number, THE Invoice_Generator SHALL prepend "P-" to the sequential number (e.g., P-2025-00001)
3. WHEN displaying a proforma, THE Invoice_Generator SHALL clearly mark it as "FACTURE PROFORMA" or "DEVIS"
4. WHEN a proforma is converted to a standard invoice, THE Invoice_Generator SHALL generate a new standard invoice number
5. THE Invoice_Generator SHALL store proforma invoices separately identifiable from standard invoices

### Requirement 15: Database Schema Extensions

**User Story:** En tant que système, je veux stocker toutes les informations de facturation dans la base de données PostgreSQL, afin de garantir la persistance et la traçabilité des données.

#### Acceptance Criteria

1. THE Smart_POS SHALL add an NCC field to the customers table
2. THE Smart_POS SHALL create an invoices table with fields for: invoice number, tenant ID, document type (invoice/receipt), invoice type (B2B/B2C/B2F/B2G), document subtype (standard/avoir/proforma), customer ID, date, due date, payment method, subtotal HT, total discounts, total TVA, other taxes, total TTC, PDF path, CSV export path
3. THE Smart_POS SHALL create an invoice_items table with fields for: invoice ID, product ID, quantity, unit price HT, discount percentage, TVA rate, TVA amount, total HT, total TTC
4. THE Smart_POS SHALL create an invoice_sequences table with fields for: tenant ID, year, last sequence number
5. THE Smart_POS SHALL create an invoice_taxes table for additional taxes with fields for: invoice ID, tax name, tax amount
6. WHEN storing invoice or receipt data, THE Smart_POS SHALL maintain referential integrity with foreign keys

### Requirement 16: Multi-Tenant Invoice and Receipt Isolation

**User Story:** En tant que système multi-tenant, je veux isoler les factures, reçus et numérotations par tenant, afin que chaque entreprise ait sa propre séquence indépendante.

#### Acceptance Criteria

1. FOR ALL invoice and receipt operations, THE Invoice_Generator SHALL filter by the current tenant ID
2. WHEN generating reference numbers, THE Invoice_Generator SHALL use the sequence counter specific to the current tenant and year
3. WHEN displaying invoice and receipt history, THE Smart_POS SHALL show only documents belonging to the current tenant
4. FOR ALL invoice and receipt queries, THE Smart_POS SHALL enforce tenant isolation at the database level

### Requirement 17: Invoice and Receipt Preview

**User Story:** En tant qu'utilisateur, je veux prévisualiser la facture ou le reçu avant génération finale, afin de vérifier toutes les informations et corriger les erreurs.

#### Acceptance Criteria

1. WHEN all invoice or receipt fields are completed, THE Invoice_Generator SHALL provide a "Preview" button
2. WHEN preview is requested, THE Invoice_Generator SHALL display the invoice or receipt in its final format without saving
3. WHEN viewing preview, THE Invoice_Generator SHALL allow the user to return to edit mode
4. WHEN viewing preview, THE Invoice_Generator SHALL allow the user to confirm and generate the final invoice or receipt
5. WHEN final generation is confirmed, THE Invoice_Generator SHALL save the invoice or receipt to the database and generate the PDF and export files

### Requirement 18: Company Branding on Invoices and Receipts

**User Story:** En tant qu'entreprise, je veux que mes factures et reçus affichent mon logo d'entreprise et mes informations complètes, afin de maintenir mon identité de marque professionnelle.

#### Acceptance Criteria

1. WHEN generating an invoice or receipt, THE Invoice_Generator SHALL retrieve the tenant's company logo from the database
2. WHEN generating an invoice or receipt, THE Invoice_Generator SHALL retrieve the tenant's company information: name, address, phone, email, NCC
3. WHEN the company logo exists, THE Invoice_Generator SHALL display it prominently in the invoice or receipt header
4. WHEN company information is incomplete, THE Invoice_Generator SHALL display a warning before invoice or receipt generation
5. THE Invoice_Generator SHALL format company information consistently across all invoices and receipts in a professional manner
6. THE Invoice_Generator SHALL create clean, professional documents suitable for client distribution

### Requirement 19: Invoice and Receipt Validation

**User Story:** En tant que système, je veux valider toutes les données avant génération de facture ou reçu, afin de garantir la conformité et éviter les erreurs.

#### Acceptance Criteria

1. WHEN generating an invoice or receipt, THE Invoice_Generator SHALL validate that at least one line item exists
2. WHEN generating an invoice or receipt, THE Invoice_Generator SHALL validate that all required customer fields for the document type are completed
3. WHEN generating an invoice or receipt, THE Invoice_Generator SHALL validate that all line items have valid quantities and prices
4. WHEN generating an invoice or receipt, THE Invoice_Generator SHALL validate that TVA rates are one of: 0%, 9%, or 18%
5. WHEN validation fails, THE Invoice_Generator SHALL display specific error messages and prevent invoice or receipt generation
6. WHEN validation succeeds, THE Invoice_Generator SHALL allow invoice or receipt generation to proceed

### Requirement 20: Invoice and Receipt Archival and Storage

**User Story:** En tant que système, je veux archiver automatiquement toutes les factures et reçus générés, afin de respecter les obligations légales de conservation.

#### Acceptance Criteria

1. WHEN an invoice or receipt PDF is generated, THE Invoice_Generator SHALL store it in a structured directory: /invoices/{tenant_id}/{year}/{invoice_number}.pdf
2. WHEN an invoice or receipt CSV export is generated, THE Invoice_Generator SHALL store it in: /invoices/{tenant_id}/{year}/{invoice_number}.csv
3. WHEN storing an invoice or receipt, THE Invoice_Generator SHALL record the file paths in the database
4. WHEN an invoice or receipt is requested, THE Smart_POS SHALL retrieve it from the stored file path
5. THE Smart_POS SHALL maintain invoice and receipt files for a minimum of 10 years
6. WHEN a tenant is deleted, THE Smart_POS SHALL archive (not delete) all associated invoice and receipt files

### Requirement 21: User Interface Responsiveness

**User Story:** En tant qu'utilisateur, je veux une interface de création de factures et reçus réactive et intuitive, afin de créer des documents rapidement sans formation extensive.

#### Acceptance Criteria

1. WHEN the invoice or receipt form loads, THE Invoice_Generator SHALL display all fields in a logical, grouped layout
2. WHEN adding line items, THE Invoice_Generator SHALL update totals in real-time
3. WHEN changing discount or tax values, THE Invoice_Generator SHALL recalculate totals immediately
4. WHEN selecting a customer, THE Invoice_Generator SHALL auto-populate customer fields from the database
5. WHEN selecting a product, THE Invoice_Generator SHALL auto-populate product details and default TVA rate
6. THE Invoice_Generator SHALL provide clear visual feedback for validation errors
7. THE Invoice_Generator SHALL display loading indicators during PDF and export file generation

### Requirement 22: Professional Document Standards

**User Story:** En tant qu'entreprise, je veux générer des factures et reçus professionnels conformes aux standards commerciaux, afin de fournir des documents officiels à mes clients et faciliter ma comptabilité.

#### Acceptance Criteria

1. WHEN generating an invoice or receipt, THE Invoice_Generator SHALL create a professional, clean document suitable for client distribution
2. WHEN an invoice or receipt is generated, THE Invoice_Generator SHALL include all legally required information: company details, customer details, itemized list, tax breakdown, totals, payment terms
3. WHEN displaying the document, THE Invoice_Generator SHALL use professional formatting with clear sections and readable fonts
4. THE Invoice_Generator SHALL generate documents that serve as official commercial invoices for the business
5. THE Invoice_Generator SHALL include all information necessary for the manager to optionally enter data into the FNE platform if required by law
