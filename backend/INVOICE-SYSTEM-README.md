# Système de Facturation FNE - Backend

## Vue d'ensemble

Ce système permet de générer des factures et reçus professionnels PDF avec l'identité complète de l'entreprise. Il fonctionne en parallèle avec le système de tickets thermiques existant sans aucune interférence.

## Architecture

### Services Backend

1. **InvoiceNumberService** (`services/InvoiceNumberService.ts`)
   - Génération de numéros séquentiels par tenant et par année
   - Formats: `YYYY-NNNNN` (standard), `A-YYYY-NNNNN` (avoir), `P-YYYY-NNNNN` (proforma)
   - Gestion des transactions pour éviter les doublons

2. **TaxCalculationService** (`services/TaxCalculationService.ts`)
   - Calcul des taxes ivoiriennes (TVA 0%, 9%, 18%)
   - Gestion des remises par article et globales
   - Calcul automatique du timbre de quittance (100 FCFA) pour paiements en espèces
   - Arrondi à 2 décimales

3. **ValidationService** (`services/ValidationService.ts`)
   - Validation selon type de facturation (B2B, B2C, B2F, B2G)
   - Validation des formats (NCC, email, téléphone)
   - Validation des montants et quantités

4. **PDFGenerationService** (`services/PDFGenerationService.ts`)
   - Génération de PDF professionnels avec pdfkit
   - Format A4 avec logo et branding entreprise
   - Stockage dans `uploads/invoices/{tenantId}/{year}/`

5. **CSVExportService** (`services/CSVExportService.ts`)
   - Export CSV structuré pour comptabilité
   - Format compatible avec Excel/LibreOffice
   - Sections: header, client, articles, totaux

### API Endpoints

Tous les endpoints sont préfixés par `/api/invoices` et nécessitent une authentification.

#### POST /api/invoices
Crée une nouvelle facture ou reçu.

**Headers requis:**
```
x-tenant-id: <tenant_id>
x-user-id: <user_id>
```

**Body:**
```json
{
  "documentType": "invoice",
  "invoiceType": "B2B",
  "documentSubtype": "standard",
  "customerData": {
    "name": "Entreprise ABC",
    "ncc": "CI-ABJ-2024-A-12345",
    "phone": "+225 01 02 03 04",
    "email": "contact@abc.ci",
    "address": "Abidjan, Cocody"
  },
  "dueDate": "2025-03-15",
  "paymentMethod": "Virement",
  "items": [
    {
      "productId": 1,
      "variantId": 1,
      "quantity": 2,
      "unitPriceHT": 10000,
      "discountPercent": 0,
      "tvaRate": 18
    }
  ],
  "globalDiscountPercent": 0,
  "additionalTaxes": [],
  "commercialMessage": "Merci pour votre confiance"
}
```

**Response:**
```json
{
  "success": true,
  "invoice": {
    "id": "uuid",
    "invoiceNumber": "2025-00001",
    "pdfUrl": "/api/invoices/{id}/pdf",
    "csvUrl": "/api/invoices/{id}/csv"
  }
}
```

#### GET /api/invoices
Liste les factures avec filtres et pagination.

**Query Parameters:**
- `page`: Numéro de page (défaut: 1)
- `limit`: Nombre par page (défaut: 20)
- `startDate`: Date de début (ISO format)
- `endDate`: Date de fin (ISO format)
- `customerName`: Nom du client (recherche partielle)
- `invoiceNumber`: Numéro de facture (recherche partielle)
- `documentType`: `invoice` ou `receipt`
- `invoiceType`: `B2B`, `B2C`, `B2F`, ou `B2G`
- `minAmount`: Montant minimum
- `maxAmount`: Montant maximum

