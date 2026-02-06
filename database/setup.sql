-- Script de création de la base de données de développement
-- Exécuter avec: psql -U postgres -d postgres -f database/setup.sql

-- Créer la base de données de développement
DROP DATABASE IF EXISTS gemini_pos_dev;
CREATE DATABASE gemini_pos_dev;

-- Se connecter à la nouvelle base de données
\c gemini_pos_dev;

-- Le schéma sera appliqué séparément avec schema.sql