@echo off
title Debloquer le Firewall Windows pour Anouan Express
echo ========================================================
echo   AUTORISATION DU PORT 5000 ET 3000 DANS LE FIREWALL
echo ========================================================
echo.
echo Ce script autorise les connexions depuis votre telephone (APK)
echo vers le serveur API (port 5000) et le frontend (port 3000).
echo.
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ATTENTION] Ce script doit etre execute en tant qu'Administrateur !
    echo Clic droit sur ce fichier ^> "Executer en tant qu'administrateur".
    echo.
    pause
    exit /b 1
)

echo [1/2] Ajout de la regle pour l'API Backend (Port TCP 5000)...
netsh advfirewall firewall delete rule name="Anouan Express API (Port 5000)" >nul 2>&1
netsh advfirewall firewall add rule name="Anouan Express API (Port 5000)" dir=in action=allow protocol=TCP localport=5000

echo [2/2] Ajout de la regle pour le Web Frontend (Port TCP 3000)...
netsh advfirewall firewall delete rule name="Anouan Express Web (Port 3000)" >nul 2>&1
netsh advfirewall firewall add rule name="Anouan Express Web (Port 3000)" dir=in action=allow protocol=TCP localport=3000

echo.
echo ========================================================
echo   FIREWALL CONFIGURE AVEC SUCCES !
echo   Votre telephone peut desormais communiquer avec le PC.
echo ========================================================
echo.
pause