**Response:**
```json
{
  "success": true,
  "invoices": [
    {
      "id": "uuid",
      "invoiceNumber": "2025-00001",
      "documentType": "invoice",
      "invoiceType": "B2B",
      "documentSubtype": "standard",
      "customerName": "Entreprise ABC",
      "date": "2025-02-11",
      "totalTTC": 23600,
      "pdfUrl": "/api/invoices/{id}/pdf",
      "csvUrl": "/api/invoices/{id}/csv"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

#### GET /api/invoices/:id
Récupère les détails complets d'une facture.

#### GET /api/invoices/:id/pdf
Télécharge le PDF de la facture.

#### GET /api/invoices/:id/csv
Télécharge l'export CSV de la facture.

#### GET /api/invoices/next-number
Obtient le prochain numéro disponible.

**Query Parameters:**
- `documentSubtype`: `standard`, `avoir`, ou `proforma`

## Installation

1. Installer les dépendances:
```bash
cd backend
npm install
```

2. Exécuter la migration de base de données:
```bash
psql -U postgres -d votre_base -f ../database/migrations/001_add_invoice_system.sql
```

3. Créer le dossier uploads:
```bash
mkdir -p uploads/invoices
```

4. Démarrer le serveur:
```bash
npm run dev
```

## Configuration

### Variables d'environnement

Aucune variable supplémentaire n'est requise. Le système utilise la configuration PostgreSQL existante.

### Structure de stockage

Les fichiers PDF et CSV sont stockés dans:
```
uploads/invoices/
  ├── {tenantId}/
  │   ├── {year}/
  │   │   ├── 2025-00001.pdf
  │   │   ├── 2025-00001.csv
  │   │   ├── A-2025-00001.pdf
  │   │   └── P-2025-00001.pdf
```

## Types de facturation

### B2B (Business to Business)
- NCC requis
- Pour facturation entre entreprises locales

### B2C (Business to Consumer)
- Nom, téléphone, email requis
- Pour facturation particuliers

### B2F (Business to Foreign)
- Nom, téléphone, email requis
- Pour facturation internationale

### B2G (Business to Government)
- Nom, téléphone, email requis
- Pour facturation administration publique

## Taux de TVA ivoiriens

- **0%**: Produits exonérés
- **9%**: Taux réduit
- **18%**: Taux normal

## Taxes additionnelles

### Timbre de quittance
- Montant: 100 FCFA
- Ajouté automatiquement pour paiements en espèces
- Obligatoire selon la réglementation ivoirienne

## Sécurité

### Isolation multi-tenant
- Toutes les requêtes sont filtrées par `tenant_id`
- Row Level Security (RLS) activé sur toutes les tables
- Impossible d'accéder aux données d'un autre tenant

### Authentification
- Middleware `authMiddleware` vérifie `tenantId` et `userId`
- À améliorer avec JWT dans une version future

## Tests

Pour tester les endpoints avec curl:

```bash
# Créer une facture
curl -X POST http://localhost:5000/api/invoices \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: 1" \
  -H "x-user-id: 1" \
  -d '{
    "documentType": "invoice",
    "invoiceType": "B2B",
    "documentSubtype": "standard",
    "customerData": {
      "name": "Test Company",
      "ncc": "CI-ABJ-2024-A-12345"
    },
    "paymentMethod": "Virement",
    "items": [{
      "productId": 1,
      "variantId": 1,
      "quantity": 1,
      "unitPriceHT": 10000,
      "discountPercent": 0,
      "tvaRate": 18
    }]
  }'

# Lister les factures
curl http://localhost:5000/api/invoices?page=1&limit=10 \
  -H "x-tenant-id: 1" \
  -H "x-user-id: 1"

# Télécharger un PDF
curl http://localhost:5000/api/invoices/{id}/pdf \
  -H "x-tenant-id: 1" \
  -H "x-user-id: 1" \
  --output facture.pdf
```

## Prochaines étapes

1. **Frontend**: Créer les composants React pour l'interface utilisateur
2. **Tests**: Ajouter des tests unitaires et d'intégration
3. **JWT**: Implémenter une authentification JWT complète
4. **Permissions**: Ajouter la gestion des permissions par rôle
5. **Notifications**: Envoyer des emails avec les factures
6. **Archivage**: Système d'archivage automatique des anciennes factures

## Support

Pour toute question ou problème, consulter:
- `.kiro/specs/fne-invoice-system/requirements.md`
- `.kiro/specs/fne-invoice-system/design.md`
- `.kiro/specs/fne-invoice-system/tasks.md`
