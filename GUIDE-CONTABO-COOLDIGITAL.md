# 🌍 Configuration DNS Contabo pour cooldigital.africa

## 📋 Guide Spécifique Contabo

Ce guide vous montre **exactement** comment ajouter les enregistrements DNS Resend dans l'interface Contabo pour votre domaine `cooldigital.africa`.

---

## 🎯 Ce que Vous Devez Faire

Resend vous demande d'ajouter **3 enregistrements DNS** :
1. ✅ **DKIM** (visible dans votre capture)
2. ⏳ **SPF** (à ajouter)
3. ⏳ **DMARC** (à ajouter)

---

## 📝 Enregistrement 1 : DKIM (Déjà Visible)

D'après votre capture d'écran Resend, voici l'enregistrement DKIM :

### Informations Resend
```
Type: TXT
Name: resend._domainkey
Content: p=MIGfMA[...]wIDAQAB
TTL: Auto
```

### À Saisir dans Contabo

Dans le formulaire "Create new record" de Contabo :

| Champ | Valeur |
|-------|--------|
| **Name** | `resend._domainkey` |
| **TTL** | `86400` (ou laissez par défaut) |
| **Type** | Sélectionnez `TXT` dans le menu déroulant |
| **Data** | `p=MIGfMA[...]wIDAQAB` (copiez la valeur COMPLÈTE depuis Resend) |

**⚠️ IMPORTANT** : 
- Copiez la valeur **COMPLÈTE** du champ "Content" depuis Resend
- Elle commence par `p=MIGfMA` et se termine par `wIDAQAB`
- C'est une longue chaîne de caractères, assurez-vous de tout copier !

### Étapes dans Contabo

1. Dans l'interface DNS de Contabo pour `cooldigital.africa`
2. Cliquez sur **"Create new record"** (ou équivalent)
3. Remplissez les champs comme indiqué ci-dessus
4. Cliquez sur **"Add record"**

---

## 📝 Enregistrement 2 : SPF

### Informations à Saisir

| Champ | Valeur |
|-------|--------|
| **Name** | Laissez vide OU mettez `@` |
| **TTL** | `86400` |
| **Type** | `TXT` |
| **Data** | `v=spf1 include:resend.com ~all` |

### Étapes dans Contabo

1. Cliquez sur **"Create new record"**
2. **Name** : Laissez vide (ou mettez `@` si demandé)
3. **TTL** : `86400`
4. **Type** : Sélectionnez `TXT`
5. **Data** : `v=spf1 include:resend.com ~all`
6. Cliquez sur **"Add record"**

---

## 📝 Enregistrement 3 : DMARC

### Informations à Saisir

| Champ | Valeur |
|-------|--------|
| **Name** | `_dmarc` |
| **TTL** | `86400` |
| **Type** | `TXT` |
| **Data** | `v=DMARC1; p=none; rua=mailto:dmarc@cooldigital.africa` |

### Étapes dans Contabo

1. Cliquez sur **"Create new record"**
2. **Name** : `_dmarc`
3. **TTL** : `86400`
4. **Type** : Sélectionnez `TXT`
5. **Data** : `v=DMARC1; p=none; rua=mailto:dmarc@cooldigital.africa`
6. Cliquez sur **"Add record"**

---

## 📸 Exemple de Remplissage (Basé sur Votre Interface)

### Pour DKIM (Exemple)

```
┌─────────────────────────────────────────────┐
│ Create new record                      [X]  │
├─────────────────────────────────────────────┤
│                                             │
│ Name ⓘ                                     │
│ ┌─────────────────────────────────────────┐│
│ │ resend._domainkey                       ││
│ └─────────────────────────────────────────┘│
│                                             │
│ TTL * ⓘ                                    │
│ ┌─────────────────────────────────────────┐│
│ │ 86400                                   ││
│ └─────────────────────────────────────────┘│
│                                             │
│ Type * ⓘ                                   │
│ ┌─────────────────────────────────────────┐│
│ │ TXT                              [▼]    ││
│ └─────────────────────────────────────────┘│
│                                             │
│ Data * ⓘ                                   │
│ ┌─────────────────────────────────────────┐│
│ │ p=MIGfMA[...]wIDAQAB                    ││
│ └─────────────────────────────────────────┘│
│                                             │
│  [Add record]              [Cancel]        │
└─────────────────────────────────────────────┘
```

### Pour SPF (Exemple)

```
┌─────────────────────────────────────────────┐
│ Create new record                      [X]  │
├─────────────────────────────────────────────┤
│                                             │
│ Name ⓘ                                     │
│ ┌─────────────────────────────────────────┐│
│ │ (laissez vide ou @)                     ││
│ └─────────────────────────────────────────┘│
│                                             │
│ TTL * ⓘ                                    │
│ ┌─────────────────────────────────────────┐│
│ │ 86400                                   ││
│ └─────────────────────────────────────────┘│
│                                             │
│ Type * ⓘ                                   │
│ ┌─────────────────────────────────────────┐│
│ │ TXT                              [▼]    ││
│ └─────────────────────────────────────────┘│
│                                             │
│ Data * ⓘ                                   │
│ ┌─────────────────────────────────────────┐│
│ │ v=spf1 include:resend.com ~all          ││
│ └─────────────────────────────────────────┘│
│                                             │
│  [Add record]              [Cancel]        │
└─────────────────────────────────────────────┘
```

### Pour DMARC (Exemple)

