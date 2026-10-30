@echo off
setlocal
cd /d "%~dp0"
if "%PORT%"=="" set PORT=4173
call npm run build
if errorlevel 1 exit /b %errorlevel%
start "" cmd /c "timeout /t 1 /nobreak >nul & start http://127.0.0.1:%PORT%"
node server/index.js
