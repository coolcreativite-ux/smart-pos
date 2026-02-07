# 🚀 Guide Rapide : contact@cooldigital.africa

## 📝 Résumé en 3 Étapes

### Étape 1 : Configurer le Domaine dans Resend (10 min)

1. **Allez sur** : https://resend.com/domains
2. **Cliquez sur** : "Add Domain"
3. **Entrez** : `cooldigital.africa`
4. **Notez** les 3 enregistrements DNS fournis

### Étape 2 : Ajouter les DNS (20 min)

Connectez-vous à votre hébergeur de domaine et ajoutez ces 3 enregistrements :

#### 📌 Enregistrement 1 : SPF
```
Type: TXT
Nom: @ (ou laissez vide)
Valeur: v=spf1 include:resend.com ~all
```

#### 📌 Enregistrement 2 : DKIM
```
Type: TXT
Nom: resend._domainkey
Valeur: [copiez la valeur exacte fournie par Resend]
```

#### 📌 Enregistrement 3 : DMARC
```
Type: TXT
Nom: _dmarc
Valeur: v=DMARC1; p=none; rua=mailto:dmarc@cooldigital.africa
```

**⏱️ Attendez 10-30 minutes** pour la propagation DNS

### Étape 3 : Mettre à Jour SmartPOS (5 min)

#### Option A : Script Automatique (Recommandé)

```powershell
.\update-email-config.ps1
```

#### Option B : Manuel

Modifiez ces fichiers :

**`frontend/.env.development`**
```env
VITE_FROM_EMAIL=contact@cooldigital.africa
VITE_FROM_NAME=Cool Digital Africa
```

**`backend/.env.development`**
```env
FROM_EMAIL=contact@cooldigital.africa
FROM_NAME=Cool Digital Africa
```

**`.env.local`**
```env
VITE_FROM_EMAIL=contact@cooldigital.africa
VITE_FROM_NAME=Cool Digital Africa
```

Faites de même pour les fichiers `.env.production`

**Redémarrez l'application** :
```bash
# Frontend
cd frontend
npm run dev

# Backend
cd backend
npm run dev
```

---

## ✅ Vérification

### 1. Vérifier le Domaine dans Resend

1. Allez sur https://resend.com/domains
2. Cliquez sur **"Verify"** à côté de cooldigital.africa
3. Le statut doit être **"Verified"** ✅

### 2. Vérifier les DNS

```powershell
nslookup -type=TXT cooldigital.africa
nslookup -type=TXT resend._domainkey.cooldigital.africa
nslookup -type=TXT _dmarc.cooldigital.africa
```

### 3. Tester l'Envoi

1. Ouvrez `test-resend-config.html`
2. Modifiez la ligne 150 :
   ```javascript
   const FROM_EMAIL = 'contact@cooldigital.africa';
   ```
3. Envoyez un email de test
4. Vérifiez la réception

---

## 🎯 Résultat

Après ces 3 étapes, vous pourrez :

✅ Envoyer des emails depuis **contact@cooldigital.africa**  
✅ Envoyer à **n'importe quelle adresse**  
✅ Avoir une **image professionnelle**  
✅ Meilleure **délivrabilité** (moins de spam)

---

## 🆘 Problèmes ?

### Le domaine n'est pas vérifié

- Attendez 30 minutes à 2 heures
- Vérifiez les DNS avec `nslookup`
- Vérifiez qu'il n'y a pas de doublons dans vos DNS

### Les emails arrivent en spam

- Attendez quelques jours pour la réputation du domaine
- Demandez aux destinataires de marquer comme "Non spam"
- Vérifiez que tous les DNS sont corrects

### Erreur "Domain not verified"

- Le domaine n'est pas encore vérifié dans Resend
- Attendez la propagation DNS
- Vérifiez les enregistrements DNS

---

## 📚 Documentation Complète

Pour plus de détails, consultez :
- **CONFIGURATION-COOLDIGITAL-AFRICA.md** - Guide complet étape par étape
- **CONFIGURATION-RESEND.md** - Guide général Resend
- **test-resend-config.html** - Interface de test

---

## 🔗 Liens Utiles

- **Domaines Resend** : https://resend.com/domains
- **Logs d'envoi** : https://resend.com/emails
- **Vérifier DNS** : https://mxtoolbox.com/
- **Status Resend** : https://status.resend.com/

---

**Temps total estimé** : 35-60 minutes  
**Niveau** : Intermédiaire  
**Coût** : Gratuit (3000 emails/mois)
