# 🌍 Configuration de contact@cooldigital.africa avec Resend

Guide pas à pas pour configurer votre domaine `cooldigital.africa` avec Resend et utiliser l'adresse `contact@cooldigital.africa` pour envoyer des emails depuis SmartPOS.

---

## 📋 Vue d'Ensemble

**Objectif** : Envoyer des emails depuis `contact@cooldigital.africa`  
**Domaine** : `cooldigital.africa`  
**Durée estimée** : 30-60 minutes  
**Niveau** : Intermédiaire

---

## 🚀 Étape 1 : Ajouter le Domaine dans Resend (5 min)

### 1.1 Connexion à Resend

1. Allez sur **https://resend.com/login**
2. Connectez-vous avec vos identifiants

### 1.2 Ajouter le Domaine

1. Cliquez sur **"Domains"** dans le menu de gauche
2. Ou allez directement sur : **https://resend.com/domains**
3. Cliquez sur le bouton **"Add Domain"**
4. Dans le champ, entrez : `cooldigital.africa` (sans www, sans http://)
5. Cliquez sur **"Add"**

### 1.3 Récupérer les Enregistrements DNS

Resend va vous afficher **3 enregistrements DNS** à ajouter. Notez-les ou gardez la page ouverte.

**Exemple de ce que vous verrez :**

```
📝 SPF Record (TXT)
Type: TXT
Name: @
Value: v=spf1 include:resend.com ~all

📝 DKIM Record (TXT)
Type: TXT
Name: resend._domainkey
Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC... (longue chaîne)

📝 DMARC Record (TXT)
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@cooldigital.africa
```

> **Important** : Copiez exactement les valeurs fournies par Resend, surtout pour DKIM !

---

## 🌐 Étape 2 : Configurer les DNS (20-30 min)

Vous devez ajouter les enregistrements DNS chez votre hébergeur de domaine. Voici comment faire selon les hébergeurs courants :

### Option A : OVH

1. Connectez-vous à votre **espace client OVH**
2. Allez dans **"Web Cloud" > "Noms de domaine"**
3. Sélectionnez **cooldigital.africa**
4. Cliquez sur l'onglet **"Zone DNS"**
5. Cliquez sur **"Ajouter une entrée"**

**Pour chaque enregistrement :**

#### Enregistrement SPF
```
Type: TXT
Sous-domaine: (laissez vide ou mettez @)
Valeur: v=spf1 include:resend.com ~all
TTL: 3600 (par défaut)
```

#### Enregistrement DKIM
```
Type: TXT
Sous-domaine: resend._domainkey
Valeur: [coller la valeur complète fournie par Resend]
TTL: 3600 (par défaut)
```

#### Enregistrement DMARC
```
Type: TXT
Sous-domaine: _dmarc
Valeur: v=DMARC1; p=none; rua=mailto:dmarc@cooldigital.africa
TTL: 3600 (par défaut)
```

6. Cliquez sur **"Valider"** pour chaque enregistrement
7. Attendez quelques minutes pour la propagation

### Option B : Cloudflare

1. Connectez-vous à **Cloudflare**
2. Sélectionnez le domaine **cooldigital.africa**
3. Allez dans l'onglet **"DNS"**
4. Cliquez sur **"Add record"**

**Pour chaque enregistrement :**

#### Enregistrement SPF
```
Type: TXT
Name: @
Content: v=spf1 include:resend.com ~all
Proxy status: DNS only (nuage gris)
TTL: Auto
```

#### Enregistrement DKIM
```
Type: TXT
Name: resend._domainkey
Content: [coller la valeur complète fournie par Resend]
Proxy status: DNS only (nuage gris)
TTL: Auto
```

#### Enregistrement DMARC
```
Type: TXT
Name: _dmarc
Content: v=DMARC1; p=none; rua=mailto:dmarc@cooldigital.africa
Proxy status: DNS only (nuage gris)
TTL: Auto
```

5. Cliquez sur **"Save"** pour chaque enregistrement

### Option C : GoDaddy

1. Connectez-vous à **GoDaddy**
2. Allez dans **"My Products"**
3. À côté de **cooldigital.africa**, cliquez sur **"DNS"**
4. Faites défiler jusqu'à **"Records"**
5. Cliquez sur **"Add"**

**Pour chaque enregistrement :**

#### Enregistrement SPF
```
Type: TXT
Name: @
Value: v=spf1 include:resend.com ~all
TTL: 1 Hour
```

#### Enregistrement DKIM
```
Type: TXT
Name: resend._domainkey
Value: [coller la valeur complète fournie par Resend]
TTL: 1 Hour
```

#### Enregistrement DMARC
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@cooldigital.africa
TTL: 1 Hour
```

6. Cliquez sur **"Save"** pour chaque enregistrement

### Option D : Autre Hébergeur

Les étapes sont similaires :
1. Trouvez la section **"DNS"** ou **"Zone DNS"**
2. Ajoutez des enregistrements de type **TXT**
3. Utilisez les valeurs fournies par Resend

---

## ✅ Étape 3 : Vérifier le Domaine (5-10 min)

### 3.1 Attendre la Propagation DNS

Les DNS peuvent prendre de **quelques minutes à 48 heures** pour se propager. En général, c'est rapide (5-30 minutes).

### 3.2 Vérifier dans Resend

1. Retournez sur **https://resend.com/domains**
2. À côté de **cooldigital.africa**, cliquez sur **"Verify"**
3. Resend va vérifier les enregistrements DNS

**Résultats possibles :**

✅ **Verified** (vert) : Parfait ! Votre domaine est prêt  
⏳ **Pending** (orange) : Attendez encore un peu  
❌ **Failed** (rouge) : Vérifiez vos enregistrements DNS

### 3.3 Vérifier Manuellement les DNS

Vous pouvez vérifier si les DNS sont propagés avec ces outils :

**En ligne :**
- https://mxtoolbox.com/SuperTool.aspx
- https://dnschecker.org/

**Commande Windows (PowerShell) :**
```powershell
# Vérifier SPF
nslookup -type=TXT cooldigital.africa

# Vérifier DKIM
nslookup -type=TXT resend._domainkey.cooldigital.africa

# Vérifier DMARC
nslookup -type=TXT _dmarc.cooldigital.africa
```

**Résultats attendus :**
```
cooldigital.africa text = "v=spf1 include:resend.com ~all"
resend._domainkey.cooldigital.africa text = "p=MIGfMA0GCS..."
_dmarc.cooldigital.africa text = "v=DMARC1; p=none..."
```

---

## 🔧 Étape 4 : Mettre à Jour la Configuration SmartPOS (5 min)

Une fois le domaine vérifié dans Resend, mettez à jour vos fichiers de configuration.

### 4.1 Configuration Développement

**Fichier : `frontend/.env.development`**

```env
# Email configuration - RESEND avec cooldigital.africa
VITE_EMAIL_PROVIDER=resend
VITE_RESEND_API_KEY=re_Vk2S1yZd_Bve3Wmz2VBdxMqBBTAExNvjg
VITE_FROM_EMAIL=contact@cooldigital.africa
VITE_FROM_NAME=Cool Digital Africa
```

**Fichier : `backend/.env.development`**

```env
# Email Configuration (Resend)
RESEND_API_KEY=re_Vk2S1yZd_Bve3Wmz2VBdxMqBBTAExNvjg
FROM_EMAIL=contact@cooldigital.africa
FROM_NAME=Cool Digital Africa
```

**Fichier : `.env.local`**

```env
# Configuration Email
VITE_EMAIL_PROVIDER=resend
VITE_RESEND_API_KEY=re_Vk2S1yZd_Bve3Wmz2VBdxMqBBTAExNvjg
VITE_FROM_EMAIL=contact@cooldigital.africa
VITE_FROM_NAME=Cool Digital Africa
```

### 4.2 Configuration Production

**Fichier : `frontend/.env.production`**

```env
# Email configuration - RESEND Production
VITE_EMAIL_PROVIDER=resend
VITE_RESEND_API_KEY=re_Vk2S1yZd_Bve3Wmz2VBdxMqBBTAExNvjg
VITE_FROM_EMAIL=contact@cooldigital.africa
VITE_FROM_NAME=Cool Digital Africa
```

**Fichier : `backend/.env.production`**

```env
# Email Configuration (Resend)
RESEND_API_KEY=re_Vk2S1yZd_Bve3Wmz2VBdxMqBBTAExNvjg
FROM_EMAIL=contact@cooldigital.africa
FROM_NAME=Cool Digital Africa
```

### 4.3 Redémarrer l'Application

**Développement :**
```bash
# Frontend
cd frontend
# Arrêtez (Ctrl+C) puis relancez
npm run dev

# Backend
cd backend
# Arrêtez (Ctrl+C) puis relancez
npm run dev
```

**Production :**
```bash
# Rebuild et redéployer
npm run build
# Suivez votre processus de déploiement habituel
```

---

## 🧪 Étape 5 : Tester l'Envoi d'Emails (5 min)

### 5.1 Test avec l'Interface HTML

1. Ouvrez **`test-resend-config.html`** dans votre navigateur
2. Modifiez le code pour utiliser votre nouvelle adresse :

```javascript
// Ligne ~150, remplacez :
const FROM_EMAIL = 'contact@cooldigital.africa';
const FROM_NAME = 'Cool Digital Africa';
```

3. Entrez **n'importe quelle adresse email** (plus de limitation !)
4. Cliquez sur **"Envoyer l'Email de Test"**
5. Vérifiez la boîte de réception du destinataire

### 5.2 Test depuis l'Application

1. Démarrez SmartPOS
2. Connectez-vous en tant que **Super Admin** ou **Owner**
3. Créez un nouvel utilisateur avec n'importe quel email
4. L'utilisateur devrait recevoir un email de **contact@cooldigital.africa**

### 5.3 Vérifier les Logs

**Console du navigateur (F12) :**
```
📧 Envoi d'email via resend...
✅ Email envoyé via Resend: abc123xyz
```

**Sur Resend.com :**
1. Allez sur https://resend.com/emails
2. Vous devriez voir l'email envoyé
3. Statut : **Delivered** ✅

---

## 🎯 Résultat Final

Après avoir suivi toutes ces étapes, vous pourrez :

✅ Envoyer des emails depuis **contact@cooldigital.africa**  
✅ Envoyer à **n'importe quelle adresse email**  
✅ Avoir une **meilleure délivrabilité** (moins de spam)  
✅ Avoir une **image professionnelle**  
✅ Utiliser votre **propre domaine**

---

## 🐛 Résolution de Problèmes

### Problème 1 : Le domaine n'est pas vérifié

**Symptômes :**
- Statut "Pending" ou "Failed" dans Resend
- Erreur "Domain not verified" lors de l'envoi

**Solutions :**
1. Attendez 30 minutes à 2 heures pour la propagation DNS
2. Vérifiez que les enregistrements DNS sont corrects :
   ```powershell
   nslookup -type=TXT cooldigital.africa
   nslookup -type=TXT resend._domainkey.cooldigital.africa
   nslookup -type=TXT _dmarc.cooldigital.africa
   ```
3. Vérifiez qu'il n'y a pas de **doublons** dans vos DNS
4. Vérifiez que vous avez bien ajouté les enregistrements au **bon domaine**
5. Contactez le support de votre hébergeur si nécessaire

### Problème 2 : Les emails arrivent en spam

**Causes possibles :**
- DKIM/SPF mal configurés
- Domaine récent (pas d'historique)
- Contenu suspect

**Solutions :**
1. Vérifiez que tous les DNS sont corrects
2. Attendez quelques jours pour que le domaine gagne en réputation
3. Demandez aux destinataires de marquer comme "Non spam"
4. Évitez les mots "spam" dans le contenu
5. Ajoutez un lien de désinscription (optionnel)

### Problème 3 : Erreur "Invalid from address"

**Cause :** L'adresse expéditeur ne correspond pas au domaine vérifié

**Solution :**
1. Vérifiez que `VITE_FROM_EMAIL=contact@cooldigital.africa`
2. Vérifiez que le domaine est bien **Verified** dans Resend
3. Redémarrez l'application après modification

### Problème 4 : Les DNS ne se propagent pas

**Solutions :**
1. Attendez jusqu'à 48 heures (rare)
2. Videz le cache DNS de votre ordinateur :
   ```powershell
   ipconfig /flushdns
   ```
3. Vérifiez avec plusieurs outils en ligne
4. Contactez votre hébergeur

---

## 📊 Vérification Complète

### Checklist de Configuration

- [ ] Domaine ajouté dans Resend
- [ ] Enregistrement SPF ajouté dans les DNS
- [ ] Enregistrement DKIM ajouté dans les DNS
- [ ] Enregistrement DMARC ajouté dans les DNS
- [ ] DNS propagés (vérifiés avec nslookup)
- [ ] Domaine vérifié dans Resend (statut "Verified")
- [ ] `frontend/.env.development` mis à jour
- [ ] `backend/.env.development` mis à jour
- [ ] `.env.local` mis à jour
- [ ] `frontend/.env.production` mis à jour
- [ ] `backend/.env.production` mis à jour
- [ ] Application redémarrée
- [ ] Email de test envoyé et reçu
- [ ] Email arrive dans la boîte principale (pas spam)
- [ ] Logs Resend vérifiés (statut "Delivered")

### Commandes de Vérification

```powershell
# Vérifier la configuration locale
cat frontend/.env.development | Select-String "FROM_EMAIL"
cat backend/.env.development | Select-String "FROM_EMAIL"

# Vérifier les DNS
nslookup -type=TXT cooldigital.africa
nslookup -type=TXT resend._domainkey.cooldigital.africa
nslookup -type=TXT _dmarc.cooldigital.africa

# Tester l'API Resend
curl -X POST https://api.resend.com/emails `
  -H "Authorization: Bearer re_Vk2S1yZd_Bve3Wmz2VBdxMqBBTAExNvjg" `
  -H "Content-Type: application/json" `
  -d '{
    "from": "Cool Digital Africa <contact@cooldigital.africa>",
    "to": ["test@example.com"],
    "subject": "Test",
    "html": "<p>Test</p>"
  }'
