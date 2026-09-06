@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo  Starting Sahayak Platform via Docker Compose (Windows)
echo ========================================================

where docker >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker is not installed or not in PATH.
    echo Please install and start Docker Desktop for Windows:
    echo https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

echo Stopping any running containers first...
docker compose down --remove-orphans 2>nul

echo Building and starting containers...
docker compose up --build %*
