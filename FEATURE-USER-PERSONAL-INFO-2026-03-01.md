# Fonctionnalité: Mise à Jour Informations Personnelles Utilisateur

**Date**: 2026-03-01  
**Statut**: ✅ Complété

## Objectif
Permettre à TOUS les utilisateurs (y compris les caissiers) de mettre à jour leur email et téléphone personnel dans leurs préférences.

## Problème Résolu
Les caissiers ne pouvaient pas mettre à jour leurs informations de contact personnelles (email et téléphone) qui apparaissent sur les factures qu'ils créent.

## Solution Implémentée

### 1. Backend - Route API (`backend/server.ts`)
- ✅ Modification de la route `PATCH /api/users/:id` pour supporter le champ `phone`
- ✅ Ajout du paramètre `phone` dans la requête SQL UPDATE
- ✅ Gestion des erreurs (email déjà existant)

**Changements**:
```typescript
// Avant: email, first_name, last_name, role, assigned_store_id
// Après: email, phone, first_name, last_name, role, assigned_store_id

const { email, phone, first_name, last_name, role, assigned_store_id, permissions } = req.body;

UPDATE users 
SET email = COALESCE($1, email),
    phone = COALESCE($2, phone),
    first_name = COALESCE($3, first_name),
    last_name = COALESCE($4, last_name),
    role = COALESCE($5, role),
    assigned_store_id = $6
WHERE id = $7
```

### 2. Frontend - Modal Préférences (`frontend/components/SettingsModal.tsx`)
- ✅ Ajout d'une nouvelle section "Informations Personnelles"
- ✅ Visible pour TOUS les utilisateurs (owner, admin, manager, cashier)
- ✅ Positionnée AVANT la section "Paramètres du compte" (changement mot de passe)
- ✅ Champs: Email (obligatoire) et Téléphone (optionnel)
- ✅ Fonction `handleUpdatePersonalInfo` pour appeler l'API
- ✅ Gestion des erreurs (email déjà utilisé)
- ✅ Rechargement automatique après mise à jour

**Structure UI**:
```
┌─────────────────────────────────────┐
│ Paramètres                          │
├─────────────────────────────────────┤
│ [Thème: Clair / Sombre]            │
├─────────────────────────────────────┤
│ 📋 Informations Entreprise          │ ← Visible uniquement Owner/Admin
│   (Logo, Nom, NCC, RCCM, etc.)     │
├─────────────────────────────────────┤
│ 👤 Informations Personnelles        │ ← NOUVEAU - Visible pour TOUS
│   - Email *                         │
│   - Téléphone                       │
│   [Enregistrer]                     │
├─────────────────────────────────────┤
│ 🔒 Paramètres du compte             │
│   (Changement mot de passe)         │
└─────────────────────────────────────┘
```

### 3. Base de Données - Migration (`database/migrations/004_add_user_phone.sql`)
- ✅ Ajout de la colonne `phone VARCHAR(50)` à la table `users`
- ✅ Script PowerShell pour appliquer la migration: `apply-user-phone-migration.ps1`

## Fichiers Modifiés

1. **backend/server.ts**
   - Route `PATCH /api/users/:id` mise à jour pour supporter `phone`

2. **frontend/components/SettingsModal.tsx**
   - Ajout état `personalData` et `isUpdatingPersonal`
   - Ajout fonction `handlePersonalInputChange`
   - Ajout fonction `handleUpdatePersonalInfo`
   - Ajout section UI "Informations Personnelles"

3. **database/migrations/004_add_user_phone.sql** (nouveau)
   - Migration pour ajouter colonne `phone` à table `users`

4. **apply-user-phone-migration.ps1** (nouveau)
   - Script pour appliquer la migration en production

## Utilisation

### Pour les Utilisateurs
1. Cliquer sur l'icône ⚙️ Paramètres
2. Faire défiler jusqu'à "Informations Personnelles"
3. Mettre à jour Email et/ou Téléphone
4. Cliquer sur "Enregistrer"
5. La page se recharge automatiquement

### Pour l'Administrateur Système
1. Appliquer la migration en production:
   ```powershell
   .\apply-user-phone-migration.ps1
   ```
2. Redémarrer le serveur backend
3. Tester avec un utilisateur caissier

## Impact sur les Factures
- L'email de l'utilisateur apparaît dans "INFORMATIONS DOCUMENT" sur les factures
- Le téléphone personnel peut être utilisé pour contact direct avec le vendeur
- Ces informations sont distinctes des informations entreprise (en-tête)

## Tests à Effectuer
- [ ] Appliquer la migration en production
- [ ] Redémarrer le serveur backend
- [ ] Se connecter en tant que caissier
- [ ] Ouvrir les préférences (⚙️)
- [ ] Vérifier que la section "Informations Personnelles" est visible
- [ ] Mettre à jour l'email et le téléphone
- [ ] Vérifier que les changements sont sauvegardés
- [ ] Créer une facture et vérifier que l'email du vendeur apparaît correctement
- [ ] Tester avec un email déjà utilisé (doit afficher erreur)

## Notes Techniques
- La colonne `phone` est optionnelle (peut être NULL)
- L'email est obligatoire dans le formulaire
- Validation d'unicité de l'email au niveau base de données
- Rechargement automatique après mise à jour pour synchroniser le contexte utilisateur
- Gestion d'erreur spécifique pour email déjà existant

## Sécurité
- ✅ Authentification requise (headers x-tenant-id et x-user-id)
- ✅ Chaque utilisateur peut uniquement modifier ses propres informations
- ✅ Validation côté serveur des données
- ✅ Protection contre les emails dupliqués
