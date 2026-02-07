# 🚀 Démarrage Rapide - Configuration Resend

## ✅ Votre Configuration Actuelle

Bonne nouvelle ! Resend est **déjà configuré** dans votre application :

```env
✅ Provider: resend
✅ Clé API: re_Vk2S1yZd_Bve3Wmz2VBdxMqBBTAExNvjg
✅ Email expéditeur: onboarding@resend.dev
✅ Nom expéditeur: Smart POS - DEV
```

---

## 🧪 Tester Maintenant

### Option 1 : Interface de Test (Recommandé)

1. Ouvrez le fichier **`test-resend-config.html`** dans votre navigateur
2. Entrez votre adresse email (celle de votre compte Resend)
3. Cliquez sur **"Envoyer l'Email de Test"**
4. Vérifiez votre boîte de réception

### Option 2 : Depuis l'Application

1. Démarrez l'application :
   ```bash
   cd frontend
   npm run dev
   ```

2. Connectez-vous en tant que **Super Admin** ou **Owner**

3. Créez un nouvel utilisateur :
   - Allez dans **Paramètres > Utilisateurs**
   - Cliquez sur **"Ajouter un utilisateur"**
   - Utilisez votre email (celui du compte Resend)
   - Sauvegardez

4. Vérifiez votre boîte de réception

---

## ⚠️ Limitation Actuelle

Vous utilisez le **domaine de test** de Resend : `onboarding@resend.dev`

**Cela signifie :**
- ✅ Vous pouvez envoyer des emails
- ❌ Uniquement à l'adresse email de votre compte Resend
- ❌ Pas à d'autres adresses

**Pour envoyer à n'importe quelle adresse :**
1. Ajoutez votre propre domaine dans Resend
2. Configurez les DNS
3. Mettez à jour `VITE_FROM_EMAIL` avec votre domaine

➡️ Voir le guide complet : **`CONFIGURATION-RESEND.md`**

---

## 🔍 Vérifier les Logs

### Dans la Console du Navigateur (F12)

Après avoir envoyé un email, vous devriez voir :

```
📧 Envoi d'email via resend...
✅ Email envoyé via Resend: abc123xyz
```

### Sur Resend.com

1. Allez sur **https://resend.com/emails**
2. Vous verrez tous les emails envoyés
3. Statut : **Delivered** = ✅ Succès

---

## 🐛 Problèmes Courants

### L'email n'arrive pas

**Vérifiez :**
1. Vous utilisez bien l'email de votre compte Resend
2. Regardez dans les **spams**
3. Vérifiez les logs sur https://resend.com/emails
4. Vérifiez la console du navigateur (F12)

### Erreur "API key not valid"

**Solution :**
1. Vérifiez que la clé dans `.env` est correcte
2. Régénérez une nouvelle clé sur https://resend.com/api-keys
3. Mettez à jour les fichiers `.env`
4. Redémarrez l'application

---

## 📊 Quotas

**Plan Gratuit Resend :**
- 3000 emails/mois
- 100 emails/jour

**Votre utilisation estimée :**
- ~20 emails/mois pour un magasin
- Largement suffisant pour commencer !

---

## 🎯 Prochaines Étapes

### Pour le Développement
✅ Vous êtes prêt ! Continuez à utiliser le domaine de test.

### Pour la Production

1. **Ajouter votre domaine** :
   - Allez sur https://resend.com/domains
   - Ajoutez votre domaine (ex: `votredomaine.com`)

2. **Configurer les DNS** :
   - Ajoutez les enregistrements SPF, DKIM, DMARC
   - Attendez la vérification (quelques heures)

3. **Mettre à jour la config** :
   ```env
   VITE_FROM_EMAIL=noreply@votredomaine.com
   ```

4. **Redéployer** l'application

➡️ Guide détaillé : **`CONFIGURATION-RESEND.md`** (Section Production)

---

## 📚 Documentation

- **Guide complet** : `CONFIGURATION-RESEND.md`
- **Guide email général** : `EMAIL_SETUP_GUIDE.md`
- **Test interface** : `test-resend-config.html`
- **Documentation Resend** : https://resend.com/docs

---

## ✅ Checklist

- [x] Compte Resend créé
- [x] Clé API configurée
- [x] Variables d'environnement définies
- [ ] Email de test envoyé et reçu
- [ ] Domaine personnalisé ajouté (production)
- [ ] DNS configurés (production)

---

**Besoin d'aide ?**
- Consultez `CONFIGURATION-RESEND.md` pour plus de détails
- Vérifiez les logs sur https://resend.com/emails
- Testez avec `test-resend-config.html`

**Tout fonctionne ?** 🎉
Vous êtes prêt à envoyer des emails à vos utilisateurs !
