# MongoDB Atlas IP Whitelist Automation Script (PowerShell)
# Adds Azure App Service outbound IPs to MongoDB Atlas Network Access

Write-Host "🔧 MongoDB Atlas IP Whitelist Setup" -ForegroundColor Cyan
Write-Host "====================================`n"

# Get API Credentials
$PublicApiKey = Read-Host "Enter MongoDB Atlas Public API Key"
$PrivateApiKey = Read-Host "Enter MongoDB Atlas Private API Key"
$OrgId = Read-Host "Enter MongoDB Organization ID"
$ProjectId = Read-Host "Enter MongoDB Project ID"

# Azure App Service outbound IPs
$AzureIps = @(
    "20.205.241.35"
    "20.205.241.53"
    "20.205.241.58"
    "20.205.241.81"
    "20.205.241.114"
    "20.198.191.118"
    "20.44.210.190"
    "20.198.128.32"
    "20.198.184.108"
    "20.198.186.124"
    "20.198.189.158"
    "20.198.190.32"
    "20.212.64.16"
)

# Create Basic Auth header
$AuthString = "$($PublicApiKey):$($PrivateApiKey)"
$EncodedAuth = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($AuthString))
$Headers = @{
    "Authorization" = "Basic $EncodedAuth"
    "Content-Type"   = "application/json"
}

$BaseUrl = "https://cloud.mongodb.com/api/atlas/v1.0/groups/$ProjectId/accessList"

Write-Host "`n🔧 Adding $($AzureIps.Count) Azure IPs to MongoDB Atlas whitelist..." -ForegroundColor Yellow
Write-Host "Project ID: $ProjectId`n"

$SuccessCount = 0
$FailCount = 0

foreach ($IP in $AzureIps) {
    $Payload = @{
        ipAddress = $IP
        comment   = "Azure App Service - LMS Inspira Backend"
    } | ConvertTo-Json
    
    try {
        $Response = Invoke-WebRequest -Uri $BaseUrl `
            -Method POST `
            -Headers $Headers `
            -Body $Payload `
            -UseBasicParsing `
            -ErrorAction Stop
        
        if ($Response.StatusCode -in @(200, 201)) {
            Write-Host "✅ Added: $IP" -ForegroundColor Green
            $SuccessCount++
        }
    }
    catch {
        if ($_.Exception.Response.StatusCode.Value__ -eq 409) {
            Write-Host "⏭️  Already exists: $IP" -ForegroundColor Yellow
            $SuccessCount++
        }
        else {
            Write-Host "❌ Failed: $IP (HTTP $($_.Exception.Response.StatusCode.Value__))" -ForegroundColor Red
            Write-Host "   Error: $($_.Exception.Message)"
            $FailCount++
        }
    }
}

Write-Host "`n✨ Summary: $SuccessCount successful, $FailCount failed" -ForegroundColor Cyan

if ($FailCount -eq 0) {
    Write-Host "`n✅ All Azure IPs have been whitelisted in MongoDB Atlas!" -ForegroundColor Green
    Write-Host "⏳ Backend will reconnect within 30 seconds..." -ForegroundColor Yellow
    Write-Host "   Test: https://lms-inspira-api.azurewebsites.net/api/health`n"
}
else {
    Write-Host "`n⚠️  $FailCount IPs failed. Please check your credentials and try again." -ForegroundColor Red
    Exit 1
}
