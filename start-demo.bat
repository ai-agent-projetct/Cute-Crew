@echo off
title Cute Crew Demo - KEEP THIS WINDOW OPEN
cd /d "%~dp0"

echo ============================================================
echo   CUTE CREW - DEMO LAUNCHER
echo   Keep this window open while the client is viewing.
echo   Closing it (or shutting down / sleeping the PC) ends the demo.
echo ============================================================
echo.
echo Starting the store server...
start "Cute Crew Server" cmd /c "node server.js"
timeout /t 5 >nul

:loop
echo.
echo ------------------------------------------------------------
echo   Opening the public link. Copy the https://....trycloudflare.com
echo   address below and send it to your client.
echo   Store = that address     Admin = that address + /admin.html
echo ------------------------------------------------------------
echo.
"%~dp0tools\cloudflared.exe" tunnel --url http://localhost:4000
echo.
echo  ! The public link dropped. Reconnecting in 3 seconds...
echo    (a NEW address will appear below - resend it if this happens)
timeout /t 3 >nul
goto loop
