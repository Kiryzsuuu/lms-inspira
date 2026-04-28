[CmdletBinding()]
param(
  [Parameter(Mandatory=$false)]
  [ValidateSet('all','web','api','kudu-web','kudu-api','portal-web','portal-api')]
  [string]$Target = 'all',

  [Parameter(Mandatory=$false)]
  [string]$ResourceGroup = 'rg-innovation-inspirateknologi',

  [Parameter(Mandatory=$false)]
  [string]$WebAppName = 'lms-inspira-web',

  [Parameter(Mandatory=$false)]
  [string]$ApiAppName = 'lms-inspira-api'
)

$ErrorActionPreference = 'Stop'

function Open-Url([string]$Url) {
  Write-Host "Opening: $Url" -ForegroundColor Cyan
  Start-Process $Url | Out-Null
}

function Get-SubscriptionId() {
  try {
    $id = (az account show --query id -o tsv 2>$null)
    if (-not $id) { return $null }
    return $id.Trim()
  } catch {
    return $null
  }
}

function Get-PortalResourceUrl([string]$SubscriptionId, [string]$Rg, [string]$AppName) {
  $resourceId = "/subscriptions/$SubscriptionId/resourceGroups/$Rg/providers/Microsoft.Web/sites/$AppName"
  # Resource blade deep link
  return "https://portal.azure.com/#resource$resourceId"
}

$webUrl = "https://$WebAppName.azurewebsites.net/"
$apiUrl = "https://$ApiAppName.azurewebsites.net/"
$kuduWebUrl = "https://$WebAppName.scm.azurewebsites.net/"
$kuduApiUrl = "https://$ApiAppName.scm.azurewebsites.net/"

$subId = $null
if ($Target -like 'portal-*') {
  $subId = Get-SubscriptionId
  if (-not $subId) {
    throw "Tidak bisa ambil subscription id dari Azure CLI. Pastikan sudah login: az login"
  }
}

switch ($Target) {
  'all' {
    Open-Url $webUrl
    Open-Url $apiUrl
    Open-Url $kuduWebUrl
    Open-Url $kuduApiUrl
  }
  'web' { Open-Url $webUrl }
  'api' { Open-Url $apiUrl }
  'kudu-web' { Open-Url $kuduWebUrl }
  'kudu-api' { Open-Url $kuduApiUrl }
  'portal-web' { Open-Url (Get-PortalResourceUrl -SubscriptionId $subId -Rg $ResourceGroup -AppName $WebAppName) }
  'portal-api' { Open-Url (Get-PortalResourceUrl -SubscriptionId $subId -Rg $ResourceGroup -AppName $ApiAppName) }
}
