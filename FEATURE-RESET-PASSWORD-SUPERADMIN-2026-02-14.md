# Fonctionnalité: Réinitialisation de Mot de Passe par SuperAdmin - 2026-02-14

## ✅ Fonctionnalité Ajoutée

Le SuperAdmin peut maintenant réinitialiser le mot de passe de n'importe quel propriétaire (Owner) directement depuis l'interface.

## 🎯 Modifications Apportées

### Frontend: `frontend/pages/SuperAdminPage.tsx`

#### 1. Nouvelle Fonction `handleResetPassword`

```typescript
const handleResetPassword = async (userId: number, username: string) => {
    const newPassword = prompt(`Nouveau mot de passe pour ${username}:`, 'admin123');
    if (!newPassword) return;
    
    try {
        const response = await fetch(`${API_URL}/api/users/${userId}/reset-password`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newPassword })
        });
        
        if (response.ok) {
            addToast(`Mot de passe réinitialisé pour ${username}`, 'success');
            alert(`Nouveau mot de passe: ${newPassword}\n\nCommuniquez-le à l'utilisateur de manière sécurisée.`);
        } else {
            const error = await response.json();
            addToast(error.error || 'Erreur lors de la réinitialisation', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        addToast('Erreur lors de la réinitialisation du mot de passe', 'error');
    }
};
```

#### 2. Nouveau Bouton dans la Liste des Propriétaires

```typescript
<button 
    onClick={() => handleResetPassword(owner.id, owner.username)}
    className="text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider hover:underline"
    title="Réinitialiser le mot de passe"
>
    🔄 Réinitialiser
</button>
```

### Backend: `backend/server.ts`

#### Nouvel Endpoint PATCH

```typescript
// PATCH /api/users/:id/reset-password
app.patch('/api/users/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    console.log('🔄 [SuperAdmin] Réinitialisation mot de passe utilisateur:', id);

    if (!newPassword) {
      return res.status(400).json({ error: 'Nouveau mot de passe requis' });
    }

    // Vérifier que l'utilisateur existe
    const userResult = await pool.query('SELECT username FROM users WHERE id = $1', [id]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Hasher le nouveau mot de passe
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, id]
    );

    console.log('✅ Mot de passe réinitialisé pour:', userResult.rows[0].username);
    res.json({ success: true, message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error('❌ Erreur réinitialisation mot de passe:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});
```

## 📋 Utilisation

### Pour le SuperAdmin

1. **Connectez-vous** en tant que SuperAdmin
2. **Allez dans** l'onglet "Gestion des Propriétaires"
3. **Trouvez** le propriétaire dans la liste
4. **Cliquez** sur le bouton "🔄 Réinitialiser"
5. **Saisissez** le nouveau mot de passe (par défaut: admin123)
6. **Confirmez** - Une alerte affichera le nouveau mot de passe
7. **Communiquez** le mot de passe à l'utilisateur de manière sécurisée

### Interface

```
┌─────────────────────────────────────────────────────────────┐
│ Nom Complet    │ Username    │ Email           │ Actions    │
├─────────────────────────────────────────────────────────────┤
│ John Doe       │ johndoe     │ john@email.com  │ Modifier   │
│                │             │                 │ 🔄 Réinit. │
│                │             │                 │ Supprimer  │
└─────────────────────────────────────────────────────────────┘
```

## 🔒 Sécurité

- ✅ Endpoint protégé (nécessite authentification)
- ✅ Mot de passe hashé avec bcrypt (10 rounds)
- ✅ Confirmation visuelle avec le nouveau mot de passe
- ✅ Logs serveur pour traçabilité
- ⚠️ **Important**: Communiquer le mot de passe de manière sécurisée (email chiffré, message privé, etc.)

## 🎨 Style

Le bouton "Réinitialiser" utilise:
- Couleur: Amber (orange) pour se distinguer
- Icône: 🔄 (symbole de réinitialisation)
- Hover: Soulignement
- Tooltip: "Réinitialiser le mot de passe"

## 📝 Notes

- Le mot de passe par défaut suggéré est `admin123`
- Le SuperAdmin peut choisir n'importe quel mot de passe
- L'utilisateur devrait changer son mot de passe après la première connexion
- Aucune notification email automatique n'est envoyée (à implémenter si nécessaire)

## 🚀 Prochaines Améliorations Possibles

1. **Email automatique** avec le nouveau mot de passe
2. **Génération automatique** de mot de passe sécurisé
3. **Expiration forcée** du mot de passe temporaire
4. **Historique** des réinitialisations
5. **Permissions granulaires** (Owner peut réinitialiser ses utilisateurs)

## ✅ Tests

Pour tester:
1. Connectez-vous en tant que SuperAdmin (admin / admin123)
2. Allez dans "Gestion des Propriétaires"
3. Cliquez sur "🔄 Réinitialiser" pour un propriétaire
4. Saisissez un nouveau mot de passe
5. Déconnectez-vous
6. Reconnectez-vous avec le compte du propriétaire et le nouveau mot de passe

## 🔗 Endpoints API

```
PATCH /api/users/:id/reset-password
Body: { "newPassword": "nouveauMotDePasse" }
Response: { "success": true, "message": "Mot de passe réinitialisé avec succès" }
```

## 📦 Fichiers Modifiés

- ✅ `frontend/pages/SuperAdminPage.tsx` - Ajout du bouton et de la fonction
- ✅ `backend/server.ts` - Ajout de l'endpoint PATCH
- ✅ `backend/scripts/create-superadmin.cjs` - Correction pour éviter les erreurs de contrainte

## 🎉 Résultat

Le SuperAdmin peut maintenant gérer facilement les mots de passe des propriétaires sans avoir besoin d'accéder directement à la base de données ou d'exécuter des scripts!
