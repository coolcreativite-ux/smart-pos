# 🔐 Système de Gestion des Mots de Passe

## Vue d'ensemble

Le système dispose de **3 méthodes distinctes** pour gérer les mots de passe, chacune avec un rôle spécifique.

---

## 1. 🔧 Préférences (Header) - Changement personnel

**Emplacement** : Icône d'engrenage dans l'en-tête (en haut à droite)

**Qui peut l'utiliser** : Tous les utilisateurs connectés

**Fonction** : Permet à chaque utilisateur de changer **son propre mot de passe**

**Sécurité** : 
- ✅ Demande l'ancien mot de passe (vérification d'identité)
- ✅ Demande le nouveau mot de passe
- ✅ Demande la confirmation du nouveau mot de passe

**Cas d'usage** :
- L'utilisateur veut changer son mot de passe pour des raisons de sécurité
- L'utilisateur a oublié son mot de passe et veut le réinitialiser après s'être connecté

**Route API** : `PATCH /api/users/:id/password`

---

## 2. 🔑 Réinitialisation (Gestion des Utilisateurs) - Réinitialisation administrative

**Emplacement** : Bouton 🔑 dans Paramètres → Gestion des Utilisateurs

**Qui peut l'utiliser** :
- **SuperAdmin** : Peut réinitialiser n'importe quel mot de passe
- **Owner/Admin** : Peut réinitialiser les mots de passe des utilisateurs de leur tenant (sauf autres owners/admins)

**Fonction** : Permet aux administrateurs de **réinitialiser le mot de passe d'un autre utilisateur**

**Sécurité** :
- ❌ Ne demande PAS l'ancien mot de passe (réinitialisation administrative)
- ✅ Demande le nouveau mot de passe
- ✅ Demande la confirmation du nouveau mot de passe
- ✅ Vérification des permissions (cross-tenant, rôles)

**Restrictions** :
- Un Owner/Admin ne peut PAS réinitialiser le mot de passe d'un autre Owner/Admin
- Un Owner/Admin ne peut PAS réinitialiser les mots de passe d'utilisateurs d'un autre tenant
- Seul le SuperAdmin peut réinitialiser les mots de passe des Owners

**Cas d'usage** :
- Un utilisateur a oublié son mot de passe et ne peut pas se connecter
- Un administrateur veut forcer un changement de mot de passe pour des raisons de sécurité
- Onboarding d'un nouvel utilisateur avec un mot de passe temporaire

**Route API** : `POST /api/users/:id/reset-password`

---

## 3. ✏️ Modifier (Gestion des Utilisateurs) - Modification des informations

**Emplacement** : Bouton "Modifier" dans Paramètres → Gestion des Utilisateurs

**Qui peut l'utiliser** : Administrateurs (Owner, Admin, SuperAdmin)

**Fonction** : Permet de modifier les **informations de l'utilisateur** (SANS toucher au mot de passe)

**Champs modifiables** :
- ✅ Nom et prénom
- ✅ Email
- ✅ Rôle
- ✅ Magasin assigné
- ✅ Permissions
- ❌ **Mot de passe** (utiliser le bouton 🔑 à la place)

**Note importante** : 
> 💡 En mode édition, les champs de mot de passe ne sont PAS affichés. Un message informe l'utilisateur d'utiliser le bouton 🔑 pour réinitialiser le mot de passe.

**Route API** : `PATCH /api/users/:id`

---

## Matrice des permissions

| Action | SuperAdmin | Owner | Admin | Manager | Cashier |
|--------|-----------|-------|-------|---------|---------|
| Changer son propre mot de passe (Préférences) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Réinitialiser mot de passe Owner | ✅ | ❌ | ❌ | ❌ | ❌ |
| Réinitialiser mot de passe Admin | ✅ | ❌ | ❌ | ❌ | ❌ |
| Réinitialiser mot de passe Manager/Cashier | ✅ | ✅* | ✅* | ❌ | ❌ |
| Modifier informations utilisateur | ✅ | ✅* | ✅* | ❌ | ❌ |

\* Uniquement pour les utilisateurs de leur propre tenant

---

## Flux de travail recommandés

### Scénario 1 : Nouvel employé
1. Admin crée l'utilisateur via "Ajouter un utilisateur"
2. Admin définit un mot de passe temporaire
3. L'employé se connecte avec le mot de passe temporaire
4. L'employé change son mot de passe via "Préférences"

### Scénario 2 : Mot de passe oublié
1. L'utilisateur contacte son administrateur
2. L'admin clique sur 🔑 à côté de l'utilisateur
3. L'admin définit un nouveau mot de passe temporaire
4. L'admin communique le mot de passe à l'utilisateur (par téléphone, en personne, etc.)
5. L'utilisateur se connecte et change son mot de passe via "Préférences"

### Scénario 3 : Changement de mot de passe régulier
1. L'utilisateur clique sur l'icône d'engrenage (Préférences)
2. L'utilisateur entre son ancien mot de passe
3. L'utilisateur entre et confirme son nouveau mot de passe
4. Le système valide et met à jour le mot de passe

---

## Sécurité

### Hachage des mots de passe
- Tous les mots de passe sont hachés avec **bcrypt** (10 rounds)
- Les mots de passe ne sont JAMAIS stockés en clair
- Les mots de passe ne sont JAMAIS affichés dans les logs

### Validation
- Minimum 6 caractères (peut être augmenté)
- Confirmation obligatoire pour éviter les erreurs de frappe
- Vérification de l'ancien mot de passe pour les changements personnels

### Logs d'audit
- Tous les changements et réinitialisations sont enregistrés dans `action_logs`
- Traçabilité complète : qui a fait quoi et quand

---

## API Endpoints

### 1. Changement de mot de passe (personnel)
```
PATCH /api/users/:id/password
Body: {
  old_password: string,
  new_password: string
}
```

### 2. Réinitialisation de mot de passe (admin)
```
POST /api/users/:id/reset-password
Body: {
  new_password: string,
  admin_user_id: number
}
```

### 3. Mise à jour utilisateur (sans mot de passe)
```
PATCH /api/users/:id
Body: {
  email?: string,
  first_name?: string,
  last_name?: string,
  role?: string,
  assigned_store_id?: number
}
```

---

## Dépannage

### Problème : "Ancien mot de passe incorrect"
- Vérifier que l'utilisateur entre bien son mot de passe actuel
- Si l'utilisateur a oublié son mot de passe, utiliser la réinitialisation administrative (🔑)

### Problème : "Permissions insuffisantes"
- Vérifier le rôle de l'utilisateur qui tente la réinitialisation
- Vérifier que l'utilisateur cible appartient au même tenant

### Problème : "Impossible de réinitialiser le mot de passe d'un administrateur"
- Seul le SuperAdmin peut réinitialiser les mots de passe des Owners/Admins
- Les Owners/Admins ne peuvent pas se réinitialiser mutuellement

---

## Améliorations futures possibles

1. **Politique de mot de passe** : Exiger des mots de passe plus complexes (majuscules, chiffres, caractères spéciaux)
2. **Expiration des mots de passe** : Forcer un changement tous les X jours
3. **Historique des mots de passe** : Empêcher la réutilisation des anciens mots de passe
4. **Authentification à deux facteurs (2FA)** : Ajouter une couche de sécurité supplémentaire
5. **Email de notification** : Envoyer un email quand le mot de passe est changé/réinitialisé
6. **Lien de réinitialisation** : Permettre aux utilisateurs de réinitialiser leur mot de passe par email sans intervention admin

---

**Date de création** : 12 février 2026  
**Dernière mise à jour** : 12 février 2026
