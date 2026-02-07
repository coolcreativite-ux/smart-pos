# 📧 Configuration Email : contact@cooldigital.africa

## 🎯 Objectif

Configurer SmartPOS pour envoyer des emails depuis **contact@cooldigital.africa** au lieu du domaine de test Resend.

---

## 📚 Documentation Disponible

### 🚀 Pour Démarrer Rapidement

**[GUIDE-RAPIDE-COOLDIGITAL.md](GUIDE-RAPIDE-COOLDIGITAL.md)**
- Résumé en 3 étapes simples
- Temps : 35-60 minutes
- Niveau : Intermédiaire

### 📖 Pour un Guide Complet

**[CONFIGURATION-COOLDIGITAL-AFRICA.md](CONFIGURATION-COOLDIGITAL-AFRICA.md)**
- Guide détaillé étape par étape
- Captures d'écran et exemples
- Résolution de problèmes
- Support pour différents hébergeurs

### ✅ Pour Suivre Votre Progression

**[CHECKLIST-COOLDIGITAL.md](CHECKLIST-COOLDIGITAL.md)**
- Checklist complète à cocher
- Critères de succès
- Dépannage
- Temps estimé par phase

---

## 🔧 Outils Disponibles

### Script de Configuration Automatique

**[update-email-config.ps1](update-email-config.ps1)**
```powershell
.\update-email-config.ps1
```
Met à jour automatiquement tous les fichiers `.env` avec la nouvelle configuration.

### Interface de Test

**[test-resend-config.html](test-resend-config.html)**
- Testez l'envoi d'emails
- Vérifiez la configuration
- Interface visuelle simple

---

## 🎬 Démarrage Rapide

### Étape 1 : Ajouter le Domaine (10 min)

1. Allez sur **https://resend.com/domains**
2. Cliquez sur **"Add Domain"**
3. Entrez : `cooldigital.africa`
4. Notez les 3 enregistrements DNS

### Étape 2 : Configurer les DNS (20 min)

Ajoutez ces enregistrements chez votre hébergeur :

```
SPF (TXT)
  Nom: @
  Valeur: v=spf1 include:resend.com ~all

DKIM (TXT)
  Nom: resend._domainkey
  Valeur: [fourni par Resend]

DMARC (TXT)
  Nom: _dmarc
  Valeur: v=DMARC1; p=none; rua=mailto:dmarc@cooldigital.africa
```

### Étape 3 : Mettre à Jour SmartPOS (5 min)

```powershell
# Exécuter le script
.\update-email-config.ps1

# Redémarrer l'application
cd frontend
npm run dev

cd backend
npm run dev
```

---

## ✅ Vérification

### 1. Vérifier le Domaine

```powershell
# Vérifier les DNS
nslookup -type=TXT cooldigital.africa
nslookup -type=TXT resend._domainkey.cooldigital.africa
nslookup -type=TXT _dmarc.cooldigital.africa
```

### 2. Vérifier dans Resend

- Allez sur https://resend.com/domains
- Statut doit être **"Verified"** ✅

### 3. Tester l'Envoi

- Ouvrez `test-resend-config.html`
- Envoyez un email de test
- Vérifiez la réception

---

## 📊 Résultat Attendu

Après configuration, vous pourrez :

✅ Envoyer depuis **contact@cooldigital.africa**  
✅ Envoyer à **n'importe quelle adresse**  
✅ Image **professionnelle**  
✅ Meilleure **délivrabilité**  
✅ **3000 emails/mois gratuits**

---

## 🆘 Besoin d'Aide ?

### Problème avec le Domaine

➡️ Consultez : **CONFIGURATION-COOLDIGITAL-AFRICA.md** (Section "Résolution de Problèmes")

### Problème avec les DNS

➡️ Vérifiez avec : https://mxtoolbox.com/

### Problème avec l'Envoi

➡️ Vérifiez les logs : https://resend.com/emails

---

## 🔗 Liens Utiles

| Ressource | URL |
|-----------|-----|
| **Domaines Resend** | https://resend.com/domains |
| **Logs d'envoi** | https://resend.com/emails |
| **Clés API** | https://resend.com/api-keys |
| **Vérifier DNS** | https://mxtoolbox.com/ |
| **Status Resend** | https://status.resend.com/ |
| **Documentation** | https://resend.com/docs |

---

## 📋 Checklist Rapide

- [ ] Domaine ajouté dans Resend
- [ ] DNS SPF configuré
- [ ] DNS DKIM configuré
- [ ] DNS DMARC configuré
- [ ] Domaine vérifié (statut "Verified")
- [ ] Fichiers .env mis à jour
- [ ] Application redémarrée
- [ ] Email de test envoyé et reçu

---

## 💡 Conseils

### Pour le Développement

Vous pouvez continuer à utiliser `onboarding@resend.dev` pour le développement local. Utilisez `contact@cooldigital.africa` uniquement pour la production.

### Pour la Production

Assurez-vous que :
- Le domaine est vérifié
- Les DNS sont propagés
- Les tests sont concluants
- Les fichiers `.env.production` sont à jour

### Pour la Sécurité

- Ne commitez jamais les clés API dans Git
- Utilisez des variables d'environnement
- Surveillez les logs d'envoi régulièrement

---

## 📞 Support

### Documentation Locale

- **GUIDE-RAPIDE-COOLDIGITAL.md** - Démarrage rapide
- **CONFIGURATION-COOLDIGITAL-AFRICA.md** - Guide complet
- **CHECKLIST-COOLDIGITAL.md** - Checklist détaillée

### Support Resend

- **Email** : support@resend.com
- **Documentation** : https://resend.com/docs
- **Status** : https://status.resend.com/

---

## 🎉 Prêt à Commencer ?

1. **Ouvrez** : `GUIDE-RAPIDE-COOLDIGITAL.md`
2. **Suivez** les 3 étapes
3. **Testez** avec `test-resend-config.html`
4. **Profitez** de votre nouvelle configuration !

---

**Domaine** : cooldigital.africa  
**Email** : contact@cooldigital.africa  
**Provider** : Resend  
**Quota** : 3000 emails/mois (gratuit)  
**Date** : 7 février 2026
