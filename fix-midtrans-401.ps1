# Midtrans Credentials Update & Verification Script
# Usage: .\fix-midtrans-401.ps1

Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "🔧 Midtrans 401 Error - Quick Fix Script" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# Step 1: Show current values
Write-Host "📊 Currently Deployed Credentials:" -ForegroundColor Yellow
Write-Host ""

$current = az webapp config appsettings list -n lms-inspira-api -g rg-innovation-inspirateknologi | ConvertFrom-Json
$midtrans = $current | Where-Object { $_.name -like '*MIDTRANS*' -or $_.name -like '*MERCHANT*' }

$midtrans | ForEach-Object {
    $val = if($_.value -and $_.value.Length -gt 30) { $_.value.Substring(0, 27) + "..." } else { $_.value }
    Write-Host "  $($_.name): $val" -ForegroundColor Gray
}
Write-Host ""

# Step 2: Prompt for new credentials
Write-Host "📝 Enter new credentials from Midtrans dashboard:" -ForegroundColor Yellow
Write-Host ""

$merchantId = Read-Host "  Merchant ID (e.g., M377060101)"
$clientKey = Read-Host "  Client Key (sandbox or production)"
$serverKey = Read-Host "  Server Key (sandbox or production)" -AsSecureString
$serverKeyPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($serverKey))

$isProduction = Read-Host "  Is Production? (true/false, default: false)"
if ([string]::IsNullOrWhiteSpace($isProduction)) { $isProduction = "false" }

Write-Host ""
Write-Host "🔄 Updating Azure App Service..." -ForegroundColor Cyan

# Step 3: Update Azure
try {
    $result = az webapp config appsettings set `
      -n lms-inspira-api `
      -g rg-innovation-inspirateknologi `
      --settings `
        MIDTRANS_MERCHANT_ID="$merchantId" `
        MIDTRANS_CLIENT_KEY="$clientKey" `
        MIDTRANS_SERVER_KEY="$serverKeyPlain" `
        MIDTRANS_IS_PRODUCTION="$isProduction" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Settings updated successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Update failed: $result" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error updating settings: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔄 Restarting backend App Service..." -ForegroundColor Cyan
az webapp restart -n lms-inspira-api -g rg-innovation-inspirateknologi

Write-Host "⏳ Waiting for backend to restart..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Step 4: Verify
Write-Host ""
Write-Host "✔️  Verifying new credentials..." -ForegroundColor Cyan

$attempt = 0
$maxAttempts = 15
$isHealthy = $false

while ($attempt -lt $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri "https://lms-inspira-api.azurewebsites.net/api/health" `
          -Method GET -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            $health = $response.Content | ConvertFrom-Json
            Write-Host "✅ Backend is healthy: $($health | ConvertTo-Json -Compress)" -ForegroundColor Green
            $isHealthy = $true
            break
        }
    } catch {
        $attempt++
        if ($attempt -lt $maxAttempts) {
            Write-Host "  Attempt $attempt/$maxAttempts: Waiting..." -ForegroundColor Gray
            Start-Sleep -Seconds 2
        }
    }
}

if (-not $isHealthy) {
    Write-Host "⚠️  Backend didn't respond after $maxAttempts attempts" -ForegroundColor Yellow
    Write-Host "    This is normal if restart is still in progress" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "📋 Summary" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ Merchant ID:   $merchantId" -ForegroundColor Green
Write-Host "✓ Client Key:    $(if($clientKey.Length -gt 30) { $clientKey.Substring(0,27) + '...' } else { $clientKey })" -ForegroundColor Green
Write-Host "✓ Server Key:    $(if($serverKeyPlain.Length -gt 30) { $serverKeyPlain.Substring(0,27) + '...' } else { $serverKeyPlain })" -ForegroundColor Green
Write-Host "✓ Is Production: $isProduction" -ForegroundColor Green
Write-Host ""
Write-Host "🧪 Test payment flow:" -ForegroundColor Cyan
Write-Host "  1. Open https://lms-inspira-web.azurewebsites.net/" -ForegroundColor Gray
Write-Host "  2. Login as student" -ForegroundColor Gray
Write-Host "  3. Add course to cart" -ForegroundColor Gray
Write-Host "  4. Click Checkout" -ForegroundColor Gray
Write-Host "  5. If Midtrans popup appears → ✅ Keys are valid!" -ForegroundColor Gray
Write-Host ""
Write-Host "If still getting 401 error:" -ForegroundColor Yellow
Write-Host "  1. Double-check keys in Midtrans dashboard" -ForegroundColor Gray
Write-Host "  2. Verify Merchant ID matches" -ForegroundColor Gray
Write-Host "  3. Ensure IS_PRODUCTION matches key type (sandbox/production)" -ForegroundColor Gray
Write-Host ""
