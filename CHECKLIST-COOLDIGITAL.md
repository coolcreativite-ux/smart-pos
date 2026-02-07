# ✅ Checklist : Configuration contact@cooldigital.africa

## 📋 Étapes à Suivre

### Phase 1 : Configuration Resend (10 min)

- [ ] **Connexion à Resend**
  - Allez sur https://resend.com/login
  - Connectez-vous avec vos identifiants

- [ ] **Ajout du domaine**
  - Allez sur https://resend.com/domains
  - Cliquez sur "Add Domain"
  - Entrez : `cooldigital.africa`
  - Cliquez sur "Add"

- [ ] **Récupération des DNS**
  - Notez l'enregistrement SPF
  - Notez l'enregistrement DKIM (longue chaîne)
  - Notez l'enregistrement DMARC

---

### Phase 2 : Configuration DNS (20-30 min)

#### Chez votre hébergeur de domaine

- [ ] **Enregistrement SPF**
  ```
  Type: TXT
  Nom: @ (ou vide)
  Valeur: v=spf1 include:resend.com ~all
  ```

- [ ] **Enregistrement DKIM**
  ```
  Type: TXT
  Nom: resend._domainkey
  Valeur: [valeur fournie par Resend]
  ```

- [ ] **Enregistrement DMARC**
  ```
  Type: TXT
  Nom: _dmarc
  Valeur: v=DMARC1; p=none; rua=mailto:dmarc@cooldigital.africa
  ```

- [ ] **Attendre la propagation**
  - Minimum 10 minutes
  - Maximum 48 heures (rare)

---

### Phase 3 : Vérification DNS (10 min)

- [ ] **Vérifier avec nslookup**
  ```powershell
  nslookup -type=TXT cooldigital.africa
  nslookup -type=TXT resend._domainkey.cooldigital.africa
  nslookup -type=TXT _dmarc.cooldigital.africa
  ```

- [ ] **Vérifier en ligne**
  - https://mxtoolbox.com/SuperTool.aspx
  - Entrez : `cooldigital.africa`
  - Vérifiez les enregistrements TXT

- [ ] **Vérifier dans Resend**
  - Allez sur https://resend.com/domains
  - Cliquez sur "Verify"
  - Statut doit être "Verified" ✅

---

### Phase 4 : Configuration SmartPOS (5 min)

#### Option A : Script Automatique ⭐

- [ ] **Exécuter le script**
  ```powershell
  .\update-email-config.ps1
  ```

- [ ] **Confirmer** en tapant "O"

#### Option B : Manuel

- [ ] **Modifier frontend/.env.development**
  ```env
  VITE_FROM_EMAIL=contact@cooldigital.africa
  VITE_FROM_NAME=Cool Digital Africa
  ```

- [ ] **Modifier backend/.env.development**
  ```env
  FROM_EMAIL=contact@cooldigital.africa
  FROM_NAME=Cool Digital Africa
  ```

- [ ] **Modifier .env.local**
  ```env
  VITE_FROM_EMAIL=contact@cooldigital.africa
  VITE_FROM_NAME=Cool Digital Africa
  ```

- [ ] **Modifier les fichiers .env.production** (même chose)

---

### Phase 5 : Redémarrage (2 min)

- [ ] **Arrêter le frontend**
  - Ctrl+C dans le terminal frontend

- [ ] **Arrêter le backend**
  - Ctrl+C dans le terminal backend

- [ ] **Redémarrer le frontend**
  ```bash
  cd frontend
  npm run dev
  ```

- [ ] **Redémarrer le backend**
  ```bash
  cd backend
  npm run dev
  ```

---

### Phase 6 : Tests (10 min)

#### Test 1 : Interface HTML

- [ ] **Ouvrir test-resend-config.html**

- [ ] **Modifier la ligne 150**
  ```javascript
  const FROM_EMAIL = 'contact@cooldigital.africa';
  const FROM_NAME = 'Cool Digital Africa';
  ```

- [ ] **Envoyer un email de test**
  - Entrez n'importe quelle adresse email
  - Cliquez sur "Envoyer"

- [ ] **Vérifier la réception**
  - Email reçu dans la boîte principale
  - Pas dans les spams
  - Expéditeur : contact@cooldigital.africa

#### Test 2 : Depuis l'Application

- [ ] **Démarrer SmartPOS**

