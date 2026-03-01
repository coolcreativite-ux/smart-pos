# Feature: Logo d'Entreprise Persistant

## Date: 2026-02-28

## Problème
Le logo d'entreprise uploadé disparaissait lors du rechargement de la page car il n'était pas inclus dans les données de session utilisateur.

## Solution Implémentée

### 1. Backend - Route de Login (backend/server.ts)
- ✅ Ajout de la récupération des données du tenant lors du login
- ✅ Inclusion du `logo_url` dans les données retournées à l'utilisateur
- ✅ Les données du tenant (incluant le logo) sont maintenant disponibles dans `user.tenant`

```typescript
// Récupérer les données du tenant
const tenantResult = await pool.query(
  'SELECT id, name, ncc, rccm, address, phone, email, logo_url FROM tenants WHERE id = $1',
  [user.tenant_id]
);

const tenant = tenantResult.rows.length > 0 ? tenantResult.rows[0] : null;

// Ajouter tenant aux données utilisateur
const userWithPermissions = {
  ...userWithoutPassword,
  tenantId: user.tenant_id,
  firstName: user.first_name,
  lastName: user.last_name,
  assignedStoreId: user.assigned_store_id,
  permissions,
  tenant: tenant  // ← Nouveau
};
```

### 2. Frontend - Type User (frontend/types.ts)
- ✅ Ajout du champ `tenant` optionnel dans l'interface User
- ✅ Inclut toutes les informations du tenant incluant `logo_url`

```typescript
export interface User {
  id: number;
  tenantId: number;
  username: string;
  email?: string;
  firstName: string;
  lastName: string;
  password?: string;
  role: UserRole;
  permissions: Permissions;
  assignedStoreId?: number;
  tenant?: {  // ← Nouveau
    id: number;
    name: string;
    ncc?: string;
    rccm?: string;
    address?: string;
    phone?: string;
    email?: string;
    logo_url?: string;
  };
}
```

### 3. Backend - Contrôleur Factures (backend/controllers/invoices.controller.ts)
- ✅ Récupération du `logo_url` depuis la table tenants
- ✅ Inclusion du logo dans les données de la facture PDF

```typescript
const companyResult = await client.query(
  `SELECT name, address, ncc, rccm, phone, email, logo_url  // ← Ajout de logo_url
   FROM tenants
   WHERE id = $1`,
  [tenantId]
);

const companyInfo: CompanyInfo = {
  name: companyResult.rows[0]?.name || 'Entreprise',
  address: companyResult.rows[0]?.address || '',
  phone: companyResult.rows[0]?.phone || '',
  email: companyResult.rows[0]?.email || '',
  ncc: companyResult.rows[0]?.ncc || '',
  rccm: companyResult.rows[0]?.rccm || '',
  logoUrl: companyResult.rows[0]?.logo_url || undefined  // ← Changé de undefined fixe
};
```

### 4. Frontend - Modal Paramètres (frontend/components/SettingsModal.tsx)
- ✅ Ajout de l'interface d'upload de logo
- ✅ Prévisualisation du logo en temps réel
- ✅ Fonctions d'upload et de suppression du logo
- ✅ Validation du fichier (type image, max 5MB)

**Nouvelles fonctionnalités:**
- `handleLogoChange`: Gère la sélection du fichier et la prévisualisation
- `handleUploadLogo`: Upload le logo vers le serveur
- `handleRemoveLogo`: Supprime le logo du serveur

**Interface utilisateur:**
- Section dédiée au logo dans "Informations Entreprise"
- Prévisualisation du logo actuel
- Bouton pour choisir une nouvelle image
- Bouton pour uploader (visible uniquement si un fichier est sélectionné)
- Bouton pour supprimer le logo existant

### 5. Backend - Routes Tenants (backend/server.ts)
Routes déjà existantes et fonctionnelles:
- ✅ `POST /api/tenants/:id/upload-logo` - Upload du logo
- ✅ `DELETE /api/tenants/:id/logo` - Suppression du logo
- ✅ `PATCH /api/tenants/:id` - Mise à jour des informations tenant

### 6. Backend - Service PDF (backend/services/PDFGenerationService.ts)
Déjà configuré pour utiliser le logo:
- ✅ Utilise `data.company.logoUrl` pour afficher le logo
- ✅ Gère les erreurs si le logo n'existe pas

## Flux Complet

### Upload du Logo
1. L'utilisateur (Owner/Admin) ouvre les Préférences
2. Dans "Informations Entreprise", il clique sur "Choisir une image"
3. Sélectionne un fichier image (PNG, JPG, max 5MB)
4. Une prévisualisation s'affiche
5. Il clique sur "Uploader"
6. Le fichier est envoyé au serveur via `POST /api/tenants/:id/upload-logo`
7. Le serveur sauvegarde le fichier dans `backend/uploads/logos/`
8. L'URL du logo est stockée dans la table `tenants` (colonne `logo_url`)
9. La page se recharge pour mettre à jour le contexte utilisateur

### Utilisation du Logo
1. Lors du login, les données du tenant (incluant `logo_url`) sont récupérées
2. Ces données sont stockées dans `user.tenant` dans le contexte d'authentification
3. Lors de la génération d'une facture:
   - Le contrôleur récupère `logo_url` depuis la table tenants
   - Le service PDF utilise ce chemin pour inclure le logo dans le document
4. Le logo apparaît sur toutes les factures et reçus

### Persistance
- ✅ Le logo est stocké physiquement sur le serveur dans `backend/uploads/logos/`
- ✅ L'URL est stockée en base de données dans `tenants.logo_url`
- ✅ Les données du tenant (incluant le logo) sont chargées à chaque login
- ✅ Le logo persiste après rechargement de la page

## Fichiers Modifiés

1. `backend/server.ts` - Route de login
2. `frontend/types.ts` - Interface User
3. `backend/controllers/invoices.controller.ts` - Récupération du logo
4. `frontend/components/SettingsModal.tsx` - Interface d'upload

## Fichiers Existants (Non Modifiés)

1. `backend/server.ts` - Routes tenants (upload/delete logo)
2. `backend/services/PDFGenerationService.ts` - Utilisation du logo
3. Base de données - Colonne `tenants.logo_url` déjà existante

## Tests à Effectuer

1. ✅ Upload d'un logo via les Préférences
2. ✅ Vérifier que le logo apparaît dans la prévisualisation
3. ✅ Recharger la page et vérifier que le logo persiste
4. ✅ Générer une facture et vérifier que le logo apparaît dans le PDF
5. ✅ Supprimer le logo et vérifier qu'il disparaît partout
6. ✅ Tester avec différents formats d'image (PNG, JPG)
7. ✅ Tester la validation (fichier trop gros, mauvais format)

## Notes Importantes

- Le logo est visible uniquement pour les utilisateurs Owner et Admin
- Le logo est partagé par tous les utilisateurs du même tenant
- Le serveur sert les fichiers statiques via `/uploads`
- Les anciens logos sont automatiquement supprimés lors de l'upload d'un nouveau
- La taille maximale du fichier est de 5MB
- Formats acceptés: tous les formats image (PNG, JPG, GIF, etc.)

## Prochaines Étapes Possibles

1. Ajouter un crop/resize automatique du logo
2. Optimiser la taille des images uploadées
3. Ajouter un cache pour les logos
4. Permettre différents logos pour différents types de documents