```
┌─────────────────────────────────────────────┐
│ Create new record                      [X]  │
├─────────────────────────────────────────────┤
│                                             │
│ Name ⓘ                                     │
│ ┌─────────────────────────────────────────┐│
│ │ _dmarc                                  ││
│ └─────────────────────────────────────────┘│
│                                             │
│ TTL * ⓘ                                    │
│ ┌─────────────────────────────────────────┐│
│ │ 86400                                   ││
│ └─────────────────────────────────────────┘│
│                                             │
│ Type * ⓘ                                   │
│ ┌─────────────────────────────────────────┐│
│ │ TXT                              [▼]    ││
│ └─────────────────────────────────────────┘│
│                                             │
│ Data * ⓘ                                   │
│ ┌─────────────────────────────────────────┐│
│ │ v=DMARC1; p=none; rua=mailto:dmarc@...  ││
│ └─────────────────────────────────────────┘│
│                                             │
│  [Add record]              [Cancel]        │
└─────────────────────────────────────────────┘
```

---

## ✅ Vérification Après Ajout

### 1. Vérifier dans Contabo

Après avoir ajouté les 3 enregistrements, vous devriez voir dans votre liste DNS :

```
Type    Name                    Content                         TTL
────────────────────────────────────────────────────────────────────
TXT     @                       v=spf1 include:resend.com...    86400
TXT     resend._domainkey       p=MIGfMA[...]wIDAQAB            86400
TXT     _dmarc                  v=DMARC1; p=none; rua=...      86400
```

### 2. Attendre la Propagation

⏱️ **Temps d'attente** : 10 minutes à 2 heures (généralement 30 minutes)

### 3. Vérifier avec nslookup

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
resend._domainkey.cooldigital.africa text = "p=MIGfMA[...]wIDAQAB"
_dmarc.cooldigital.africa text = "v=DMARC1; p=none; rua=mailto:dmarc@cooldigital.africa"
```

### 4. Vérifier dans Resend

1. Allez sur **https://resend.com/domains**
2. Trouvez **cooldigital.africa**
3. Cliquez sur **"Verify"**
4. Le statut devrait passer à **"Verified"** ✅

---

## 🎯 Checklist Complète

### Étape 1 : Ajouter les DNS dans Contabo

- [ ] **Enregistrement DKIM ajouté**
  - Name : `resend._domainkey`
  - Type : `TXT`
  - Data : `p=MIGfMA[...]wIDAQAB` (valeur complète depuis Resend)

- [ ] **Enregistrement SPF ajouté**
  - Name : (vide ou `@`)
  - Type : `TXT`
  - Data : `v=spf1 include:resend.com ~all`

- [ ] **Enregistrement DMARC ajouté**
  - Name : `_dmarc`
  - Type : `TXT`
  - Data : `v=DMARC1; p=none; rua=mailto:dmarc@cooldigital.africa`

### Étape 2 : Vérification

- [ ] Les 3 enregistrements sont visibles dans la liste DNS Contabo
- [ ] Attente de 30 minutes minimum
- [ ] Vérification avec `nslookup` réussie
- [ ] Domaine vérifié dans Resend (statut "Verified")

### Étape 3 : Configuration SmartPOS

- [ ] Exécution de `.\update-email-config.ps1`
- [ ] Application redémarrée
- [ ] Email de test envoyé et reçu

---

## 🐛 Problèmes Courants avec Contabo

### Problème 1 : "Record already exists"

**Cause** : Un enregistrement similaire existe déjà

**Solution** :
1. Vérifiez la liste des enregistrements existants
2. Supprimez les doublons
3. Ajoutez le nouvel enregistrement

### Problème 2 : Le champ "Name" n'accepte pas "@"

**Solution** : Laissez le champ "Name" complètement vide pour l'enregistrement SPF

### Problème 3 : La valeur DKIM est trop longue

**Solution** : 
- Copiez la valeur complète depuis Resend
- Collez-la dans le champ "Data"
- Contabo devrait accepter les longues chaînes

### Problème 4 : Les DNS ne se propagent pas

**Solutions** :
1. Attendez jusqu'à 2 heures
2. Vérifiez qu'il n'y a pas de doublons
3. Vérifiez que le TTL est correct (86400)
4. Contactez le support Contabo si nécessaire

---

## 📞 Support

### Contabo
- **Support** : https://contabo.com/support/
- **Documentation DNS** : https://docs.contabo.com/

### Resend
- **Domaines** : https://resend.com/domains
- **Support** : support@resend.com
- **Documentation** : https://resend.com/docs

---

## 🎉 Après Configuration

Une fois les 3 enregistrements ajoutés et le domaine vérifié :

1. **Mettez à jour SmartPOS** :
   ```powershell
   .\update-email-config.ps1
   ```

2. **Redémarrez l'application** :
   ```bash
   cd frontend && npm run dev
   cd backend && npm run dev
   ```

3. **Testez** :
   - Ouvrez `test-resend-config.html`
   - Envoyez un email de test
   - Vérifiez la réception

---

## 📊 Récapitulatif des Valeurs

Pour référence rapide :

| Enregistrement | Name | Type | Data |
|----------------|------|------|------|
| **SPF** | (vide ou @) | TXT | `v=spf1 include:resend.com ~all` |
| **DKIM** | `resend._domainkey` | TXT | `p=MIGfMA[...]wIDAQAB` (depuis Resend) |
| **DMARC** | `_dmarc` | TXT | `v=DMARC1; p=none; rua=mailto:dmarc@cooldigital.africa` |

**TTL pour tous** : `86400` (24 heures)

---

**Domaine** : cooldigital.africa  
**Hébergeur DNS** : Contabo  
**Provider Email** : Resend  
**Date** : 7 février 2026

---

## 💡 Conseil Final

Prenez votre temps pour copier-coller les valeurs exactement comme indiqué. Une seule erreur de caractère peut empêcher la vérification du domaine. Si vous avez un doute, vérifiez deux fois avant de cliquer sur "Add record" !

Bonne configuration ! 🚀
