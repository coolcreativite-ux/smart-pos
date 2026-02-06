# Configuration DNS pour Smart POS

## 🌐 Domaine : cooldigital.africa

### Structure de sous-domaines recommandée

**Option 1 (Recommandée) :**
```
smartpos.cooldigital.africa        → Frontend (Application principale)
api.smartpos.cooldigital.africa    → Backend (API)
```

**Option 2 (Alternative) :**
```
smartpos.cooldigital.africa        → Frontend
smartpos-api.cooldigital.africa    → Backend
```

---

## 📋 Configuration DNS

### Étape 1 : Obtenir les IPs de Coolify

Après avoir créé vos services dans Coolify, vous obtiendrez des URLs temporaires :
- Backend : `https://backend-xxxxx.coolify.app`
- Frontend : `https://frontend-xxxxx.coolify.app`

Coolify vous fournira l'IP du serveur pour pointer vos domaines.

### Étape 2 : Ajouter les enregistrements DNS

Dans votre gestionnaire DNS (ex: Cloudflare, OVH, etc.), ajoutez :

**Pour Option 1 :**

| Type  | Nom                  | Valeur              | TTL  |
|-------|---------------------|---------------------|------|
| A     | smartpos            | [IP-COOLIFY]        | Auto |
| CNAME | api.smartpos        | smartpos.cooldigital.africa | Auto |

**Pour Option 2 :**

| Type  | Nom                  | Valeur              | TTL  |
|-------|---------------------|---------------------|------|
| A     | smartpos            | [IP-COOLIFY]        | Auto |
| A     | smartpos-api        | [IP-COOLIFY]        | Auto |

---

## 🔧 Configuration Coolify

### Backend

1. Dans Coolify, aller dans les paramètres du service backend
2. Section **Domains**
3. Ajouter le domaine : `api.smartpos.cooldigital.africa`
4. Activer **HTTPS** (Let's Encrypt automatique)
5. Sauvegarder et redéployer

### Frontend

1. Dans Coolify, aller dans les paramètres du service frontend
2. Section **Domains**
3. Ajouter le domaine : `smartpos.cooldigital.africa`
4. Activer **HTTPS** (Let's Encrypt automatique)
5. Sauvegarder et redéployer

---

## 🔐 Certificats SSL

Coolify génère automatiquement les certificats SSL via Let's Encrypt :
- ✅ Gratuit
- ✅ Automatique
- ✅ Renouvellement automatique

---

## 📝 Mise à jour des Variables d'Environnement

### Frontend

Après configuration DNS, mettre à jour dans Coolify :

```env
VITE_API_URL=https://api.smartpos.cooldigital.africa
VITE_SUPABASE_URL=https://lsujhpaxdsirlnllangt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzdWpocGF4ZHNpcmxubGxhbmd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzODQyNjgsImV4cCI6MjA4NTk2MDI2OH0.PT_-sZIjMODHmcndBjH16UWbco6L0ca6BsVmbaNvQ30
VITE_GEMINI_API_KEY=VOTRE_CLE_GEMINI
```

### Backend

Les variables backend restent identiques (pas de changement nécessaire).

---

## ⏱️ Temps de Propagation DNS

- **Minimum** : 5-15 minutes
- **Maximum** : 24-48 heures
- **Moyenne** : 1-2 heures

Vous pouvez vérifier la propagation sur : https://dnschecker.org

---

## ✅ Vérification

### 1. Tester la résolution DNS
```bash
# Windows
nslookup smartpos.cooldigital.africa
nslookup api.smartpos.cooldigital.africa

# Linux/Mac
dig smartpos.cooldigital.africa
dig api.smartpos.cooldigital.africa
```

### 2. Tester l'API
```bash
curl https://api.smartpos.cooldigital.africa/health
```

### 3. Tester le Frontend
Ouvrir dans le navigateur : https://smartpos.cooldigital.africa

---

## 🔄 Ordre de Configuration

1. **Créer les services dans Coolify** (sans domaine personnalisé)
2. **Déployer et tester** avec les URLs Coolify temporaires
3. **Configurer le DNS** (ajouter les enregistrements)
4. **Attendre la propagation** (15-30 min minimum)
5. **Ajouter les domaines dans Coolify**
6. **Activer HTTPS** (Let's Encrypt)
7. **Mettre à jour VITE_API_URL** dans le frontend
8. **Redéployer le frontend**
9. **Tester** les domaines personnalisés

---

## 🆘 Troubleshooting

### Le domaine ne résout pas
- Vérifier les enregistrements DNS
- Attendre la propagation (jusqu'à 24h)
- Vider le cache DNS : `ipconfig /flushdns` (Windows)

### Erreur SSL
- Vérifier que HTTPS est activé dans Coolify
- Attendre que Let's Encrypt génère le certificat (2-5 min)
- Vérifier que le domaine pointe bien vers Coolify

### Frontend ne se connecte pas au backend
- Vérifier VITE_API_URL dans les variables d'environnement
- Vérifier que l'API répond : `curl https://api.smartpos.cooldigital.africa/health`
- Vérifier les CORS dans le backend

---

## 📊 Résultat Final

Une fois configuré, vous aurez :

- ✅ **https://smartpos.cooldigital.africa** - Application principale
- ✅ **https://api.smartpos.cooldigital.africa** - API backend
- ✅ Certificats SSL automatiques
- ✅ Renouvellement automatique
- ✅ URLs professionnelles

---

## 📞 Support

Si vous utilisez Cloudflare :
- Désactiver le proxy (nuage gris) pendant la configuration initiale
- Activer après que Let's Encrypt ait généré les certificats
- Utiliser le mode SSL "Full (strict)"
