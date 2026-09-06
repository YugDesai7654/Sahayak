Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " Starting Sahayak Platform via Docker Compose (Windows)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker is not installed or not in PATH."
    Write-Host "Please install and launch Docker Desktop for Windows: https://www.docker.com/products/docker-desktop/"
    exit 1
}

Write-Host "Stopping any running containers first..." -ForegroundColor Yellow
docker compose down --remove-orphans

# Ensure ports 3000, 8000, 27017 are free on Windows
$ports = @(3000, 8000, 27017)
foreach ($port in $ports) {
    try {
        $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($conns) {
            foreach ($conn in $conns) {
                $pidToKill = $conn.OwningProcess
                if ($pidToKill -and $pidToKill -ne 0 -and $pidToKill -ne 4) {
                    Write-Host "Releasing port $port (Terminating process ID: $pidToKill)..." -ForegroundColor Yellow
                    Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
                }
            }
        }
    } catch {}
}

Write-Host "Building and starting containers..." -ForegroundColor Green
docker compose up --build $args