- [ ] **Se connecter** (Super Admin ou Owner)

- [ ] **Créer un utilisateur**
  - Allez dans Paramètres > Utilisateurs
  - Cliquez sur "Ajouter un utilisateur"
  - Utilisez une adresse email de test

- [ ] **Vérifier l'email reçu**
  - Email de bienvenue reçu
  - Expéditeur : contact@cooldigital.africa
  - Contenu correct

#### Test 3 : Vérifier les Logs

- [ ] **Console du navigateur (F12)**
  ```
  📧 Envoi d'email via resend...
  ✅ Email envoyé via Resend: abc123xyz
  ```

- [ ] **Logs Resend**
  - Allez sur https://resend.com/emails
  - Email visible dans la liste
  - Statut : "Delivered" ✅

---

## 🎯 Critères de Succès

### ✅ Configuration Réussie Si :

- [x] Domaine vérifié dans Resend (statut "Verified")
- [x] Les 3 DNS sont propagés (vérifiés avec nslookup)
- [x] Fichiers .env mis à jour avec contact@cooldigital.africa
- [x] Application redémarrée
- [x] Email de test envoyé et reçu
- [x] Email arrive dans la boîte principale (pas spam)
- [x] Expéditeur affiché : contact@cooldigital.africa
- [x] Logs Resend montrent "Delivered"
- [x] Pas d'erreurs dans la console

---

## 🐛 Dépannage

### Si le domaine n'est pas vérifié

- [ ] Attendre 30 minutes à 2 heures
- [ ] Vérifier les DNS avec nslookup
- [ ] Vérifier qu'il n'y a pas de doublons
- [ ] Contacter l'hébergeur si nécessaire

### Si les emails arrivent en spam

- [ ] Attendre quelques jours (réputation du domaine)
- [ ] Demander aux destinataires de marquer "Non spam"
- [ ] Vérifier que tous les DNS sont corrects
- [ ] Vérifier le contenu des emails

### Si erreur "Domain not verified"

- [ ] Vérifier le statut dans Resend
- [ ] Attendre la propagation DNS
- [ ] Vérifier les enregistrements DNS
- [ ] Redémarrer l'application

---

## 📊 Temps Estimé

| Phase | Durée | Difficulté |
|-------|-------|------------|
| Configuration Resend | 10 min | Facile |
| Configuration DNS | 20-30 min | Moyen |
| Vérification DNS | 10 min | Facile |
| Configuration SmartPOS | 5 min | Facile |
| Redémarrage | 2 min | Facile |
| Tests | 10 min | Facile |
| **TOTAL** | **~60 min** | **Moyen** |

---

## 📚 Ressources

### Guides Disponibles

- **GUIDE-RAPIDE-COOLDIGITAL.md** - Résumé en 3 étapes
- **CONFIGURATION-COOLDIGITAL-AFRICA.md** - Guide complet détaillé
- **CONFIGURATION-RESEND.md** - Guide général Resend
- **test-resend-config.html** - Interface de test

### Scripts Disponibles

- **update-email-config.ps1** - Mise à jour automatique des .env

### Liens Utiles

- **Domaines Resend** : https://resend.com/domains
- **Logs Resend** : https://resend.com/emails
- **Clés API** : https://resend.com/api-keys
- **Vérifier DNS** : https://mxtoolbox.com/
- **Status Resend** : https://status.resend.com/

---

## 🎉 Après la Configuration

Une fois tout configuré, vous pourrez :

✅ Envoyer des emails depuis **contact@cooldigital.africa**  
✅ Envoyer à **n'importe quelle adresse email**  
✅ Avoir une **image professionnelle**  
✅ Meilleure **délivrabilité** (moins de spam)  
✅ **3000 emails/mois gratuits**  
✅ Statistiques et logs détaillés

---

## 📞 Besoin d'Aide ?

### Documentation
- Consultez les guides dans le dossier du projet
- Vérifiez la documentation Resend : https://resend.com/docs

### Support
- Support Resend : support@resend.com
- Status Resend : https://status.resend.com/

### Vérifications
- Console du navigateur (F12) pour les erreurs
- Logs Resend pour l'historique d'envoi
- nslookup pour vérifier les DNS

---

**Date de création** : 7 février 2026  
**Domaine** : cooldigital.africa  
**Email** : contact@cooldigital.africa  
**Statut** : En attente de configuration
