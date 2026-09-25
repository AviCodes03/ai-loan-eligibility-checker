@echo off
cd /d "%~dp0"

start "AI Loan Checker Server" cmd /k "npm.cmd start"

timeout /t 5 /nobreak >nul

start "" "http://localhost:3000/#home"