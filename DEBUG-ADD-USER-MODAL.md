# Debug Guide - Formulaire d'Ajout d'Utilisateur

## Problème Rapporté
"Il n'y a pas de bouton envoyé sur le formulaire d'ajout"

## Solution Appliquée
Ajout de logs de débogage pour identifier le problème.

## Comment Tester

### 1. Vérifier que vous êtes connecté en tant que SuperAdmin
- Username: `admin`
- Password: `Admin@2026`
- Le rôle doit être `superadmin`

### 2. Ouvrir le Formulaire d'Ajout d'Utilisateur
1. Aller dans la page de gestion des utilisateurs
2. Cliquer sur "Ajouter un utilisateur"

### 3. Remplir le Formulaire
1. Prénom: `Test`
2. Nom: `User`
3. Email: `test@example.com` (ou votre email vérifié sur Resend)
4. Username: `testuser`
5. **IMPORTANT**: Cocher la case "Envoyer invitation par email"

### 4. Cliquer sur "Générer Invitation"
- Le bouton devrait afficher "Générer Invitation" (pas "Enregistrer")
- Après le clic, vous devriez voir:
  - Un aperçu de l'email généré
  - Un bouton "Confirmer & Envoyer l'Email"

### 5. Vérifier les Logs dans la Console
Ouvrez la console du navigateur (F12) et cherchez:

```
🔍 AddUserModal State: {
  invitationMessage: 'SET' ou 'NULL',
  isSuperAdmin: true ou false,
  sendInvite: true ou false,
  currentUserRole: 'superadmin'
}
```

```
🔐 Génération du mot de passe et de l'email d'invitation...
✅ Mot de passe généré
✅ Email généré, affichage de l'aperçu
📧 Message: OBJET : Bienvenue...
```

## Diagnostic

### Si le bouton n'apparaît pas:

#### Cas 1: `isSuperAdmin = false`
**Problème**: L'utilisateur n'est pas connecté en tant que SuperAdmin
**Solution**: Se reconnecter avec les identifiants SuperAdmin

#### Cas 2: `invitationMessage = NULL`
**Problème**: L'email n'a pas été généré
**Causes possibles**:
- Erreur dans `generateWelcomeEmail()`
- Clé API Gemini manquante (non critique, devrait utiliser le template par défaut)
- Erreur réseau

**Vérifier dans la console**:
- Y a-t-il une erreur `❌ Erreur génération invitation:`?
- Le message "✅ Email généré" apparaît-il?

#### Cas 3: `sendInvite = false`
**Problème**: La case "Envoyer invitation par email" n'est pas cochée
**Solution**: Cocher la case avant de cliquer sur "Générer Invitation"

## États du Modal

### État 1: Formulaire Initial
- Affiche tous les champs (prénom, nom, email, username, etc.)
- Affiche la case à cocher "Envoyer invitation par email"
- Bouton: "Générer Invitation" (si sendInvite = true) ou "Enregistrer" (si sendInvite = false)

### État 2: Aperçu Email (seulement si invitationMessage && isSuperAdmin)
- Affiche l'aperçu de l'email généré
- Bouton d'édition (icône crayon)
- Bouton "Confirmer & Envoyer l'Email"

## Flux Complet

```
1. Utilisateur remplit le formulaire
   ↓
2. Utilisateur coche "Envoyer invitation par email"
   ↓
3. Utilisateur clique "Générer Invitation"
   ↓
4. Génération du mot de passe aléatoire
   ↓
5. Appel à generateWelcomeEmail() avec le mot de passe
   ↓
6. setInvitationMessage(message)
   ↓
7. Modal passe en mode "Aperçu Email"
   ↓
8. Affichage du bouton "Confirmer & Envoyer l'Email"
   ↓
9. Utilisateur clique sur le bouton
   ↓
10. Envoi de l'email via sendRealEmail()
    ↓
11. Création de l'utilisateur avec le mot de passe généré
    ↓
12. Fermeture du modal
```

## Commandes de Test

### Tester en local
```bash
cd frontend
npm run dev
```

### Vérifier les variables d'environnement
```bash
# Dans frontend/.env.development
VITE_EMAIL_PROVIDER=resend
VITE_RESEND_API_KEY=re_Vk2S1yZd_Bve3Wmz2VBdxMqBBTAExNvjg
VITE_FROM_EMAIL=onboarding@resend.dev
```

### Vérifier le backend
```bash
cd backend
npm run dev
```

Le backend doit afficher:
```
🔧 Environnement: development
📁 Fichier .env chargé: .env.development
✅ Connexion à PostgreSQL réussie
Backend POS running on http://localhost:5000
```

## Prochaines Étapes

Si le problème persiste après ces vérifications:
1. Partager les logs de la console
2. Vérifier que le rôle de l'utilisateur est bien "superadmin" dans la base de données
3. Tester avec un autre navigateur (cache/cookies)