```

---

## 🎉 Félicitations !

Vous pouvez maintenant envoyer des emails depuis **contact@cooldigital.africa** !

### Avantages de votre Configuration

✅ **Professionnel** : Votre propre domaine  
✅ **Fiable** : Meilleure délivrabilité  
✅ **Flexible** : Envoi à n'importe quelle adresse  
✅ **Sécurisé** : SPF, DKIM, DMARC configurés  
✅ **Gratuit** : 3000 emails/mois inclus

### Prochaines Étapes

1. **Testez** avec plusieurs adresses email
2. **Surveillez** les statistiques sur Resend.com
3. **Personnalisez** les templates d'emails
4. **Déployez** en production

---

## 📞 Support

### Besoin d'Aide ?

**Documentation :**
- Guide complet : `CONFIGURATION-RESEND.md`
- Démarrage rapide : `DEMARRAGE-RAPIDE-RESEND.md`
- État actuel : `RESEND-STATUS.md`

**Outils de Test :**
- Interface HTML : `test-resend-config.html`
- Logs Resend : https://resend.com/emails
- Vérification DNS : https://mxtoolbox.com/

**Support Resend :**
- Documentation : https://resend.com/docs
- Status : https://status.resend.com/
- Email : support@resend.com

---

**Version** : 1.0  
**Domaine** : cooldigital.africa  
**Email** : contact@cooldigital.africa  
**Date** : 7 février 2026
