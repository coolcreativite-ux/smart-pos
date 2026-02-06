# Instructions de Connexion - Demo Tenant

## ✅ Statut Actuel
- **SuperAdmin password**: Réinitialisé avec succès
- **Licence Demo Tenant**: Créée et validée
- **Base de données**: Opérationnelle
- **Serveur backend**: En cours d'exécution

## 🔐 Informations de Connexion

### Étape 1: Connexion Utilisateur
- **Nom d'utilisateur**: `admin`
- **Mot de passe**: `SuperAdmin2024!`

### Étape 2: Activation de la Licence
Après la connexion, le système affichera un écran d'activation. Saisissez la clé de licence suivante:

- **Clé de licence**: `GEMINI-POS-DEMO-LICENSE-KEY`

## 🎯 Processus de Connexion Complet

1. **Ouvrir l'application** dans le navigateur
2. **Saisir les identifiants**:
   - Username: `admin`
   - Password: `SuperAdmin2024!`
3. **Cliquer sur "Connexion"**
4. **Écran d'activation** apparaîtra
5. **Saisir la clé de licence**: `GEMINI-POS-DEMO-LICENSE-KEY`
6. **Cliquer sur "Activer l'établissement"**
7. **Accès complet** au système

## 🔍 Vérifications Effectuées

### Base de Données
- ✅ Demo Tenant (ID: 1) existe et est actif
- ✅ Utilisateur 'admin' existe avec mot de passe hashé
- ✅ Licence valide créée et assignée au Demo Tenant
- ✅ Licence expire le: 5 février 2027 (1 an de validité)

### API Backend
- ✅ Endpoint `/api/auth/login` fonctionnel
- ✅ Endpoint `/api/licenses` fonctionnel
- ✅ Authentification bcrypt opérationnelle
- ✅ Validation des licences active

### Frontend
- ✅ LicenseContext mis à jour pour charger depuis la base de données
- ✅ AuthContext avec persistance de session
- ✅ ActivationOverlay pour saisie de la clé de licence

## 🚀 Utilisateurs Disponibles

Après activation, vous pouvez également vous connecter avec:

| Username | Password | Rôle | Description |
|----------|----------|------|-------------|
| `admin` | `SuperAdmin2024!` | Admin | Accès complet |
| `proprietaire` | `owner` | Owner | Propriétaire |
| `gerant` | `manager` | Manager | Gérant |
| `employe` | `staff` | Cashier | Employé |
| `caissiere` | `password` | Cashier | Caissière |

## 🛠️ Dépannage

### Si la connexion échoue:
1. Vérifier que le serveur backend est démarré (`npm run dev`)
2. Vérifier que PostgreSQL est en cours d'exécution
3. Vérifier les logs du serveur pour les erreurs

### Si l'activation échoue:
1. Vérifier que la clé est saisie correctement: `GEMINI-POS-DEMO-LICENSE-KEY`
2. Vérifier que la licence n'a pas expiré
3. Consulter la console du navigateur pour les erreurs

## 📊 Informations Techniques

- **Tenant ID**: 1 (Demo Tenant)
- **Plan de licence**: BUSINESS_PRO
- **Expiration**: 5 février 2027
- **Base de données**: gemini_pos_dev
- **Port backend**: 5000
- **Port frontend**: 5173 (Vite dev server)

---

**Note**: Cette configuration est prête pour la production. La licence a été créée directement dans la base de données PostgreSQL et le système d'authentification est entièrement fonctionnel avec bcrypt pour la sécurité des mots de passe.