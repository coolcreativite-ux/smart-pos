# Feature: Ouverture des PDF pour impression au lieu de téléchargement - 2026-02-12

## Changement de comportement

Au lieu de télécharger automatiquement les fichiers PDF, le système ouvre maintenant les PDF dans une nouvelle fenêtre/onglet du navigateur, permettant à l'utilisateur de:
- Visualiser le document avant impression
- Imprimer directement depuis le navigateur (Ctrl+P)
- Télécharger manuellement si nécessaire
- Partager facilement le document

## Modifications

### 1. `frontend/components/SalesCart.tsx`

#### Fonction `handleDownloadInvoiceFile` modifiée:

**Avant:**
```typescript
// Téléchargement automatique pour PDF et CSV
const a = document.createElement('a');
a.href = url;
a.download = `document-${invoiceId}.${fileType}`;
a.click();
```

**Après:**
```typescript
if (fileType === 'pdf') {
    // Pour les PDF, ouvrir dans une nouvelle fenêtre pour impression
    window.open(url, '_blank');
} else {
    // Pour les CSV, télécharger directement
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-${invoiceId}.${fileType}`;
    a.click();
}
```

#### Labels des boutons mis à jour:
- **PDF**: "Imprimer PDF" (au lieu de "PDF")
- **CSV**: "Télécharger CSV" (au lieu de "CSV")
- **Description**: "Ouvrir pour impression ou téléchargement" (au lieu de "Téléchargez vos fichiers ci-dessous")

#### Icône PDF changée:
- Nouvelle icône: Imprimante (au lieu de document avec flèche)
- Reflète mieux l'action d'impression

### 2. `frontend/components/SalesHistory.tsx`

#### Callback `onSuccess` modifié:

**Avant:**
```typescript
// Téléchargement automatique du PDF
const a = document.createElement('a');
a.href = url;
a.download = `facture-${invoiceId}.pdf`;
a.click();
```

**Après:**
```typescript
// Ouvrir le PDF dans une nouvelle fenêtre pour impression
window.open(url, '_blank');
```

## Comportement par type de fichier

### PDF (Factures et Reçus)
✅ **S'ouvre dans un nouvel onglet**
- L'utilisateur voit le document immédiatement
- Peut imprimer avec Ctrl+P ou le bouton d'impression du navigateur
- Peut télécharger via le menu du navigateur si nécessaire
- Peut zoomer, faire défiler, etc.

### CSV (Export comptable)
✅ **Téléchargement direct**
- Le fichier CSV se télécharge automatiquement
- Comportement inchangé car les CSV sont destinés à être ouverts dans Excel/LibreOffice

## Avantages

### Pour l'utilisateur
✅ **Visualisation immédiate**: Voir le document avant d'imprimer
✅ **Contrôle d'impression**: Choisir l'imprimante, le nombre de copies, etc.
✅ **Économie de papier**: Vérifier le document avant d'imprimer
✅ **Flexibilité**: Peut toujours télécharger via le navigateur si nécessaire
✅ **Partage facile**: URL du document dans l'onglet pour partager

### Pour le système
✅ **Moins de téléchargements inutiles**: Pas de fichiers qui s'accumulent dans le dossier Téléchargements
✅ **Meilleure UX**: Workflow plus naturel pour l'impression
✅ **Cohérence**: Même comportement que les tickets thermiques (impression directe)

## Workflow utilisateur

### Depuis SalesCart (après une vente)

1. Vente complétée → Écran de succès
2. Clic sur "Facture" ou "Reçu"
3. Formulaire pré-rempli → Prévisualisation → Confirmation
4. Document généré → Section verte apparaît
5. **Clic sur "Imprimer PDF"** → PDF s'ouvre dans nouvel onglet
6. Utilisateur peut:
   - Imprimer directement (Ctrl+P)
   - Télécharger via le navigateur
   - Fermer l'onglet si pas besoin

### Depuis SalesHistory (ventes passées)

1. Historique des ventes → "Voir détails"
2. Clic sur "Facture" ou "Reçu"
3. Formulaire pré-rempli → Prévisualisation → Confirmation
4. **PDF s'ouvre automatiquement** dans nouvel onglet
5. Prêt pour impression ou téléchargement

## Gestion de la mémoire

```typescript
// Nettoyage de l'URL blob après un délai
setTimeout(() => window.URL.revokeObjectURL(url), 1000);
```

Le délai de 1 seconde permet:
- Au navigateur d'ouvrir le PDF
- De libérer la mémoire après utilisation
- D'éviter les fuites mémoire

## Compatibilité

✅ **Tous les navigateurs modernes**:
- Chrome/Edge: Visionneuse PDF intégrée
- Firefox: Visionneuse PDF intégrée
- Safari: Visionneuse PDF intégrée

✅ **Mobile**:
- Android: Ouvre dans l'application PDF par défaut
- iOS: Ouvre dans Safari avec options d'impression

## Tests recommandés

1. ✅ Générer une facture depuis SalesCart
2. ✅ Cliquer sur "Imprimer PDF" → Vérifier ouverture dans nouvel onglet
3. ✅ Tester l'impression depuis le navigateur (Ctrl+P)
4. ✅ Cliquer sur "Télécharger CSV" → Vérifier téléchargement direct
5. ✅ Générer une facture depuis SalesHistory
6. ✅ Vérifier ouverture automatique du PDF
7. ✅ Tester sur mobile (Android/iOS)
8. ✅ Vérifier que l'URL blob est nettoyée (pas de fuite mémoire)

## Notes techniques

### Authentification
Les requêtes incluent le token JWT dans les headers:
```typescript
headers: {
  'Authorization': `Bearer ${token}`
}
```

### Création du blob
```typescript
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
```

### Ouverture sécurisée
```typescript
window.open(url, '_blank'); // Nouvel onglet
```

## Prochaines améliorations possibles

1. Ajouter un bouton "Télécharger" explicite dans l'onglet du PDF
2. Permettre l'envoi par email directement depuis l'interface
3. Ajouter une option dans les paramètres: "Toujours télécharger" vs "Toujours ouvrir"
4. Prévisualisation inline dans un modal au lieu d'un nouvel onglet
5. Historique des documents générés avec liens rapides
