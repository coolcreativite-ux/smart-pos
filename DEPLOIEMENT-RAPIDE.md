# 🚀 Guide de Déploiement Rapide - Smart POS

## 🌐 Vos Domaines
- **Application** : https://smartpos.cooldigital.africa
- **API** : https://api.smartpos.cooldigital.africa

---

## ⚡ Déploiement en 4 Étapes

### Étape 1 : Configuration DNS (15-30 min)

Dans votre gestionnaire DNS (ex: Cloudflare, OVH) :

**Ajouter ces enregistrements :**

| Type | Nom          | Valeur                    |
|------|-------------|---------------------------|
| A    | smartpos    | [IP de votre serveur Coolify] |
| CNAME| api.smartpos| smartpos.cooldigital.africa |

**Où trouver l'IP Coolify ?**
- Dans Coolify → Settings → Server → IP Address

**Attendre la propagation DNS** : 15-30 minutes minimum

**Vérifier :**
```bash
nslookup smartpos.cooldigital.africa
nslookup api.smartpos.cooldigital.africa
```

---

### Étape 2 : Déployer le Backend (10 min)

**Dans Coolify :**

1. **New Resource** → **Dockerfile**

2. **Configuration :**
   ```
   Name: smart-pos-backend
   Repository: https://github.com/coolcreativite-ux/smart-pos.git
   Branch: main
   Build Pack: Dockerfile
   Base Directory: backend
   Dockerfile Location: backend/Dockerfile
   Port: 3001
   ```

3. **Domains :**
   - Ajouter : `api.smartpos.cooldigital.africa`
   - Activer **HTTPS** (Let's Encrypt)

4. **Environment Variables :**
   ```env
   NODE_ENV=production
   PORT=3001
   SUPABASE_URL=https://lsujhpaxdsirlnllangt.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzdWpocGF4ZHNpcmxubGxhbmd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzODQyNjgsImV4cCI6MjA4NTk2MDI2OH0.PT_-sZIjMODHmcndBjH16UWbco6L0ca6BsVmbaNvQ30
   DATABASE_URL=postgresql://postgres.lsujhpaxdsirlnllangt:kRzdl8ia5kSMJ4UV@aws-1-eu-central-1.pooler.supabase.com:6543/postgres
   ```

5. **Deploy** et attendre la fin du build (3-5 min)

6. **Tester :**
   ```bash
   curl https://api.smartpos.cooldigital.africa/health
   ```

---

### Étape 3 : Déployer le Frontend (10 min)

**Dans Coolify :**

1. **New Resource** → **Dockerfile**

2. **Configuration :**
   ```
   Name: smart-pos-frontend
   Repository: https://github.com/coolcreativite-ux/smart-pos.git
   Branch: main
   Build Pack: Dockerfile
   Base Directory: frontend
   Dockerfile Location: frontend/Dockerfile
   Port: 80
   ```

3. **Domains :**
   - Ajouter : `smartpos.cooldigital.africa`
   - Activer **HTTPS** (Let's Encrypt)

4. **Environment Variables :**
   ```env
   VITE_API_URL=https://api.smartpos.cooldigital.africa
   VITE_SUPABASE_URL=https://lsujhpaxdsirlnllangt.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzdWpocGF4ZHNpcmxubGxhbmd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzODQyNjgsImV4cCI6MjA4NTk2MDI2OH0.PT_-sZIjMODHmcndBjH16UWbco6L0ca6BsVmbaNvQ30
   VITE_GEMINI_API_KEY=VOTRE_CLE_GEMINI
   ```

5. **Deploy** et attendre la fin du build (5-7 min)

---

### Étape 4 : Vérification (5 min)

**Backend :**
```bash
curl https://api.smartpos.cooldigital.africa/health
# Devrait retourner un statut 200
```

**Frontend :**
- Ouvrir : https://smartpos.cooldigital.africa
- Vérifier que la page se charge
- Tester le login
- Vérifier la console (F12) pour les erreurs

---

## ✅ Checklist Finale

- [ ] DNS configuré et propagé
- [ ] Backend déployé sur `api.smartpos.cooldigital.africa`
- [ ] Frontend déployé sur `smartpos.cooldigital.africa`
- [ ] HTTPS activé sur les deux services
- [ ] API répond correctement
- [ ] Application se charge dans le navigateur
- [ ] Login fonctionne
- [ ] Connexion à la base de données OK

---

## 🔧 Configuration CORS (si nécessaire)

Si vous avez des erreurs CORS, vérifier dans `backend/server.ts` :

```typescript
app.use(cors({
  origin: [
    'https://smartpos.cooldigital.africa',
    'http://localhost:3000'
  ],
  credentials: true
}));
```

---

## 📊 Temps Total Estimé

- Configuration DNS : 15-30 min (+ temps de propagation)
- Déploiement Backend : 10 min
- Déploiement Frontend : 10 min
- Tests : 5 min

**Total : 40-55 minutes**

---

## 🆘 Problèmes Courants

### Le domaine ne résout pas
- Attendre la propagation DNS (jusqu'à 24h)
- Vérifier les enregistrements DNS
- Vider le cache DNS : `ipconfig /flushdns`

### Erreur SSL
- Attendre 2-5 min que Let's Encrypt génère le certificat
- Vérifier que le domaine pointe bien vers Coolify
- Redéployer le service si nécessaire

### Frontend ne se connecte pas au backend
- Vérifier `VITE_API_URL` dans les variables d'environnement
- Vérifier que l'API répond
- Vérifier les CORS dans le backend
- Regarder la console du navigateur (F12)

### Build échoue
- Vérifier les logs dans Coolify
- Vérifier que le Dockerfile est correct
- Vérifier que toutes les dépendances sont dans package.json

---

## 📚 Documentation Complète

- [DNS-CONFIGURATION.md](./DNS-CONFIGURATION.md) - Configuration DNS détaillée
- [COOLIFY-SETUP.md](./COOLIFY-SETUP.md) - Guide Coolify complet
- [PRE-DEPLOY-CHECKLIST.md](./PRE-DEPLOY-CHECKLIST.md) - Checklist détaillée

---

## 🎉 Résultat Final

Une fois terminé, vous aurez :

✅ **https://smartpos.cooldigital.africa** - Votre application POS
✅ **https://api.smartpos.cooldigital.africa** - Votre API
✅ Certificats SSL automatiques
✅ Déploiement automatique via Git push
✅ URLs professionnelles avec votre domaine

Bon déploiement ! 🚀
