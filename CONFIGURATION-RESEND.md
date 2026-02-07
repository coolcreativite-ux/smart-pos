# 📧 Configuration Resend pour SmartPOS

Guide complet pour configurer l'envoi d'emails avec Resend dans votre application SmartPOS.

---

## 🎯 Pourquoi Resend ?

- ✅ **Gratuit** : 3000 emails/mois (largement suffisant pour un POS)
- ✅ **Simple** : Configuration en 5 minutes
- ✅ **Fiable** : Excellente délivrabilité
- ✅ **Moderne** : API REST simple et documentation claire

---

## 📋 Prérequis

- Un compte email valide
- Accès aux fichiers `.env` de votre application
- (Optionnel) Accès aux DNS de votre domaine pour la production

---

## 🚀 Configuration Rapide (Développement)

### Étape 1 : Créer un compte Resend

1. Allez sur **https://resend.com/signup**
2. Inscrivez-vous avec votre email
3. Vérifiez votre email (cliquez sur le lien de confirmation)
4. Connectez-vous à votre compte

### Étape 2 : Obtenir votre clé API

1. Une fois connecté, allez sur **https://resend.com/api-keys**
2. Cliquez sur le bouton **"Create API Key"**
3. Donnez un nom à votre clé : `SmartPOS Development`
4. Sélectionnez les permissions : **"Full access"** (recommandé)
5. Cliquez sur **"Add"**
6. **IMPORTANT** : Copiez immédiatement la clé (elle commence par `re_`)
   - ⚠️ Vous ne pourrez plus la voir après avoir fermé la fenêtre !
   - Exemple : `re_123abc456def789ghi`

### Étape 3 : Configurer l'application Frontend

1. Ouvrez le fichier **`frontend/.env.development`**
2. Ajoutez ou modifiez ces lignes :

```env
# Configuration Email - Resend
VITE_EMAIL_PROVIDER=resend
VITE_RESEND_API_KEY=re_votre_cle_api_ici
VITE_FROM_EMAIL=onboarding@resend.dev
VITE_FROM_NAME=SmartPOS
```

3. Remplacez `re_votre_cle_api_ici` par votre vraie clé API

### Étape 4 : Configurer l'application Backend (si applicable)

1. Ouvrez le fichier **`backend/.env.development`**
2. Ajoutez les mêmes variables :

```env
# Configuration Email - Resend
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_votre_cle_api_ici
FROM_EMAIL=onboarding@resend.dev
FROM_NAME=SmartPOS
```

### Étape 5 : Redémarrer l'application

**Frontend :**
```bash
cd frontend
# Arrêtez le serveur (Ctrl+C)
npm run dev
```

**Backend :**
```bash
cd backend
# Arrêtez le serveur (Ctrl+C)
npm run dev
```

### Étape 6 : Tester l'envoi d'emails

1. Connectez-vous à SmartPOS en tant que **Super Admin** ou **Owner**
2. Allez dans **"Licence"** ou **"Paramètres"**
3. Créez un nouvel utilisateur ou générez une licence
4. **Important** : Utilisez votre propre adresse email (celle du compte Resend)
5. Vérifiez votre boîte de réception
6. ✅ L'email devrait arriver en quelques secondes !

---

## 🏢 Configuration Production (Domaine Personnalisé)

Pour envoyer des emails à n'importe quelle adresse (pas seulement la vôtre), vous devez configurer votre propre domaine.

### Étape 1 : Ajouter votre domaine dans Resend

1. Allez sur **https://resend.com/domains**
2. Cliquez sur **"Add Domain"**
3. Entrez votre domaine : `votredomaine.com` (sans www)
4. Cliquez sur **"Add"**

### Étape 2 : Configurer les enregistrements DNS

Resend vous fournira 3 types d'enregistrements DNS à ajouter :

#### A. Enregistrement SPF (TXT)
```
Type: TXT
Nom: @
Valeur: v=spf1 include:resend.com ~all
```

#### B. Enregistrement DKIM (TXT)
```
Type: TXT
Nom: resend._domainkey
Valeur: [fourni par Resend - copier exactement]
```

#### C. Enregistrement DMARC (TXT)
```
Type: TXT
Nom: _dmarc
Valeur: v=DMARC1; p=none; rua=mailto:dmarc@votredomaine.com
```

### Étape 3 : Ajouter les DNS chez votre hébergeur

**Exemples selon votre hébergeur :**

#### OVH
1. Allez dans **"Web Cloud" > "Noms de domaine"**
2. Sélectionnez votre domaine
3. Onglet **"Zone DNS"**
4. Cliquez sur **"Ajouter une entrée"**
5. Sélectionnez **"TXT"**
6. Ajoutez chaque enregistrement

