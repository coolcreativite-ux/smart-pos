# Guide d'Installation - Smart Point of Sale

## Prérequis
- Node.js (v18+)
- PostgreSQL (v13+) pour le développement
- Compte Supabase pour la production

## Installation

### 1. Cloner et installer les dépendances
```bash
npm install
```

### 2. Configuration de l'environnement de développement

#### A. Installer PostgreSQL
1. Télécharger depuis https://www.postgresql.org/download/windows/
2. Installer avec les paramètres par défaut
3. Noter le mot de passe de l'utilisateur `postgres`

#### B. Configurer les variables d'environnement
1. Copier le contenu de `.env.development` dans `.env.local`
2. Remplacer `votre_mot_de_passe_postgres` par votre mot de passe PostgreSQL

#### C. Créer la base de données
```bash
# Créer la base de données
npm run db:setup

# Appliquer le schéma
npm run db:schema
```

### 3. Démarrer l'environnement de développement

#### Terminal 1 - Frontend
```bash
npm run dev
```

#### Terminal 2 - Backend API
```bash
npm run dev:server
```

L'application sera accessible sur http://localhost:3000

## Configuration de production (Supabase)

### 1. Créer un projet Supabase
1. Aller sur https://supabase.com
2. Créer un nouveau projet
3. Noter l'URL et les clés API

### 2. Configurer les variables d'environnement
1. Copier le contenu de `.env.production` dans `.env.local`
2. Remplacer les valeurs Supabase par vos vraies valeurs

### 3. Appliquer le schéma sur Supabase
1. Aller dans l'éditeur SQL de Supabase
2. Copier le contenu de `database/schema.sql`
3. Exécuter le script

## Comptes par défaut
- **SuperAdmin**: admin / admin123

## Structure des environnements
- **Développement**: PostgreSQL local + serveur Express
- **Production**: Supabase (PostgreSQL cloud)

## Commandes utiles
```bash
npm run dev          # Démarrer le frontend
npm run dev:server   # Démarrer le backend local
npm run build        # Build de production
npm run db:setup     # Créer la base de données
npm run db:schema    # Appliquer le schéma
```