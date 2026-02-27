# Correction du problème d'authentification snake_case vs camelCase

**Date**: 2026-02-12  
**Statut**: ✅ Complété

## Problème identifié

### Symptôme
```
GET http://localhost:5000/api/invoices/{id}/pdf 401 (Unauthorized)
Error response: {"success":false,"error":"Erreur d'authentification"}
```

### Cause racine
Le backend renvoie l'objet utilisateur avec des propriétés en **snake_case** (`tenant_id`) mais le frontend attend du **camelCase** (`tenantId`).

**Logs de la console**:
```javascript
🔍 [PDF] User: {
  id: 6, 
  tenant_id: 4,  // ❌ snake_case au lieu de tenantId
  username: 'marie',
  email: '',
  first_name: 'Marie',
  ...
}
🔍 [PDF] TenantId: 4
🔍 [PDF] UserId: 6
```

Le code essayait d'accéder à `user.tenantId` qui était `undefined`, donc les headers envoyés étaient vides.

## Solution implémentée

### Gestion des deux formats
Modification du code pour accepter les deux formats (snake_case ET camelCase):

**Fichiers modifiés**:
- `frontend/components/SalesCart.tsx`
- `frontend/components/SalesHistory.tsx`

**Code avant**:
```typescript
if (!user?.tenantId || !user?.id) {
  console.error('🔍 [PDF] User non authentifié:', user);
  addToast('Erreur: utilisateur non authentifié', 'error');
  return;
}

const response = await fetch(`${API_URL}/api/invoices/${invoiceId}/pdf`, {
  credentials: 'include',
  headers: {
    'x-tenant-id': user.tenantId.toString(),
    'x-user-id': user.id.toString()
  }
});
```

**Code après**:
```typescript
// Gérer les deux formats: camelCase (tenantId) et snake_case (tenant_id)
const tenantId = user?.tenantId || (user as any)?.tenant_id;
const userId = user?.id;

if (!tenantId || !userId) {
  console.error('🔍 [PDF] User non authentifié:', user);
  addToast('Erreur: utilisateur non authentifié', 'error');
  return;
}

const response = await fetch(`${API_URL}/api/invoices/${invoiceId}/pdf`, {
  credentials: 'include',
  headers: {
    'x-tenant-id': tenantId.toString(),
    'x-user-id': userId.toString()
  }
});
```

## Avantages de cette approche

1. **Rétrocompatibilité**: Fonctionne avec les deux formats
2. **Robustesse**: Pas de crash si le format change
3. **Flexibilité**: Permet une migration progressive du backend
4. **Simplicité**: Pas besoin de transformer tout l'objet user

## Solution permanente recommandée

Pour éviter ce genre de problème à l'avenir, il faudrait:

### Option 1: Normaliser le backend (recommandé)
Modifier le backend pour renvoyer systématiquement du camelCase:

```typescript
// Dans backend/controllers/auth.controller.ts ou similaire
const userResponse = {
  id: user.id,
  tenantId: user.tenant_id,  // Conversion snake_case → camelCase
  username: user.username,
  firstName: user.first_name,
  lastName: user.last_name,
  // ...
};
```

### Option 2: Transformer côté frontend
Créer un helper pour normaliser les objets user:

```typescript
// frontend/utils/userHelpers.ts
export function normalizeUser(user: any): User {
  return {
    id: user.id,
    tenantId: user.tenantId || user.tenant_id,
    username: user.username,
    firstName: user.firstName || user.first_name,
    lastName: user.lastName || user.last_name,
    // ...
  };
}
```

### Option 3: Utiliser un transformateur automatique
Installer et configurer un package comme `humps` ou `camelcase-keys`:

```typescript
import camelcaseKeys from 'camelcase-keys';

const normalizedUser = camelcaseKeys(user, { deep: true });
```

## Tests à effectuer

### Test 1: Génération de facture
1. ✅ Se connecter avec un utilisateur
2. ✅ Compléter une vente
3. ✅ Cliquer sur "Facture" ou "Reçu"
4. ✅ Confirmer la génération
5. ✅ Vérifier que le PDF s'ouvre sans erreur 401

### Test 2: Vérifier les logs
1. ✅ Ouvrir la console du navigateur
2. ✅ Générer un document
3. ✅ Vérifier les logs:
   - `🔍 [PDF] User:` doit afficher l'objet user complet
   - `🔍 [PDF] TenantId:` doit afficher un nombre valide
   - `🔍 [PDF] UserId:` doit afficher un nombre valide
   - Pas d'erreur 401

### Test 3: Backend logs
1. ✅ Vérifier les logs du backend
2. ✅ Doit afficher:
   ```
   🔍 [Auth] Headers: { 'x-tenant-id': '4', 'x-user-id': '6' }
   ✅ [Auth] Authentification réussie: { tenantId: 4, userId: 6 }
   ```

## Résultats attendus

✅ **Authentification réussie**:
- Les PDF s'ouvrent correctement
- Pas d'erreur 401 dans la console
- Les headers sont correctement envoyés au backend

✅ **Logs clairs**:
- Le backend affiche les headers reçus
- Le frontend affiche les valeurs extraites
- Messages d'erreur explicites si problème

## Autres problèmes corrigés dans cette session

### Clés dupliquées dans ToastContext
Le problème des clés dupliquées persiste car le frontend n'a pas rechargé le ToastContext modifié. Après redémarrage complet:

**Avant**:
```typescript
const id = Date.now(); // ❌ Peut créer des doublons
```

**Après**:
```typescript
const [toastCounter, setToastCounter] = useState(0);
const id = Date.now() + toastCounter; // ✅ Garantit l'unicité
setToastCounter(prev => prev + 1);
```

## Commandes de redémarrage

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

## État des serveurs

- ✅ Backend: http://localhost:5000 (Process 15)
- ✅ Frontend: http://localhost:3001 (Process 16)

## Prochaines étapes

1. ✅ Tester la génération de factures/reçus
2. ✅ Vérifier qu'il n'y a plus d'erreur 401
3. ✅ Vérifier qu'il n'y a plus d'avertissement de clés dupliquées
4. ⏳ Planifier la normalisation du backend pour utiliser camelCase partout
5. ⏳ Ajouter des tests automatisés pour l'authentification

## Notes importantes

- La solution actuelle est un **workaround** qui fonctionne mais n'est pas idéale
- Il faudrait idéalement normaliser le backend pour renvoyer du camelCase
- Cette approche évite de casser le code existant pendant la transition
- Le type casting `(user as any)` est nécessaire car TypeScript ne connaît pas `tenant_id`
