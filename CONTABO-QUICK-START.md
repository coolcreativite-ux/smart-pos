# ⚡ Démarrage Ultra-Rapide Contabo

## 🎯 Configuration en 10 Minutes

Vous avez Contabo et Resend ouverts ? Suivez ces étapes exactes.

---

## 📝 Les 3 Enregistrements à Ajouter

### 1️⃣ Enregistrement DKIM

Dans Contabo, cliquez sur **"Create new record"** :

```
Name: resend._domainkey
TTL: 86400
Type: TXT (sélectionnez dans le menu)
Data: [Copiez la VALEUR COMPLÈTE depuis Resend]
      Elle commence par: p=MIGfMA...
      Elle se termine par: ...wIDAQAB
```

**⚠️ IMPORTANT** : Copiez TOUTE la valeur depuis Resend, c'est une longue chaîne !

Cliquez sur **"Add record"**

---

### 2️⃣ Enregistrement SPF

Cliquez sur **"Create new record"** :

```
Name: (LAISSEZ VIDE ou mettez @)
TTL: 86400
Type: TXT
Data: v=spf1 include:resend.com ~all
```

Cliquez sur **"Add record"**

---

### 3️⃣ Enregistrement DMARC

Cliquez sur **"Create new record"** :

```
Name: _dmarc
TTL: 86400
Type: TXT
Data: v=DMARC1; p=none; rua=mailto:dmarc@cooldigital.africa
```

Cliquez sur **"Add record"**

---

## ⏱️ Attendre (30 minutes)

☕ Prenez un café, les DNS doivent se propager.

---

## ✅ Vérifier dans Resend

1. Allez sur https://resend.com/domains
2. Cliquez sur **"Verify"** à côté de cooldigital.africa
3. Statut doit être **"Verified"** ✅

---

## 🔧 Mettre à Jour SmartPOS

```powershell
# Exécuter le script
.\update-email-config.ps1

# Redémarrer
cd frontend
npm run dev

cd backend
npm run dev
```

---

## 🧪 Tester

1. Ouvrez `test-resend-config.html`
2. Modifiez la ligne 150 :
   ```javascript
   const FROM_EMAIL = 'contact@cooldigital.africa';
   ```
3. Envoyez un email de test
4. ✅ Vérifiez votre boîte de réception

---

## 🆘 Problème ?

**Le domaine n'est pas vérifié ?**
- Attendez encore 30 minutes
- Vérifiez qu'il n'y a pas de doublons dans vos DNS
- Consultez : GUIDE-CONTABO-COOLDIGITAL.md

**Les emails arrivent en spam ?**
- Normal les premiers jours
- Demandez aux destinataires de marquer "Non spam"

---

## 📚 Guides Complets

- **GUIDE-CONTABO-COOLDIGITAL.md** - Guide détaillé Contabo
- **CONFIGURATION-COOLDIGITAL-AFRICA.md** - Guide complet général
- **CHECKLIST-COOLDIGITAL.md** - Checklist complète

---

**Temps total** : ~40 minutes (10 min config + 30 min propagation)  
**Hébergeur** : Contabo  
**Domaine** : cooldigital.africa  
**Email** : contact@cooldigital.africa
