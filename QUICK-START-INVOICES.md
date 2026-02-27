# 🚀 Démarrage Rapide - Système de Facturation

## 3 Étapes pour Tester le Système

---

## ✅ Étape 1: Démarrer le Backend (REQUIS)

Ouvrez un terminal et exécutez:

```bash
cd backend
npm run dev
```

**Attendez ce message:**
```
✅ Connexion à PostgreSQL réussie
🚀 Serveur démarré sur le port 5000
```

---

## ✅ Étape 2: Vérifier que Tout Fonctionne

Dans un autre terminal:

```bash
curl http://localhost:5000/api/health
```

**Vous devriez voir:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "..."
}
```

✅ Si vous voyez ce message, le système est prêt!

---

## ✅ Étape 3: Tester la Création de Facture

### Option A: Via l'Interface Web

1. Ouvrez votre navigateur sur `http://localhost:3000`
2. Connectez-vous à l'application
3. Accédez à la page de test des factures
4. Cliquez sur "Tester Facture" ou "Tester Reçu"

### Option B: Via API (Test Rapide)

```bash
curl -X POST http://localhost:5000/api/invoices \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: 1" \
  -H "x-user-id: 1" \
  -d '{
    "documentType": "invoice",
    "invoiceType": "B2C",
    "documentSubtype": "standard",
    "customerData": {
      "name": "Jean Kouassi",
      "phone": "+225 01 02 03 04 05",
      "email": "jean@example.com"
    },
    "paymentMethod": "Espèces",
    "items": [{
      "productId": 1,
      "variantId": 1,
      "quantity": 1,
      "unitPriceHT": 10000,
      "discountPercent": 0,
      "tvaRate": 18
    }]
  }'
```

**Réponse attendue:**
```json
{
  "success": true,
  "invoice": {
    "id": "...",
    "invoiceNumber": "2026-00001",
    "pdfUrl": "/api/invoices/.../pdf",
    "csvUrl": "/api/invoices/.../csv"
  }
}
```

---

## 🎯 Scénarios de Test Rapides

### Test 1: Facture B2B Simple
- Type: B2B - Entreprise
- Client: "Entreprise Test SARL"
- NCC: "CI-ABJ-2024-A-12345"
- 1 article à 10 000 FCFA, TVA 18%
- **Résultat:** Facture 2026-00001.pdf

### Test 2: Reçu avec Timbre
- Type: B2C - Particulier
- Client: "Jean Kouassi"
- Paiement: **Espèces**
- 1 article à 8 000 FCFA, TVA 18%
- **Résultat:** Timbre de 100 FCFA ajouté automatiquement

### Test 3: Avoir (Crédit)
- Type de document: **Avoir**
- Type: B2B
- **Résultat:** Numéro A-2026-00001

### Test 4: Proforma
- Type de document: **Proforma**
- Type: B2C
- **Résultat:** Numéro P-2026-00001

---

## 📁 Où Trouver les Fichiers Générés?

Les PDF et CSV sont dans:
```
backend/uploads/invoices/{tenantId}/{année}/
```

Exemple:
```
backend/uploads/invoices/1/2026/
├── 2026-00001.pdf
├── 2026-00001.csv
├── A-2026-00001.pdf
└── P-2026-00001.pdf
```

---

## 🐛 Problèmes Courants

### "Cannot connect to backend"
❌ **Problème:** Backend non démarré
✅ **Solution:** `cd backend && npm run dev`

### "ERR_CONNECTION_REFUSED"
❌ **Problème:** Backend pas accessible
✅ **Solution:** Vérifier que le port 5000 est libre

### "Table does not exist"
❌ **Problème:** Migration non exécutée
✅ **Solution:** Exécuter `database/migrations/001_add_invoice_system.sql`

---

## 📖 Documentation Complète

Pour plus de détails, consultez:

1. **INVOICE-SYSTEM-READY.md** - Vue d'ensemble complète
2. **GUIDE-TEST-FACTURES.md** - Guide de test détaillé
3. **backend/INVOICE-SYSTEM-README.md** - Documentation API

---

## ✅ Checklist Rapide

Avant de tester:
- [ ] Backend démarré (`npm run dev`)
- [ ] Health check OK (`curl http://localhost:5000/api/health`)
- [ ] Migration SQL exécutée
- [ ] Frontend accessible (`http://localhost:3000`)

---

**C'est tout! Le système est prêt à l'emploi. 🎉**
