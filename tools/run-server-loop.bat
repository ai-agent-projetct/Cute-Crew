@echo off
rem Cute Crew server watchdog — keeps the store running; restarts it if it ever stops.
cd /d "%~dp0.."
:loop
node server.js
timeout /t 3 /nobreak >nul
goto loop
