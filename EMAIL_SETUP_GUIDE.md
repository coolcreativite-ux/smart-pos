# Guide de Configuration de l'Envoi d'Emails

## État Actuel

Par défaut, l'application est en **mode simulation** : les emails sont affichés dans la console du navigateur mais ne sont pas réellement envoyés.

Pour envoyer de vrais emails aux propriétaires, vous devez configurer un fournisseur d'emails.

---

## Option 1 : Resend (Recommandé) ⭐

**Pourquoi Resend ?**
- ✅ Le plus simple à configurer
- ✅ Gratuit jusqu'à 3000 emails/mois
- ✅ Excellente délivrabilité
- ✅ Interface moderne et intuitive

### Étapes de configuration

#### 1. Créer un compte Resend

1. Visitez : https://resend.com/signup
2. Créez un compte gratuit
3. Vérifiez votre email

#### 2. Obtenir une clé API

1. Allez sur : https://resend.com/api-keys
2. Cliquez sur "Create API Key"
3. Donnez-lui un nom (ex: "Gemini POS Production")
4. Copiez la clé (elle commence par `re_`)

#### 3. Configurer un domaine (Important !)

**Option A : Utiliser le domaine de test (développement uniquement)**
- Resend fournit un domaine de test : `onboarding@resend.dev`
- Vous pouvez envoyer des emails uniquement à votre propre adresse email
- Parfait pour tester

**Option B : Utiliser votre propre domaine (production)**
1. Allez sur : https://resend.com/domains
2. Cliquez sur "Add Domain"
3. Entrez votre domaine (ex: `geminipos.com`)
4. Ajoutez les enregistrements DNS fournis par Resend
5. Attendez la vérification (quelques minutes à quelques heures)

#### 4. Configurer l'application

Ouvrez `.env.local` et modifiez :

```env
# Activer Resend
VITE_EMAIL_PROVIDER=resend

# Votre clé API Resend
VITE_RESEND_API_KEY=re_votre_cle_ici

# Email expéditeur (doit correspondre à votre domaine vérifié)
VITE_FROM_EMAIL=noreply@votredomaine.com
VITE_FROM_NAME=Gemini POS
```

**Pour le développement avec le domaine de test :**
```env
VITE_EMAIL_PROVIDER=resend
VITE_RESEND_API_KEY=re_votre_cle_ici
VITE_FROM_EMAIL=onboarding@resend.dev
VITE_FROM_NAME=Gemini POS
```

#### 5. Redémarrer l'application

```bash
# Arrêtez le frontend (Ctrl+C)
# Relancez-le
npm run dev
```

#### 6. Tester

1. Allez dans l'administration système
2. Générez une licence pour un propriétaire
3. Vérifiez la boîte email du propriétaire
4. ✅ L'email devrait arriver en quelques secondes !

---

## Option 2 : SendGrid

**Pourquoi SendGrid ?**
- ✅ Gratuit jusqu'à 100 emails/jour
- ✅ Très populaire et fiable
- ✅ Bonne documentation

### Étapes de configuration

#### 1. Créer un compte SendGrid

1. Visitez : https://signup.sendgrid.com/
2. Créez un compte gratuit
3. Vérifiez votre email

#### 2. Obtenir une clé API

1. Allez sur : https://app.sendgrid.com/settings/api_keys
2. Cliquez sur "Create API Key"
3. Choisissez "Full Access"
4. Copiez la clé (elle commence par `SG.`)

#### 3. Vérifier un expéditeur

1. Allez sur : https://app.sendgrid.com/settings/sender_auth/senders
2. Cliquez sur "Create New Sender"
3. Remplissez le formulaire avec vos informations
4. Vérifiez l'email de confirmation

#### 4. Configurer l'application

Ouvrez `.env.local` et modifiez :

```env
# Activer SendGrid
VITE_EMAIL_PROVIDER=sendgrid

# Votre clé API SendGrid
VITE_SENDGRID_API_KEY=SG.votre_cle_ici

# Email expéditeur (doit être vérifié dans SendGrid)
VITE_FROM_EMAIL=votre-email-verifie@example.com
VITE_FROM_NAME=Gemini POS
```

#### 5. Redémarrer et tester

Même procédure que pour Resend.

---

## Mode Simulation (Développement)

Si vous ne configurez aucun fournisseur, l'application reste en mode simulation :

```env
VITE_EMAIL_PROVIDER=simulation
```

**Avantages :**
- ✅ Pas besoin de configuration
- ✅ Pas de coûts
- ✅ Parfait pour le développement local

**Inconvénients :**
- ❌ Les emails ne sont pas réellement envoyés
- ❌ Affichés uniquement dans la console du navigateur

---

## Vérification de la Configuration

### Dans la console du navigateur

Après avoir généré une licence, vous devriez voir :

**Mode simulation :**
```
📧 SIMULATION D'ENVOI EMAIL
À: client@example.com
Sujet: Votre Clé de Licence
✅ EMAIL SIMULÉ (non envoyé réellement)
💡 Pour envoyer de vrais emails, configurez VITE_EMAIL_PROVIDER dans .env.local
```

**Mode Resend/SendGrid :**
```
📧 Envoi d'email via resend...
✅ Email envoyé via Resend: abc123
```

---

## Dépannage

### L'email n'arrive pas

1. **Vérifiez les spams** - Les emails peuvent être marqués comme spam
2. **Vérifiez le domaine** - Assurez-vous que votre domaine est vérifié
3. **Vérifiez la clé API** - Elle doit être valide et avoir les bonnes permissions
4. **Vérifiez la console** - Regardez les erreurs dans la console du navigateur

### Erreur "API key not valid"

- Vérifiez que vous avez copié la clé complète
- Vérifiez qu'il n'y a pas d'espaces avant/après
- Régénérez une nouvelle clé si nécessaire

### Erreur "Domain not verified"

- Attendez que la vérification DNS soit complète
- Utilisez le domaine de test en développement

---

## Recommandations

### Pour le développement
- Utilisez le **mode simulation** ou le **domaine de test Resend**
- Pas besoin de configuration complexe

### Pour la production
- Utilisez **Resend** avec votre propre domaine
- Configurez SPF, DKIM et DMARC pour une meilleure délivrabilité
- Surveillez vos quotas d'envoi

---

## Coûts

### Resend
- **Gratuit** : 3000 emails/mois
- **Pro** : 20$/mois pour 50 000 emails/mois

### SendGrid
- **Gratuit** : 100 emails/jour (3000/mois)
- **Essentials** : 19.95$/mois pour 50 000 emails/mois

Pour un POS avec quelques propriétaires, le plan gratuit est largement suffisant !
