# Test: Mise à Jour Informations Personnelles Utilisateur

**Date**: 2026-03-01  
**Fonctionnalité**: Permettre aux caissiers de mettre à jour leur email et téléphone

## Prérequis
- ✅ Migration appliquée (colonne `phone` existe dans table `users`)
- ✅ Serveur backend redémarré
- ✅ Frontend accessible

## Scénarios de Test

### Test 1: Vérifier Visibilité Section (Caissier)
**Objectif**: S'assurer que la section "Informations Personnelles" est visible pour un caissier

**Étapes**:
1. Se connecter avec un compte caissier
2. Cliquer sur l'icône ⚙️ Paramètres (en haut à droite)
3. Faire défiler dans le modal

**Résultat Attendu**:
- ✅ Section "Informations Personnelles" visible
- ✅ Champ Email pré-rempli avec l'email actuel
- ✅ Champ Téléphone vide ou pré-rempli si déjà défini
- ✅ Bouton "Enregistrer" présent

### Test 2: Mise à Jour Email Valide
**Objectif**: Vérifier que l'email peut être mis à jour

**Étapes**:
1. Ouvrir Paramètres → Informations Personnelles
2. Modifier l'email (ex: `caissier.nouveau@test.com`)
3. Cliquer sur "Enregistrer"

**Résultat Attendu**:
- ✅ Toast de succès: "Informations personnelles mises à jour"
- ✅ Page se recharge automatiquement
- ✅ Nouvel email visible dans les paramètres après rechargement

### Test 3: Mise à Jour Téléphone
**Objectif**: Vérifier que le téléphone peut être ajouté/modifié

**Étapes**:
1. Ouvrir Paramètres → Informations Personnelles
2. Ajouter/modifier le téléphone (ex: `+225 07 12 34 56 78`)
3. Cliquer sur "Enregistrer"

**Résultat Attendu**:
- ✅ Toast de succès: "Informations personnelles mises à jour"
- ✅ Page se recharge automatiquement
- ✅ Téléphone visible dans les paramètres après rechargement

### Test 4: Email Déjà Utilisé
**Objectif**: Vérifier la gestion d'erreur pour email dupliqué

**Étapes**:
1. Ouvrir Paramètres → Informations Personnelles
2. Entrer un email déjà utilisé par un autre utilisateur
3. Cliquer sur "Enregistrer"

**Résultat Attendu**:
- ✅ Toast d'erreur: "Cet email est déjà utilisé par un autre utilisateur"
- ✅ Pas de rechargement de page
- ✅ Formulaire reste éditable

### Test 5: Email Vide (Validation)
**Objectif**: Vérifier que l'email est obligatoire

**Étapes**:
1. Ouvrir Paramètres → Informations Personnelles
2. Vider le champ Email
3. Cliquer sur "Enregistrer"

**Résultat Attendu**:
- ✅ Validation HTML5 empêche la soumission
- ✅ Message "Veuillez remplir ce champ" ou similaire

### Test 6: Vérification sur Facture
**Objectif**: S'assurer que l'email du vendeur apparaît sur les factures

**Étapes**:
1. Mettre à jour l'email dans Informations Personnelles
2. Créer une nouvelle facture
3. Prévisualiser la facture
4. Télécharger le PDF

**Résultat Attendu**:
- ✅ Email du vendeur visible dans "INFORMATIONS DOCUMENT" (prévisualisation)
- ✅ Email du vendeur visible dans "INFORMATIONS DOCUMENT" (PDF généré)
- ✅ Email correct (celui qui vient d'être mis à jour)

### Test 7: Visibilité pour Owner/Admin
**Objectif**: Vérifier que Owner et Admin voient aussi la section

**Étapes**:
1. Se connecter avec un compte Owner ou Admin
2. Ouvrir Paramètres

**Résultat Attendu**:
- ✅ Section "Informations Entreprise" visible (Owner/Admin uniquement)
- ✅ Section "Informations Personnelles" visible
- ✅ Section "Paramètres du compte" visible
- ✅ Ordre correct: Thème → Entreprise → Personnelles → Compte

### Test 8: Téléphone Optionnel
**Objectif**: Vérifier que le téléphone peut être laissé vide

**Étapes**:
1. Ouvrir Paramètres → Informations Personnelles
2. Laisser le champ Téléphone vide
3. Modifier uniquement l'email
4. Cliquer sur "Enregistrer"

**Résultat Attendu**:
- ✅ Sauvegarde réussie
- ✅ Téléphone reste vide (NULL en base)
- ✅ Email mis à jour correctement

## Vérifications Backend

### Vérifier la Route API
```bash
# Test avec curl ou Postman
PATCH http://localhost:5000/api/users/:id
Headers:
  Content-Type: application/json
  x-tenant-id: 4
  x-user-id: 5
Body:
{
  "email": "nouveau.email@test.com",
  "phone": "+225 07 12 34 56 78"
}
```

**Résultat Attendu**:
- ✅ Status 200 OK
- ✅ Réponse contient l'utilisateur mis à jour avec email et phone

### Vérifier en Base de Données
```sql
-- Vérifier que les données sont bien sauvegardées
SELECT id, username, email, phone, role 
FROM users 
WHERE id = 5;
```

**Résultat Attendu**:
- ✅ Email et phone mis à jour correctement

## Checklist Finale

- [ ] Migration appliquée en développement
- [ ] Migration appliquée en production (avec `apply-user-phone-migration.ps1`)
- [ ] Serveur backend redémarré
- [ ] Test 1: Visibilité section (Caissier) ✅
- [ ] Test 2: Mise à jour email valide ✅
- [ ] Test 3: Mise à jour téléphone ✅
- [ ] Test 4: Email déjà utilisé (erreur) ✅
- [ ] Test 5: Email vide (validation) ✅
- [ ] Test 6: Vérification sur facture ✅
- [ ] Test 7: Visibilité Owner/Admin ✅
- [ ] Test 8: Téléphone optionnel ✅
- [ ] Vérification backend API ✅
- [ ] Vérification base de données ✅

## Notes
- La colonne `phone` existe déjà dans la table `users` (type TEXT)
- L'email est obligatoire (validation HTML5 + backend)
- Le téléphone est optionnel (peut être NULL)
- Rechargement automatique après mise à jour pour synchroniser le contexte
- Gestion d'erreur spécifique pour email dupliqué (contrainte unique)
