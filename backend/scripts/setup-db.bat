@echo off
echo Configuration de la base de donnees PostgreSQL pour Smart POS
echo.

set PSQL_PATH="C:\Program Files\PostgreSQL\17\bin\psql.exe"

echo Creation de la base de donnees gemini_pos_dev...
%PSQL_PATH% -U postgres -d postgres -c "DROP DATABASE IF EXISTS gemini_pos_dev; CREATE DATABASE gemini_pos_dev;"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Application du schema...
    %PSQL_PATH% -U postgres -d gemini_pos_dev -f database/schema.sql
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ✅ Base de donnees configuree avec succes!
        echo Vous pouvez maintenant demarrer l'application avec: npm run dev
    ) else (
        echo ❌ Erreur lors de l'application du schema
    )
) else (
    echo ❌ Erreur lors de la creation de la base de donnees
)

pause