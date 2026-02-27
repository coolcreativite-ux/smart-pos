@echo off
echo ========================================
echo   REDEMARRAGE COMPLET DU FRONTEND
echo ========================================
echo.

cd frontend

echo 1. Arret des processus Node...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul
echo    OK - Processus arretes
echo.

echo 2. Suppression du cache Vite...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite" >nul 2>&1
    echo    OK - Cache Vite supprime
) else (
    echo    OK - Pas de cache a supprimer
)
echo.

echo 3. Suppression du dossier dist...
if exist "dist" (
    rmdir /s /q "dist" >nul 2>&1
    echo    OK - Dossier dist supprime
) else (
    echo    OK - Pas de dossier dist
)
echo.

echo ========================================
echo   NETTOYAGE TERMINE !
echo ========================================
echo.
echo 4. Demarrage du serveur...
echo.
echo IMPORTANT:
echo   - Attendez que le serveur demarre completement
echo   - Puis rafraichissez le navigateur avec Ctrl+Shift+R
echo.

npm run dev

cd ..
