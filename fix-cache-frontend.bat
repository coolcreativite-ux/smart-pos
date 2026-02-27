@echo off
echo ========================================
echo Nettoyage du cache frontend
echo ========================================
echo.

cd frontend

echo Suppression du cache Vite...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo Cache Vite supprime
) else (
    echo Pas de cache Vite a supprimer
)

echo.
echo Suppression du dossier dist...
if exist "dist" (
    rmdir /s /q "dist"
    echo Dossier dist supprime
) else (
    echo Pas de dossier dist a supprimer
)

echo.
echo ========================================
echo Nettoyage termine!
echo ========================================
echo.
echo Demarrage du serveur...
echo.

npm run dev

cd ..
