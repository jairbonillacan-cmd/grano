@echo off
setlocal
cd /d "%~dp0"
if "%PORT%"=="" set PORT=4173
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://127.0.0.1:%PORT%"
call npm start
