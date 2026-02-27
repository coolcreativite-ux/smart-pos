# 🧪 Test Rapide - Enregistrement des Produits

## Test en 3 Minutes

---

## ✅ Étape 1: Vérifier que le Backend Fonctionne

```bash
# Vérifier que le backend est démarré
curl http://localhost:5000/api/health
```

**Réponse attendue:**
```json
{"status":"healthy","database":"connected"}
```

Si le backend n'est pas démarré:
```bash
cd backend
npm run dev
```

---

## ✅ Étape 2: Ajouter un Produit de Test

1. **Ouvrir l'application** dans le navigateur (`http://localhost:3000`)

2. **Se connecter** avec votre compte

3. **Aller dans "Gestion des Produits"**

4. **Cliquer sur "Ajouter un produit"**

5. **Remplir le formulaire:**
   - Nom: `Produit Test DB`
   - Catégorie: `Test`
   - Prix: `1000`
   - Description: `Test d'enregistrement en base`

6. **Cliquer sur "Ajouter le produit"**

7. **Ouvrir la console du navigateur (F12)**

**Vous devriez voir:**
```
📦 Ajout produit via API: {...}
✅ Produit créé dans la base de données: {id: X, name: "Produit Test DB", ...}
✅ X produits chargés depuis l'API
```

---

## ✅ Étape 3: Vérifier la Persistance

### Test A: Rafraîchir la Page

1. **Appuyer sur F5** pour rafraîchir la page

2. **Vérifier que le produit "Produit Test DB" est toujours là**

3. **Ouvrir la console (F12)**

**Vous devriez voir:**
```
✅ Produits chargés depuis l'API: X
```

✅ **Si le produit est toujours là, c'est qu'il est bien enregistré en base!**

### Test B: Vérifier dans la Base de Données

Si vous avez accès à PostgreSQL:

```sql
-- Voir les derniers produits ajoutés
SELECT id, name, category, tenant_id, created_at 
FROM products 
ORDER BY created_at DESC 
LIMIT 5;
```

**Vous devriez voir votre produit "Produit Test DB"**

---

## ✅ Étape 4: Vérifier les Variantes

Si votre produit a des variantes:

```sql
-- Voir les variantes du dernier produit
SELECT pv.id, pv.selected_options, pv.price, pv.sku, p.name
FROM product_variants pv
JOIN products p ON p.id = pv.product_id
ORDER BY pv.id DESC
LIMIT 10;
```

---

## 🎯 RÉSULTAT ATTENDU

### ✅ Succès
- Le produit apparaît dans la liste
- Le produit reste après rafraîchissement (F5)
- Le produit est visible dans la base de données
- La console affiche "✅ Produit créé dans la base de données"

### ❌ Échec
Si le produit disparaît après F5:
- Le backend n'est peut-être pas démarré
- Vérifier les logs de la console (F12)
- Vérifier les logs du backend

---

## 🐛 DÉPANNAGE RAPIDE

### Erreur: "Cannot connect to backend"
```bash
# Démarrer le backend
cd backend
npm run dev
```

### Erreur: "Table does not exist"
```sql
-- Vérifier que les tables existent
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('products', 'product_variants');
```

### Produit créé mais pas visible
```sql
-- Vérifier le tenant_id
SELECT id, name, tenant_id FROM products ORDER BY id DESC LIMIT 5;
```

---

## 📊 LOGS À SURVEILLER

### Console Navigateur (F12)
```
📦 Ajout produit via API: {...}          ← Envoi au backend
✅ Produit créé dans la base: {...}      ← Réponse du backend
✅ X produits chargés depuis l'API       ← Rechargement
```

### Console Backend
```
📦 Création produit: {...}               ← Réception de la requête
✅ Produit créé: X                       ← Insertion réussie
✅ X variantes créées                    ← Variantes créées
```

---

## ✅ CHECKLIST

- [ ] Backend démarré et accessible
- [ ] Produit ajouté via l'interface
- [ ] Message "✅ Produit créé" dans la console
- [ ] Produit visible dans la liste
- [ ] Produit reste après F5
- [ ] Produit visible dans la base de données

---

**Si tous les tests passent, le problème est résolu! 🎉**
