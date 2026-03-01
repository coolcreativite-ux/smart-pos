# Fix: Affichage Téléphone Vendeur dans Factures

**Date**: 2026-03-01  
**Statut**: ✅ Complété

## Problème
Le numéro de téléphone du vendeur n'apparaissait pas dans "INFORMATIONS DOCUMENT" sur les factures générées (PDF), alors que l'email était affiché.

## Solution Implémentée

### 1. Backend - Types (`backend/types/invoice.types.ts`)
- ✅ Ajout du champ `createdByPhone?: string` dans l'interface `Invoice`

```typescript
export interface Invoice {
  // ... autres champs
  createdByName?: string;
  createdByEmail?: string;
  createdByPhone?: string; // NOUVEAU
}
```

### 2. Backend - Contrôleur (`backend/controllers/invoices.controller.ts`)
- ✅ Modification de la requête SQL pour récupérer le téléphone du vendeur
- ✅ Ajout de `createdByPhone` dans les données du document

**Avant**:
```typescript
const userResult = await client.query(
  `SELECT username, first_name, last_name, email
   FROM users WHERE id = $1`,
  [userId]
);
const createdByEmail = userResult.rows[0]?.email || '';
```

**Après**:
```typescript
const userResult = await client.query(
  `SELECT username, first_name, last_name, email, phone
   FROM users WHERE id = $1`,
  [userId]
);
const createdByEmail = userResult.rows[0]?.email || '';
const createdByPhone = userResult.rows[0]?.phone || '';

// Dans documentData
invoice: {
  // ...
  createdByEmail: createdByEmail,
  createdByPhone: createdByPhone
}
```

### 3. Backend - Service PDF (`backend/services/PDFGenerationService.ts`)
- ✅ Ajout de l'affichage du téléphone du vendeur dans "INFORMATIONS DOCUMENT"
- ✅ Augmentation de la hauteur de la boîte (130 → 143) pour accommoder le téléphone

**Ajout**:
```typescript
// Téléphone du vendeur
if (data.invoice.createdByPhone) {
  doc.font('Helvetica')
     .fillColor('#64748B')
     .text('Tél:', leftX + 10, docY);
  doc.font('Helvetica-Bold')
     .fillColor('#1E293B')
     .text(data.invoice.createdByPhone, leftX + 70, docY, { width: boxWidth - 80 });
}
```

### 4. Frontend - Types (`frontend/types.ts`)
- ✅ Ajout du champ `phone?: string` dans l'interface `User`

```typescript
export interface User {
  id: number;
  tenantId: number;
  username: string;
  email?: string;
  phone?: string; // NOUVEAU
  firstName: string;
  lastName: string;
  // ... autres champs
}
```

### 5. Frontend - Prévisualisation (`frontend/components/invoices/InvoicePreview.tsx`)
- ✅ Ajout de l'affichage du téléphone du vendeur dans "INFORMATIONS DOCUMENT"

**Ajout**:
```typescript
{user.phone && (
  <div className="flex justify-between">
    <span className="text-sm text-slate-600">Tél:</span>
    <span className="text-sm font-semibold text-slate-900">
      {user.phone}
    </span>
  </div>
)}
```

## Résultat

### Avant
**INFORMATIONS DOCUMENT** (PDF et Prévisualisation):
- Numéro
- Type
- Date
- Échéance/Validité
- Paiement
- Vendeur
- Email ✅

### Après
**INFORMATIONS DOCUMENT** (PDF et Prévisualisation):
- Numéro
- Type
- Date
- Échéance/Validité
- Paiement
- Vendeur
- Email ✅
- Tél ✅ (NOUVEAU)

## Fichiers Modifiés

1. `backend/types/invoice.types.ts` - Ajout `createdByPhone` dans interface `Invoice`
2. `backend/controllers/invoices.controller.ts` - Récupération téléphone vendeur
3. `backend/services/PDFGenerationService.ts` - Affichage téléphone dans PDF
4. `frontend/types.ts` - Ajout `phone` dans interface `User`
5. `frontend/components/invoices/InvoicePreview.tsx` - Affichage téléphone dans prévisualisation

## Tests à Effectuer

- [ ] Se connecter avec un utilisateur qui a un téléphone défini
- [ ] Créer une nouvelle facture
- [ ] Vérifier que le téléphone apparaît dans la prévisualisation (section "INFORMATIONS DOCUMENT")
- [ ] Générer le PDF
- [ ] Vérifier que le téléphone apparaît dans le PDF généré (section "INFORMATIONS DOCUMENT")
- [ ] Tester avec un utilisateur sans téléphone (le champ ne doit pas s'afficher)

## Notes Techniques

- Le champ `phone` est optionnel (peut être NULL)
- Si l'utilisateur n'a pas de téléphone, le champ ne s'affiche pas (condition `if`)
- Le téléphone s'affiche APRÈS l'email dans "INFORMATIONS DOCUMENT"
- La hauteur de la boîte PDF a été ajustée pour accommoder le nouveau champ

## Lien avec Autres Fonctionnalités

Cette modification complète la fonctionnalité implémentée dans `FEATURE-USER-PERSONAL-INFO-2026-03-01.md` qui permet aux utilisateurs de mettre à jour leur téléphone dans leurs préférences.

**Flux complet**:
1. Utilisateur met à jour son téléphone dans Paramètres → Informations Personnelles
2. Téléphone sauvegardé dans la table `users` (colonne `phone`)
3. Lors de la création d'une facture, le téléphone est récupéré depuis la table `users`
4. Le téléphone apparaît dans la prévisualisation et le PDF généré

## Serveur

- ✅ Serveur backend redémarré avec succès
- ✅ Aucune erreur TypeScript
- ✅ Prêt pour les tests
