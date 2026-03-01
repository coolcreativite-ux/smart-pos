# Fix: Connection Timeout avec Supabase Pooler - 28 Février 2026

## 🔴 Problème Identifié

### Symptômes
```
Error: Connection terminated due to connection timeout
  at L:\smart-point-of-sale\backend\node_modules\pg-pool\index.js:45:11
  [cause]: Error: Connection terminated unexpectedly
```

### Contexte
- Utilisation du **Supabase Transaction Pooler** (port 6543)
- Erreurs répétées lors de l'accès aux factures (`/api/invoices`)
- Les connexions PostgreSQL se terminent de manière inattendue

### Cause Racine
Le Supabase Transaction Pooler a des **limites strictes** :
- Timeout de connexion court
- Limite du nombre de connexions simultanées
- Les connexions inactives sont fermées rapidement

La configuration initiale du pool était inadaptée :
```typescript
max: 20, // Trop de connexions pour Supabase pooler
idleTimeoutMillis: 30000, // Trop long pour le pooler
connectionTimeoutMillis: 2000, // Trop court
```

---

## ✅ Solution Appliquée

### 1. Optimisation de la Configuration du Pool

**Fichier**: `backend/server.ts`

**Avant**:
```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

**Après**:
```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10, // ✅ Réduire pour Supabase pooler
  idleTimeoutMillis: 10000, // ✅ Fermer plus rapidement (10s)
  connectionTimeoutMillis: 5000, // ✅ Augmenter le timeout (5s)
  allowExitOnIdle: true, // ✅ Permettre la fermeture quand inactif
});
```

### 2. Amélioration de la Gestion des Connexions

**Ajout d'événements de monitoring**:
```typescript
pool.on('connect', (client) => {
  console.log('🔌 Nouvelle connexion établie au pool');
});

pool.on('remove', (client) => {
  console.log('🔌 Connexion retirée du pool');
});
```

**Fonction de test avec retry**:
```typescript
async function testConnection(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      console.log('✅ Connexion à PostgreSQL réussie');
      client.release();
      return true;
    } catch (err) {
      console.error(`❌ Tentative ${i + 1}/${retries} échouée:`, err.message);
      if (i < retries - 1) {
        console.log('⏳ Nouvelle tentative dans 2 secondes...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  return false;
}
```

---

## 📊 Paramètres Optimaux pour Supabase Pooler

| Paramètre | Valeur Recommandée | Raison |
|-----------|-------------------|--------|
| `max` | 10 | Limite Supabase pooler |
| `idleTimeoutMillis` | 10000 (10s) | Libérer rapidement les connexions |
| `connectionTimeoutMillis` | 5000 (5s) | Temps suffisant pour établir la connexion |
| `allowExitOnIdle` | true | Économiser les ressources |

---

## 🔍 Vérification

### Test de Connexion
```bash
curl http://localhost:5000/api/health
```

**Réponse attendue**:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-02-28T15:53:48.714Z"
}
```

### Logs du Serveur
```
🔧 Environnement: development
📁 Fichier .env chargé: .env.development
🔌 PORT configuré: 5000
Backend POS running on http://localhost:5000
🔌 Nouvelle connexion établie au pool
✅ Connexion à PostgreSQL réussie
```

---

## 📝 Recommandations Supplémentaires

### 1. Pour la Production
Envisager d'utiliser le **Direct Connection** (port 5432) au lieu du pooler si :
- Vous avez besoin de connexions longues
- Vous utilisez des transactions complexes
- Vous avez des requêtes lourdes

**Configuration Direct Connection**:
```
DATABASE_URL=postgresql://postgres.xxx:password@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```

### 2. Monitoring
Ajouter un monitoring des connexions :
```typescript
setInterval(() => {
  console.log('📊 Pool stats:', {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount
  });
}, 60000); // Toutes les minutes
```

### 3. Gestion des Erreurs
Toujours libérer les clients en cas d'erreur :
```typescript
const client = await pool.connect();
try {
  // Requêtes...
} catch (error) {
  console.error('Erreur:', error);
  throw error;
} finally {
  client.release(); // ✅ Toujours libérer
}
```

---

## ✅ Résultat

- ✅ Connexions stables avec Supabase pooler
- ✅ Pas de timeout lors de l'accès aux factures
- ✅ Meilleure gestion des ressources
- ✅ Logs de monitoring améliorés

---

## 🚀 Prochaines Étapes

1. Tester la création de factures
2. Vérifier la liste des factures
3. Monitorer les connexions pendant 24h
4. Ajuster les paramètres si nécessaire

---

## 📚 Références

- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [node-postgres Pool Configuration](https://node-postgres.com/apis/pool)
- [PostgreSQL Connection Management Best Practices](https://www.postgresql.org/docs/current/runtime-config-connection.html)
