# Configuration Rapide de l'Envoi d'Emails ⚡

## TL;DR - Configuration en 5 minutes avec Resend

### 1. Créer un compte Resend (gratuit)
👉 https://resend.com/signup

### 2. Obtenir une clé API
👉 https://resend.com/api-keys
- Cliquez sur "Create API Key"
- Copiez la clé (commence par `re_`)

### 3. Configurer `.env.local`

```env
VITE_EMAIL_PROVIDER=resend
VITE_RESEND_API_KEY=re_votre_cle_ici
VITE_FROM_EMAIL=onboarding@resend.dev
VITE_FROM_NAME=Gemini POS
```

### 4. Redémarrer le frontend

```bash
npm run dev
```

### 5. Tester !

- Allez dans Administration Système
- Générez une licence pour un propriétaire
- L'email arrive en quelques secondes ! 🎉

---

## Notes Importantes

### Domaine de test Resend

Avec `onboarding@resend.dev`, vous pouvez envoyer des emails **uniquement à votre propre adresse email** (celle utilisée pour créer le compte Resend).

**Pour envoyer à n'importe quelle adresse :**
1. Ajoutez votre propre domaine dans Resend
2. Configurez les DNS
3. Changez `VITE_FROM_EMAIL` pour utiliser votre domaine

### Mode Simulation (par défaut)

Si vous ne configurez rien, l'application fonctionne en mode simulation :
- Les emails sont affichés dans la console du navigateur
- Aucun email n'est réellement envoyé
- Parfait pour le développement local

---

## Besoin d'aide ?

Consultez le guide complet : `EMAIL_SETUP_GUIDE.md`
