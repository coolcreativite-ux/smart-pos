@echo off
echo ========================================
echo   LANCEMENT DE L'APPLICATION
echo ========================================
echo.

echo Demarrage du Backend...
start "Backend Server" cmd /k "cd backend && npm run dev"
timeout /t 3 >nul

echo Demarrage du Frontend...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   APPLICATION DEMARREE !
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Pour arreter: Fermez les fenetres CMD ouvertes
echo.
pause
