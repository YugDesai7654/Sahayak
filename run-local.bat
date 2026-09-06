@echo off
title Sahayak Local Launcher (No Docker)
echo ==========================================================
echo       Sahayak Civic Platform - Windows Local Runner
echo ==========================================================
echo.
powershell.exe -ExecutionPolicy Bypass -File "%~dp0run-local.ps1"
pause
