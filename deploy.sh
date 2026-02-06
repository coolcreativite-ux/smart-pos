#!/bin/bash

echo "🚀 Déploiement Smart POS"
echo ""

# Vérifier si on est dans le bon répertoire
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Erreur: Exécutez ce script depuis la racine du projet"
    exit 1
fi

# Demander quelle partie déployer
echo "Que voulez-vous déployer?"
echo "1) Frontend uniquement"
echo "2) Backend uniquement"
echo "3) Les deux"
read -p "Choix (1-3): " choice

case $choice in
    1)
        echo "📦 Construction du frontend..."
        cd frontend
        npm run build
        echo "✅ Frontend prêt pour le déploiement"
        ;;
    2)
        echo "📦 Construction du backend..."
        cd backend
        npm run build
        echo "✅ Backend prêt pour le déploiement"
        ;;
    3)
        echo "📦 Construction du frontend..."
        cd frontend
        npm run build
        cd ..
        echo "📦 Construction du backend..."
        cd backend
        npm run build
        cd ..
        echo "✅ Tout est prêt pour le déploiement"
        ;;
    *)
        echo "❌ Choix invalide"
        exit 1
        ;;
esac

echo ""
echo "🎉 Déploiement terminé!"