#### Cloudflare
1. Allez dans votre domaine
2. Onglet **"DNS"**
3. Cliquez sur **"Add record"**
4. Type : **TXT**
5. Ajoutez chaque enregistrement

#### GoDaddy
1. Allez dans **"My Products"**
2. Cliquez sur **"DNS"** à côté de votre domaine
3. Cliquez sur **"Add"**
4. Type : **TXT**
5. Ajoutez chaque enregistrement

### Étape 4 : Vérifier le domaine

1. Retournez sur **https://resend.com/domains**
2. Cliquez sur **"Verify"** à côté de votre domaine
3. Attendez quelques minutes (peut prendre jusqu'à 48h)
4. ✅ Le statut devrait passer à **"Verified"**

### Étape 5 : Mettre à jour la configuration

1. Ouvrez **`frontend/.env.production`**
2. Modifiez l'email expéditeur :

```env
VITE_EMAIL_PROVIDER=resend
VITE_RESEND_API_KEY=re_votre_cle_api_ici
VITE_FROM_EMAIL=noreply@votredomaine.com
VITE_FROM_NAME=SmartPOS
```

3. Faites de même pour **`backend/.env.production`**

### Étape 6 : Redéployer l'application

```bash
# Rebuild et redéployer
npm run build
# Suivez votre processus de déploiement habituel
```

---

## 📊 Utilisation dans SmartPOS

### Cas d'usage des emails

SmartPOS envoie des emails dans les situations suivantes :

1. **Création de licence** : Email au propriétaire avec la clé de licence
2. **Création d'utilisateur** : Email avec les identifiants de connexion
3. **Réinitialisation de mot de passe** : Lien de réinitialisation
4. **Alertes de stock bas** : Notification quand un produit est en rupture
5. **Rapports quotidiens** : Résumé des ventes (si activé)

### Personnaliser les emails

Les templates d'emails se trouvent dans :
- **`backend/services/emailService.ts`** : Service d'envoi
- **`frontend/services/emailService.ts`** : Service frontend

Pour personnaliser le contenu :

```typescript
// Exemple : Modifier le template de licence
const licenseEmailBody = `
Bonjour ${ownerName},

Bienvenue sur SmartPOS !

Votre clé de licence : **${licenseKey}**

Pour activer votre compte :
1. Connectez-vous sur ${appUrl}
2. Allez dans "Licence"
3. Entrez votre clé de licence

Cordialement,
L'équipe SmartPOS
`;
```

---

## 🔍 Vérification et Tests

### Vérifier la configuration

1. Ouvrez la **console du navigateur** (F12)
2. Effectuez une action qui envoie un email
3. Vous devriez voir :

```
📧 Envoi d'email via resend...
✅ Email envoyé via Resend: abc123xyz
```

### Tester avec différents scénarios

#### Test 1 : Email de bienvenue
```bash
# Créez un nouvel utilisateur avec votre email
# Vérifiez la réception
```

#### Test 2 : Alerte de stock
```bash
# Configurez un produit avec un seuil de stock bas
# Réduisez le stock en dessous du seuil
# Vérifiez la réception de l'alerte
```

#### Test 3 : Génération de licence
```bash
# En tant que Super Admin
# Générez une nouvelle licence
# Vérifiez la réception
```

---

## 🐛 Résolution de Problèmes

### Problème 1 : "API key not valid"

**Causes possibles :**
- Clé API incorrecte ou expirée
- Espaces avant/après la clé
- Clé non copiée entièrement

**Solutions :**
1. Vérifiez que la clé commence bien par `re_`
2. Supprimez les espaces avant/après
3. Régénérez une nouvelle clé API sur Resend
4. Redémarrez l'application après modification

### Problème 2 : "Domain not verified"

**Causes possibles :**
- DNS pas encore propagés
- Enregistrements DNS incorrects
- Utilisation d'un domaine non vérifié

**Solutions :**
1. Attendez 24-48h pour la propagation DNS
2. Vérifiez les enregistrements avec : https://mxtoolbox.com/
3. En développement, utilisez `onboarding@resend.dev`
4. Vérifiez que le domaine est bien "Verified" dans Resend

### Problème 3 : L'email arrive en spam

**Causes possibles :**
- Domaine pas configuré correctement
- Pas de DKIM/SPF
- Contenu suspect

**Solutions :**
1. Configurez SPF, DKIM et DMARC
2. Utilisez un domaine vérifié
3. Évitez les mots "spam" dans le contenu
4. Demandez aux destinataires de marquer comme "Non spam"

### Problème 4 : L'email n'arrive pas du tout

**Solutions :**
1. Vérifiez la console du navigateur pour les erreurs
2. Vérifiez que `VITE_EMAIL_PROVIDER=resend`
3. Vérifiez que la clé API est correcte
4. Testez avec votre propre email (compte Resend)
5. Vérifiez les logs Resend : https://resend.com/emails

### Problème 5 : "Rate limit exceeded"

**Cause :** Trop d'emails envoyés trop rapidement

**Solutions :**
1. Plan gratuit : 3000 emails/mois
2. Attendez quelques minutes
3. Passez à un plan payant si nécessaire

---

## 📈 Monitoring et Statistiques

### Consulter les logs d'envoi

1. Allez sur **https://resend.com/emails**
2. Vous verrez tous les emails envoyés :
   - Statut (Delivered, Bounced, etc.)
   - Date et heure
   - Destinataire
   - Sujet

### Statistiques disponibles

- **Delivered** : Emails livrés avec succès
- **Opened** : Emails ouverts (si tracking activé)
- **Clicked** : Liens cliqués
- **Bounced** : Emails rejetés
- **Complained** : Marqués comme spam

### Activer le tracking (optionnel)

Dans `emailService.ts`, ajoutez :

```typescript
body: JSON.stringify({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: [to],
    subject: subject,
    html: convertMarkdownToHtml(body),
    tags: [
        { name: 'category', value: 'transactional' }
    ],
    tracking: {
        open: true,
        click: true
    }
})
```

---

## 💰 Gestion des Quotas

### Plan Gratuit
- **3000 emails/mois**
- **100 emails/jour**
- Parfait pour : 1-10 magasins

### Estimation de consommation

Pour un magasin moyen :
- 5 utilisateurs créés/mois : 5 emails
- 10 alertes de stock/mois : 10 emails
- 2 licences générées/mois : 2 emails
- **Total : ~20 emails/mois**

➡️ Avec 3000 emails/mois, vous pouvez gérer **150 magasins** !

### Passer à un plan payant

Si vous dépassez les quotas :
1. Allez sur **https://resend.com/settings/billing**
2. Sélectionnez un plan :
   - **Pro** : 20$/mois - 50 000 emails
   - **Business** : 80$/mois - 200 000 emails

---

## 🔒 Sécurité

### Bonnes pratiques

1. **Ne jamais commiter les clés API** dans Git
   - Ajoutez `.env*` dans `.gitignore`
   - Utilisez des variables d'environnement

2. **Utiliser des clés différentes** par environnement
   - Développement : `re_dev_xxx`
   - Production : `re_prod_xxx`

3. **Limiter les permissions** des clés API
   - Créez des clés avec accès limité si possible

4. **Régénérer les clés** régulièrement
   - Tous les 6 mois minimum
   - Immédiatement si compromises

5. **Surveiller l'utilisation**
   - Vérifiez les logs régulièrement
   - Alertes si pic inhabituel

---

## 📞 Support

### Documentation Resend
- **API Reference** : https://resend.com/docs/api-reference
- **Guides** : https://resend.com/docs
- **Status** : https://status.resend.com/

### Support SmartPOS
- Consultez les logs dans la console (F12)
- Vérifiez `EMAIL_SETUP_GUIDE.md` pour plus de détails
- Contactez le support technique

---

## ✅ Checklist de Configuration

### Développement
- [ ] Compte Resend créé
- [ ] Clé API obtenue
- [ ] `frontend/.env.development` configuré
- [ ] `backend/.env.development` configuré
- [ ] Application redémarrée
- [ ] Email de test envoyé et reçu

### Production
- [ ] Domaine ajouté dans Resend
- [ ] DNS SPF configuré
- [ ] DNS DKIM configuré
- [ ] DNS DMARC configuré
- [ ] Domaine vérifié dans Resend
- [ ] `frontend/.env.production` configuré
- [ ] `backend/.env.production` configuré
- [ ] Application redéployée
- [ ] Email de test envoyé à plusieurs adresses
- [ ] Emails arrivent bien (pas en spam)

---

## 🎉 Félicitations !

Votre système d'envoi d'emails est maintenant configuré. Vos utilisateurs recevront automatiquement :
- Leurs identifiants de connexion
- Les clés de licence
- Les alertes importantes
- Les notifications système

**Prochaines étapes :**
1. Testez tous les scénarios d'envoi
2. Personnalisez les templates d'emails
3. Configurez les alertes de stock
4. Surveillez les statistiques d'envoi

---

**Version** : 1.0  
**Dernière mise à jour** : Février 2026  
**Application** : SmartPOS
