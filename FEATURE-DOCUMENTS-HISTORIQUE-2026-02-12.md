# Feature: Génération de documents depuis l'historique des ventes - 2026-02-12

## Fonctionnalité ajoutée

Ajout de boutons pour générer des documents (Ticket, Facture, Reçu) directement depuis l'historique des ventes, permettant aux utilisateurs de créer des documents pour des ventes passées.

## Modifications dans `frontend/components/SalesHistory.tsx`

### 1. Imports ajoutés
- `InvoiceGenerator` - Composant de génération de factures/reçus
- `DocumentType` - Type pour le type de document (invoice/receipt)
- `printReceipt` - Fonction d'impression de tickets thermiques
- `useStores` - Hook pour accéder au magasin actuel
- `useToast` - Hook pour afficher les notifications
- `API_URL` - Configuration de l'URL de l'API

### 2. États ajoutés
```typescript
const [invoiceGeneratorSale, setInvoiceGeneratorSale] = useState<Sale | null>(null);
const [invoiceDocumentType, setInvoiceDocumentType] = useState<DocumentType>('invoice');
```

### 3. Fonctions ajoutées

#### `handlePrintTicket(sale: Sale)`
Imprime un ticket thermique pour une vente passée

#### `handleGenerateDocument(sale: Sale, documentType: DocumentType)`
Ouvre le générateur de factures/reçus avec les données de la vente

#### `getPrefilledInvoiceDataFromSale(sale: Sale)`
Prépare les données pré-remplies pour le générateur de factures à partir d'une vente:
- Récupère les informations du client
- Convertit les prix TTC en HT
- Mappe les articles de la vente vers le format de facture
- Détermine le type de facturation (B2B si NCC présent, sinon B2C)

### 4. Interface utilisateur

#### Section de génération de documents
Ajoutée dans la section "Détails" de chaque vente:

```
┌─────────────────────────────────────┐
│ Générer un document                 │
├─────────┬─────────┬─────────────────┤
│ Ticket  │ Facture │ Reçu            │
│  🖨️     │  📄     │  ✓              │
└─────────┴─────────┴─────────────────┘
```

**Trois boutons:**
1. **Ticket** (gris) - Impression thermique immédiate
2. **Facture** (indigo) - Génération de facture professionnelle PDF
3. **Reçu** (vert) - Génération de reçu professionnel PDF

### 5. Workflow

#### Pour un ticket thermique:
1. Clic sur "Voir détails" d'une vente
2. Clic sur "Ticket"
3. → Fenêtre d'impression s'ouvre immédiatement

#### Pour une facture/reçu:
1. Clic sur "Voir détails" d'une vente
2. Clic sur "Facture" ou "Reçu"
3. → InvoiceGenerator s'ouvre avec données pré-remplies
4. Vérification/modification des données
5. Prévisualisation
6. Confirmation
7. → Document généré et téléchargement automatique du PDF

### 6. Téléchargement automatique

Après génération réussie:
- Toast de succès affiché
- PDF s'ouvre automatiquement dans un nouvel onglet
- Utilisateur peut sauvegarder ou imprimer directement

## Avantages

✅ **Flexibilité**: Générer des documents pour n'importe quelle vente passée
✅ **Choix multiple**: Ticket thermique, facture ou reçu selon les besoins
✅ **Données pré-remplies**: Toutes les informations de la vente sont automatiquement remplies
✅ **Téléchargement automatique**: Le PDF s'ouvre immédiatement après génération
✅ **UX cohérente**: Même interface que la génération depuis SalesCart
✅ **Accessible à tous**: Tous les rôles peuvent générer des documents depuis l'historique

## Cas d'usage

1. **Client demande une facture après coup**: Générer une facture pour une vente déjà effectuée
2. **Ticket perdu**: Réimprimer un ticket thermique
3. **Comptabilité**: Générer des factures en lot pour des ventes passées
4. **Conformité fiscale**: Créer des reçus officiels pour des ventes anciennes
5. **Archivage**: Générer des PDF pour toutes les ventes importantes

## Fichiers modifiés

- `frontend/components/SalesHistory.tsx`
  - Ajout des imports nécessaires
  - Ajout des états pour le générateur de factures
  - Ajout des fonctions de gestion
  - Ajout de la section de boutons dans les détails
  - Ajout du modal InvoiceGenerator

## Tests recommandés

1. ✅ Ouvrir l'historique des ventes
2. ✅ Cliquer sur "Voir détails" d'une vente
3. ✅ Cliquer sur "Ticket" → Vérifier l'impression
4. ✅ Cliquer sur "Facture" → Vérifier le formulaire pré-rempli
5. ✅ Générer la facture → Vérifier le téléchargement automatique
6. ✅ Cliquer sur "Reçu" → Vérifier le formulaire pré-rempli
7. ✅ Générer le reçu → Vérifier le téléchargement automatique
8. ✅ Tester avec une vente ayant un client avec NCC (B2B)
9. ✅ Tester avec une vente sans client (B2C)

## Compatibilité

- ✅ Compatible avec toutes les ventes existantes
- ✅ Fonctionne avec ou sans client assigné
- ✅ Gère les ventes avec retours partiels
- ✅ Respecte les permissions existantes
- ✅ S'intègre avec le système de facturation existant

## Prochaines améliorations possibles

1. Ajouter un bouton "Télécharger CSV" pour export comptable
2. Permettre la génération en lot (sélectionner plusieurs ventes)
3. Ajouter un filtre par date pour générer des factures mensuelles
4. Envoyer le document par email directement depuis l'historique
5. Afficher un aperçu rapide du document avant génération complète
