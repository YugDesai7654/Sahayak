@echo off
setlocal enabledelayedexpansion
title Sahayak Local Launcher (No Docker)

cd /d "%~dp0"

echo ==========================================================
echo       Sahayak Civic Platform - Windows Local Runner
echo ==========================================================
echo.

:: If a previous failed pip install left a broken virtualenv without motor, wipe it cleanly
if exist "backend\venv" (
    if not exist "backend\venv\Lib\site-packages\motor" (
        echo [INFO] Cleaning up incomplete virtual environment from previous attempt...
        rd /s /q "backend\venv" 2>nul
    )
)

echo Launching setup and servers...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-local.ps1"

if %ERRORLEVEL% neq 0 (
    echo.
    echo [!] Setup encountered an issue. Press any key to close this window.
    pause >nul
)
