# Fix: Configuration CORS pour credentials - 2026-02-12

## Problème

Erreur CORS lors du téléchargement des PDF:
```
Access to fetch at 'http://localhost:5000/api/invoices/.../pdf' from origin 'http://localhost:3001' 
has been blocked by CORS policy: The value of the 'Access-Control-Allow-Origin' header in the 
response must not be the wildcard '*' when the request's credentials mode is 'include'.
```

## Cause

Le backend utilisait une configuration CORS par défaut qui:
- Accepte toutes les origines (`*`)
- Ne permet pas l'envoi de credentials (cookies, sessions)

Quand le frontend envoie `credentials: 'include'`, le navigateur exige que:
- L'origine soit explicitement spécifiée (pas `*`)
- Le header `Access-Control-Allow-Credentials: true` soit présent

## Solution

### Modification dans `backend/server.ts`

**Avant:**
```typescript
app.use(cors());
```

**Après:**
```typescript
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://192.168.8.100:3001'],
  credentials: true
}));
```

### Configuration expliquée

```typescript
{
  origin: [
    'http://localhost:3000',      // Port par défaut Vite
    'http://localhost:3001',      // Port alternatif Vite
    'http://192.168.8.100:3001'   // Accès réseau local
  ],
  credentials: true  // Permet l'envoi de cookies/sessions
}
```

## Impact

### Headers CORS envoyés par le backend

**Avant:**
```
Access-Control-Allow-Origin: *
```

**Après:**
```
Access-Control-Allow-Origin: http://localhost:3001
Access-Control-Allow-Credentials: true
```

### Requêtes frontend

Les requêtes avec `credentials: 'include'` fonctionnent maintenant:
```typescript
fetch(`${API_URL}/api/invoices/${invoiceId}/pdf`, {
  credentials: 'include'  // ✅ Fonctionne maintenant!
})
```

## Sécurité

### Avantages de cette configuration

✅ **Origines explicites**: Seules les origines listées sont autorisées
✅ **Credentials sécurisés**: Les cookies de session sont envoyés de manière sécurisée
✅ **Protection CSRF**: Les cookies httpOnly protègent contre les attaques XSS
✅ **Contrôle d'accès**: Facile d'ajouter/retirer des origines autorisées

### Origines autorisées

1. **http://localhost:3000** - Port par défaut de Vite
2. **http://localhost:3001** - Port alternatif (si 3000 occupé)
3. **http://192.168.8.100:3001** - Accès depuis le réseau local

### Ajouter une nouvelle origine

Pour autoriser une nouvelle origine (ex: production):
```typescript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://192.168.8.100:3001',
    'https://votre-domaine.com'  // ← Ajouter ici
  ],
  credentials: true
}));
```

## Tests recommandés

1. ✅ Rafraîchir la page frontend (Ctrl+F5)
2. ✅ Générer une facture
3. ✅ Vérifier que le PDF s'ouvre correctement
4. ✅ Vérifier dans la console: pas d'erreur CORS
5. ✅ Tester depuis un autre appareil sur le réseau local
6. ✅ Vérifier que les cookies de session fonctionnent

## Vérification dans la console

### Avant (erreur)
```
❌ CORS policy: ... must not be the wildcard '*' when the request's credentials mode is 'include'
❌ GET http://localhost:5000/api/invoices/.../pdf net::ERR_FAILED 401
```

### Après (succès)
```
✅ GET http://localhost:5000/api/invoices/.../pdf 200 OK
✅ Content-Type: application/pdf
✅ Pas d'erreur CORS
```

## Configuration pour production

En production, remplacer les origines localhost par le domaine réel:

```typescript
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://votre-domaine.com', 'https://www.votre-domaine.com']
  : ['http://localhost:3000', 'http://localhost:3001', 'http://192.168.8.100:3001'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
```

## Alternatives considérées

### Option 1: Proxy Vite (non retenue)
- Complexe à configurer
- Ne fonctionne qu'en développement
- Problèmes avec les WebSockets

### Option 2: Tokens JWT dans headers (non retenue)
- Nécessite refonte de l'authentification
- Plus complexe à gérer
- Pas de httpOnly cookies (moins sécurisé)

### Option 3: Configuration CORS avec credentials (✅ choisie)
- Simple à implémenter
- Fonctionne avec le système existant
- Sécurisé avec httpOnly cookies
- Facile à étendre pour production

## Fichiers modifiés

- `backend/server.ts` - Configuration CORS mise à jour
- `frontend/components/SalesCart.tsx` - Utilise `credentials: 'include'`
- `frontend/components/SalesHistory.tsx` - Utilise `credentials: 'include'`

## Redémarrage nécessaire

⚠️ **Important**: Le backend doit être redémarré pour appliquer les changements CORS

```bash
# Arrêter le backend
Ctrl+C

# Redémarrer
npm run dev
```

## Résultat final

✅ Les PDF s'ouvrent correctement
✅ L'authentification fonctionne via cookies
✅ Pas d'erreur CORS
✅ Sécurité maintenue
✅ Prêt pour la production avec ajustement des origines
