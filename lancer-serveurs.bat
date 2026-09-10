@echo off
title Anouan Express - Demarrage Serveur Web & API
echo ========================================================
echo   DEMARRAGE DU BACKEND & DU SITE WEB ANOUAN EXPRESS
echo ========================================================
echo.
echo Adresse IP active sur votre Wi-Fi : 192.168.11.40
echo.
echo [1/2] Demarrage du Backend API sur le port 5000...
start "Anouan Express - API Backend" cmd /k "cd /d c:\Users\hp\Documents\Anouan Express\anouan-express-api && npm run dev"

timeout /t 3 /nobreak >nul

echo [2/2] Demarrage du Frontend Web sur le port 3000...
start "Anouan Express - Web Frontend" cmd /k "cd /d c:\Users\hp\Documents\Anouan Express\anouan-express-web && npm run dev"

echo.
echo ========================================================
echo   TOUT EST LANCE ET SYNCHRONISE !
echo.
echo  - Acces PC (Web) : http://localhost:3000
echo  - Acces Mobile   : Application AnouanExpress sur telephone
echo                     ou navigateur sur http://192.168.11.40:3000
echo.
echo  * Si l'APK n'arrive pas a joindre le PC, faites un clic droit
echo    sur "debloquer-firewall.bat" -> "Executer en tant qu'administrateur".
echo ========================================================
echo.
pause
