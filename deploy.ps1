# ========================================
# LMS-Inspira Azure Deployment Script
# Deploys both API (server) and Web (client)
# ========================================

param(
    [switch]$SkipBuild = $false,
    [switch]$SkipDeploy = $false,
    [switch]$SkipApi = $false,
    [switch]$SkipWeb = $false
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Success {
    Write-Host $args -ForegroundColor Green
}

function Write-Info {
    Write-Host $args -ForegroundColor Cyan
}

function Write-ErrorMsg {
    Write-Host $args -ForegroundColor Red
}

# Configuration
$RESOURCE_GROUP = "rg-innovation-inspirateknologi"
$API_APP_NAME = "lms-inspira-api"
$WEB_APP_NAME = "lms-inspira-web"
$API_ZIP = "api-deploy.zip"
$WEB_ZIP = "web-deploy.zip"

function New-ZipPosix {
    param(
        [Parameter(Mandatory = $true)][string]$SourceDir,
        [Parameter(Mandatory = $true)][string]$ZipPath
    )

    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem

    if (Test-Path $ZipPath) {
        Remove-Item $ZipPath -Force
    }

    $sourceFullPath = (Resolve-Path $SourceDir).Path.TrimEnd('\')

    $zipStream = [System.IO.File]::Open($ZipPath, [System.IO.FileMode]::CreateNew)
    try {
        $zip = New-Object System.IO.Compression.ZipArchive($zipStream, [System.IO.Compression.ZipArchiveMode]::Create, $false)
        try {
            Get-ChildItem -Path $sourceFullPath -Recurse -File | ForEach-Object {
                $fullName = $_.FullName
                $relative = $fullName.Substring($sourceFullPath.Length).TrimStart('\')
                $entryName = $relative -replace '\\','/'
                $entry = $zip.CreateEntry($entryName, [System.IO.Compression.CompressionLevel]::Optimal)
                $entryStream = $entry.Open()
                try {
                    $fileStream = [System.IO.File]::OpenRead($fullName)
                    try {
                        $fileStream.CopyTo($entryStream)
                    }
                    finally {
                        $fileStream.Dispose()
                    }
                }
                finally {
                    $entryStream.Dispose()
                }
            }
        }
        finally {
            $zip.Dispose()
        }
    }
    finally {
        $zipStream.Dispose()
    }
}

Write-Info "======================================"
Write-Info "LMS-Inspira Azure Deployment"
Write-Info "======================================"

# ========== STEP 1: BUILD CLIENT ==========
if (-not $SkipBuild) {
    Write-Info ""
    Write-Info "[1/5] Building Client (Vite)..."

    try {
        Push-Location "client"

        if (-not $env:VITE_API_BASE_URL) {
            $env:VITE_API_BASE_URL = "https://lms-inspira-api.azurewebsites.net/api"
            Write-Info "VITE_API_BASE_URL not set; defaulting to $($env:VITE_API_BASE_URL)"
        }

        Write-Info "Installing client dependencies..."
        npm install

        Write-Info "Running Vite build..."
        npm run build
        Pop-Location
        Write-Success "Client built successfully"
    }
    catch {
        Write-ErrorMsg "Client build failed: $_"
        exit 1
    }
}
else {
    Write-Info "[1/5] Skipping client build"
}

# ========== STEP 2: COPY CLIENT TO DEPLOY FOLDER ==========
Write-Info ""
Write-Info "[2/5] Copying client build to deployment folder..."
try {
    if (Test-Path "client-deploy-min/dist") {
        Remove-Item "client-deploy-min/dist" -Recurse -Force
    }
    Copy-Item "client/dist" "client-deploy-min/dist" -Recurse
    Write-Success "Client files copied"
}
catch {
    Write-ErrorMsg "Failed to copy client files: $_"
    exit 1
}

# ========== STEP 3: COPY SERVER SOURCE TO DEPLOY FOLDER ==========
Write-Info ""
Write-Info "[3/5] Copying server source to deployment folder..."
try {
    if (Test-Path "server-deploy-min/src") {
        Remove-Item "server-deploy-min/src" -Recurse -Force
    }
    Copy-Item "server/src" "server-deploy-min/src" -Recurse
    Write-Success "Server files copied"
}
catch {
    Write-ErrorMsg "Failed to copy server files: $_"
    exit 1
}

if ($SkipDeploy) {
    Write-Success ""
    Write-Success "Build completed. Skipping deployment."
    exit 0
}

# ========== STEP 4: DEPLOY TO API ==========
Write-Info ""
Write-Info "[4/5] Deploying API to Azure ($API_APP_NAME)..."
if ($SkipApi) {
    Write-Info "Skipping API deployment"
}
else {
    try {
        # Create ZIP of server-deploy-min
        Write-Info "Creating API deployment package..."
        New-ZipPosix -SourceDir "server-deploy-min" -ZipPath $API_ZIP

        Write-Info "Uploading API to Azure..."
        az webapp deploy `
            --resource-group $RESOURCE_GROUP `
            --name $API_APP_NAME `
            --src-path $API_ZIP `
            --type zip
        if ($LASTEXITCODE -ne 0) { throw "Azure CLI API deploy failed with exit code $LASTEXITCODE" }

        Write-Info "Restarting API app..."
        az webapp restart --resource-group $RESOURCE_GROUP --name $API_APP_NAME
        if ($LASTEXITCODE -ne 0) { throw "Azure CLI API restart failed with exit code $LASTEXITCODE" }

        Write-Success "API deployed successfully"
        Remove-Item $API_ZIP -Force
    }
    catch {
        Write-ErrorMsg "API deployment failed: $_"
        exit 1
    }
}

# ========== STEP 5: DEPLOY TO WEB ==========
Write-Info ""
Write-Info "[5/5] Deploying Web to Azure ($WEB_APP_NAME)..."
if ($SkipWeb) {
    Write-Info "Skipping Web deployment"
}
else {
    try {
        # Create ZIP of client-deploy-min
        Write-Info "Creating Web deployment package..."
        New-ZipPosix -SourceDir "client-deploy-min" -ZipPath $WEB_ZIP

        Write-Info "Uploading Web to Azure..."
        az webapp deploy `
            --resource-group $RESOURCE_GROUP `
            --name $WEB_APP_NAME `
            --src-path $WEB_ZIP `
            --type zip
        if ($LASTEXITCODE -ne 0) { throw "Azure CLI Web deploy failed with exit code $LASTEXITCODE" }

        Write-Info "Restarting Web app..."
        az webapp restart --resource-group $RESOURCE_GROUP --name $WEB_APP_NAME
        if ($LASTEXITCODE -ne 0) { throw "Azure CLI Web restart failed with exit code $LASTEXITCODE" }

        Write-Success "Web deployed successfully"
        Remove-Item $WEB_ZIP -Force
    }
    catch {
        Write-ErrorMsg "Web deployment failed: $_"
        exit 1
    }
}

# ========== SUCCESS ==========
Write-Success ""
Write-Success "======================================"
Write-Success "Deployment completed successfully!"
Write-Success "======================================"
Write-Info ""
Write-Info "Your apps are now live at:"
$apiUrl = "https://$API_APP_NAME.azurewebsites.net"
$webUrl = "https://$WEB_APP_NAME.azurewebsites.net"
Write-Info "  API:  $apiUrl"
Write-Info "  Web:  $webUrl"
Write-Info ""
Write-Info "Note: It may take a few minutes for the changes to be live."
