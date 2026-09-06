# ==============================================================================
# Sahayak Platform - Local Windows Launcher (No Docker Required)
# ==============================================================================
# Automatically:
# 1. Checks and starts local MongoDB service / mongod.exe
# 2. Sets up Python virtual environment & backend dependencies
# 3. Seeds database (schemes + test accounts)
# 4. Installs frontend dependencies (npm)
# 5. Launches Backend and Frontend in dedicated windows
# 6. Opens browser to http://localhost:3000
# ==============================================================================

$ErrorActionPreference = "Continue"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       Sahayak Civic Platform - Windows Local Runner      " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$Root = Split-Path -Parent $MyInvocation.MyCommand.Definition
if (-not $Root) { $Root = Get-Location }
Set-Location $Root

# ------------------------------------------------------------------------------
# 1. Check and Start MongoDB
# ------------------------------------------------------------------------------
Write-Host "[1/5] Checking MongoDB status on port 27017..." -ForegroundColor Cyan

function Test-MongoPort {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $async = $tcp.BeginConnect("127.0.0.1", 27017, $null, $null)
        $wait = $async.AsyncWaitHandle.WaitOne(1500, $false)
        if ($wait -and $tcp.Connected) {
            $tcp.EndConnect($async)
            $tcp.Close()
            return $true
        }
        $tcp.Close()
        return $false
    } catch {
        return $false
    }
}

$isMongoUp = Test-MongoPort

if ($isMongoUp) {
    Write-Host "  -> MongoDB is already running on port 27017." -ForegroundColor Green
} else {
    Write-Host "  -> MongoDB is stopped. Attempting to start service..." -ForegroundColor Yellow
    
    # Try Windows Service
    $mongoService = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
    if ($mongoService) {
        try {
            Start-Service -Name "MongoDB" -ErrorAction Stop
            Start-Sleep -Seconds 3
        } catch {
            Write-Host "  -> Could not start MongoDB service via standard permissions. Trying net start..." -ForegroundColor Gray
            Start-Process cmd.exe -ArgumentList "/c net start MongoDB" -Wait -WindowStyle Hidden
            Start-Sleep -Seconds 3
        }
    }
    
    # Check if port is now up
    $isMongoUp = Test-MongoPort
    
    # If still not up, check for mongod.exe in Program Files or PATH
    if (-not $isMongoUp) {
        $mongodExe = Get-Command mongod.exe -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
        if (-not $mongodExe) {
            $candidatePaths = Get-ChildItem "C:\Program Files\MongoDB\Server\*\bin\mongod.exe" -ErrorAction SilentlyContinue
            if ($candidatePaths) {
                $mongodExe = $candidatePaths[0].FullName
            }
        }
        
        if ($mongodExe) {
            Write-Host "  -> Starting mongod.exe ($mongodExe)..." -ForegroundColor Yellow
            $dbPath = Join-Path $Root "data\db"
            if (-not (Test-Path $dbPath)) {
                New-Item -ItemType Directory -Path $dbPath -Force | Out-Null
            }
            Start-Process -FilePath $mongodExe -ArgumentList "--dbpath `"$dbPath`"" -WindowStyle Minimized
            Start-Sleep -Seconds 4
            $isMongoUp = Test-MongoPort
        }
    }
    
    if ($isMongoUp) {
        Write-Host "  -> MongoDB started successfully!" -ForegroundColor Green
    } else {
        Write-Host "  [!] MongoDB could not be started automatically." -ForegroundColor Red
        Write-Host "      If MongoDB is not installed, install it by running:" -ForegroundColor Yellow
        Write-Host "      winget install MongoDB.Server" -ForegroundColor White
        Write-Host "      Or start it manually: net start MongoDB" -ForegroundColor White
        Write-Host ""
        $choice = Read-Host "Would you like to continue anyway (e.g. if using MongoDB Atlas cloud)? (Y/N)"
        if ($choice -notmatch "^[yY]") {
            exit 1
        }
    }
}

# ------------------------------------------------------------------------------
# 2. Check Python & Setup Backend
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[2/5] Configuring Backend Python Environment..." -ForegroundColor Cyan

$pythonCmd = Get-Command python.exe -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
    $pythonCmd = Get-Command py.exe -ErrorAction SilentlyContinue
}

if (-not $pythonCmd) {
    Write-Host "  [!] Python is not installed or not in PATH." -ForegroundColor Red
    Write-Host "      Please install Python 3.10+ from https://python.org (make sure to check 'Add Python to PATH')" -ForegroundColor Yellow
    exit 1
}

$venvDir = Join-Path $Root "backend\venv"
$venvPython = Join-Path $venvDir "Scripts\python.exe"

if (-not (Test-Path $venvPython)) {
    Write-Host "  -> Creating Python virtual environment in backend\venv..." -ForegroundColor Yellow
    & $pythonCmd.Source -m venv $venvDir
}
Write-Host "  -> Upgrading pip and wheel in virtual environment..." -ForegroundColor Cyan
& $venvPython -m pip install --upgrade pip setuptools wheel --quiet

Write-Host "  -> Installing backend Python dependencies (preferring pre-built binaries)..." -ForegroundColor Cyan
& $venvPython -m pip install -r "$Root\backend\requirements.txt" --prefer-binary

$testImport = & $venvPython -c "import motor, fastapi, pydantic; print('OK')" 2>&1
if ($testImport -notmatch "OK") {
    Write-Host "  [!] Dependencies failed to install properly: $testImport" -ForegroundColor Red
    Write-Host "  [!] Please ensure Python has internet access and retry." -ForegroundColor Yellow
    exit 1
}
# ------------------------------------------------------------------------------
# 3. Seed Database
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[3/5] Seeding statutory schemes and test accounts..." -ForegroundColor Cyan
Push-Location "$Root\backend"
& $venvPython seed.py
Pop-Location

# ------------------------------------------------------------------------------
# 4. Check Node.js & Setup Frontend
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[4/5] Checking Frontend Dependencies (Node.js)..." -ForegroundColor Cyan

$nodeCmd = Get-Command node.exe -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host "  [!] Node.js is not installed or not in PATH." -ForegroundColor Red
    Write-Host "      Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

$frontendModules = Join-Path $Root "frontend\node_modules"
if (-not (Test-Path $frontendModules)) {
    Write-Host "  -> Installing frontend packages (npm install)..." -ForegroundColor Yellow
    Push-Location "$Root\frontend"
    npm install
    Pop-Location
} else {
    Write-Host "  -> Frontend node_modules already installed." -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# 5. Launch Backend and Frontend
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[5/5] Launching Sahayak services..." -ForegroundColor Cyan

# Launch FastAPI Backend
Write-Host "  -> Starting FastAPI Backend on http://localhost:8000..." -ForegroundColor Green
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$Root\backend'; Write-Host '=== Sahayak Backend Server (FastAPI) ===' -ForegroundColor Green; & '$venvPython' -m uvicorn app.main:app --reload --port 8000"

# Wait 2 seconds for backend to initialize
Start-Sleep -Seconds 2

# Launch Next.js Frontend
Write-Host "  -> Starting Next.js Frontend on http://localhost:3000..." -ForegroundColor Green
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$Root\frontend'; Write-Host '=== Sahayak Frontend Server (Next.js) ===' -ForegroundColor Cyan; npm run dev"

# Wait 3 seconds and open browser
Start-Sleep -Seconds 3
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  Sahayak is running!" -ForegroundColor Yellow
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Backend API: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""

Start-Process "http://localhost:3000"
