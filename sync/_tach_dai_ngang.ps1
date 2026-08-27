[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
$expectedRemote = 'https://github.com/wilson86/tach-dai-ngang.git'
$downloads = Join-Path $env:USERPROFILE 'Downloads'

function Invoke-Git {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$GitArguments)
  & git -C $repoRoot @GitArguments
  if ($LASTEXITCODE -ne 0) { throw "git $($GitArguments -join ' ') thất bại." }
}

if (-not (Test-Path -LiteralPath (Join-Path $repoRoot '.git'))) {
  throw "Không phải Git project mới: $repoRoot"
}

$origin = (& git -C $repoRoot remote get-url origin).Trim()
if ($LASTEXITCODE -ne 0 -or $origin -ne $expectedRemote) {
  throw "Remote bị từ chối. Chỉ cho phép $expectedRemote (đang là: $origin)"
}

$allRemotes = (& git -C $repoRoot remote -v) -join "`n"
if ($allRemotes -match 'tach-dai-mobile') {
  throw 'Dừng để bảo vệ tool cũ: phát hiện remote tach-dai-mobile.'
}

$latestZip = Get-ChildItem -LiteralPath $downloads -Filter 'tach_dai_ngang_mobile_v*.zip' -File |
  Sort-Object LastWriteTime, Name -Descending |
  Select-Object -First 1
if (-not $latestZip) {
  throw "Không tìm thấy ZIP tach_dai_ngang_mobile_v*.zip trong $downloads"
}

# Checkpoint mọi thay đổi trước khi đồng bộ ZIP mới.
$dirty = (& git -C $repoRoot status --porcelain)
if ($LASTEXITCODE -ne 0) { throw 'Không đọc được trạng thái Git.' }
if ($dirty) {
  Invoke-Git add -A
  Invoke-Git commit -m "Checkpoint before Tach Dai Ngang ZIP sync"
}

$scratch = Join-Path ([System.IO.Path]::GetTempPath()) ("tach-dai-ngang-" + [guid]::NewGuid().ToString('N'))
try {
  New-Item -ItemType Directory -Path $scratch | Out-Null
  Expand-Archive -LiteralPath $latestZip.FullName -DestinationPath $scratch -Force
  if (Test-Path -LiteralPath (Join-Path $scratch '.git')) { throw 'ZIP không được chứa .git.' }

  # Chỉ copy nội dung ZIP mới vào source root; .git, tests, sync và workflow hiện hữu không bị thay thế.
  Get-ChildItem -LiteralPath $scratch -Force | ForEach-Object {
    if ($_.Name -eq '.git') { throw 'ZIP không được chứa .git.' }
    Copy-Item -LiteralPath $_.FullName -Destination $repoRoot -Recurse -Force
  }

  & node (Join-Path $repoRoot 'tests\regression-tests.js')
  if ($LASTEXITCODE -ne 0) { throw 'Regression thất bại; không commit hoặc push ZIP mới.' }

  Invoke-Git add -A
  & git -C $repoRoot diff --cached --quiet
  $staged = $LASTEXITCODE
  if ($staged -ne 0) {
    Invoke-Git commit -m ("Tach Dai Ngang sync " + $latestZip.BaseName)
    Invoke-Git push origin main
  } else {
    Write-Host 'ZIP không tạo thay đổi mới; không có commit/push.'
  }
  Write-Host "SYNC PASS: $($latestZip.Name) -> $expectedRemote"
}
finally {
  if (Test-Path -LiteralPath $scratch) { Remove-Item -LiteralPath $scratch -Recurse -Force }
}
