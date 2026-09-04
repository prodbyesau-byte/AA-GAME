@echo off
setlocal enabledelayedexpansion
title Anders Andersen Vinduespudser

cd /d "%~dp0"

echo ========================================================
echo    ANDERS ANDERSEN VINDUESPUDSER - STANDALONE
echo ========================================================
echo.

:: 1. Tjek om npm er tilgaengelig
where npm >nul 2>&1
if errorlevel 1 (
    echo [FEJL] Node.js / npm blev ikke fundet!
    echo Sørg for at Node.js er installeret fra https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Tjek om dev server allerede koerer
set STARTED_BY_ME=0
curl.exe -s -o NUL http://127.0.0.1:5173 >nul 2>&1
if errorlevel 1 (
    echo [1/3] Starter lokal spil-server...
    set STARTED_BY_ME=1
    start "AA_GAME_DEV_SERVER" /min cmd /c "npm.cmd run dev -- --host 127.0.0.1 --port 5173"
    
    echo [2/3] Venter paa at spillet er klar...
    :wait_server
    timeout /t 1 /nobreak >nul
    curl.exe -s -o NUL http://127.0.0.1:5173 >nul 2>&1
    if errorlevel 1 goto wait_server
) else (
    echo [1/3] Spil-server koerer allerede.
)

echo [3/3] Aabner spillet i et standalone vindue...

:: 3. Find browser executable (Edge eller Chrome til app-mode)
set "APP_EXE="
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    set "APP_EXE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
) else if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    set "APP_EXE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
) else if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set "APP_EXE=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
) else if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    set "APP_EXE=%LocalAppData%\Google\Chrome\Application\chrome.exe"
)

set "PROFILE_DIR=%TEMP%\aa-game-standalone"

if defined APP_EXE (
    echo.
    echo Spillet koerer nu i sit eget standalone vindue!
    echo Naar du lukker spillet, rydder dette vindue automatisk op.
    
    start /wait "" "!APP_EXE!" --app=http://127.0.0.1:5173 --window-size=1300,770 --user-data-dir="!PROFILE_DIR!"
) else (
    echo Fandt hverken Edge eller Chrome. Aabner i standardbrowser...
    start http://127.0.0.1:5173
)

:: 4. Oprydning hvis vi startede serveren
if "!STARTED_BY_ME!"=="1" (
    echo Lukker lokal spil-server...
    for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
        taskkill /F /PID %%p >nul 2>&1
    )
    taskkill /FI "WINDOWTITLE eq AA_GAME_DEV_SERVER*" /T /F >nul 2>&1
)

exit /b 0
