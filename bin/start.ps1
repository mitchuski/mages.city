# bin/start.ps1 - run the mages.city local twin: the front (:3334), the farm (:3333) and the
# Portal desk (:4445).
#   .\bin\start.ps1            # start (idempotent)
#   .\bin\start.ps1 status
#   .\bin\start.ps1 stop
# Pure ASCII on purpose (PS 5.1). Logs in .run\. The cookie secret is generated once into
# .run\cookie-secret and never printed.
param([ValidateSet('start','status','stop')][string]$Action = 'start')
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$farm = Join-Path $root 'farm'
$site = Join-Path $root 'site'
$frontOverlay = Join-Path $farm 'front'   # the twin's kit, laid over site/ (whose kit carries the production doors)
$run  = Join-Path $root '.run'
New-Item -ItemType Directory -Force $run | Out-Null
$farmPort = 3333
$frontPort = 3334
$portalPort = 4445
$exchangePort = 4448
$wiki = Join-Path $env:APPDATA 'npm\wiki.cmd'
$portal = Join-Path $root 'portal\server.js'
$exchange = Join-Path $root 'exchange\desk.js'
$front = Join-Path $root 'bin\serve-site.js'
$portalSite = 'portal.mages.localhost'
$exchangeSite = 'exchange.mages.localhost'

function Test-Port([int]$p) {
  try { $c = New-Object Net.Sockets.TcpClient; $c.Connect('127.0.0.1', $p); $c.Close(); return $true } catch { return $false }
}
function Save-Pid([string]$name, [int]$procId) { Set-Content -Path (Join-Path $run "$name.pid") -Value $procId -Encoding ascii }
function Read-Pid([string]$name) {
  $f = Join-Path $run "$name.pid"
  if (Test-Path $f) { return [int](Get-Content $f -Raw).Trim() } else { return 0 }
}
function Wait-Port([int]$p) { $tries = 0; while (-not (Test-Port $p) -and $tries -lt 40) { Start-Sleep -Milliseconds 250; $tries++ } }
function Up([int]$p) { if (Test-Port $p) { 'UP' } else { 'DOWN' } }

if ($Action -eq 'status') {
  Write-Output ("front  :{0}  {1}" -f $frontPort, (Up $frontPort))
  Write-Output ("farm   :{0}  {1}" -f $farmPort, (Up $farmPort))
  Write-Output ("portal :{0}  {1}" -f $portalPort, (Up $portalPort))
  Write-Output ("exchng :{0}  {1}" -f $exchangePort, (Up $exchangePort))
  if (Test-Path $farm) { Write-Output ("sites  : " + ((Get-ChildItem $farm -Directory | Select-Object -ExpandProperty Name) -join ', ')) }
  exit 0
}

if ($Action -eq 'stop') {
  foreach ($n in @('front','farm','portal','exchange')) {
    $p = Read-Pid $n
    if ($p -gt 0) {
      try { Stop-Process -Id $p -Force -ErrorAction Stop; Write-Output "stopped $n (pid $p)" } catch { Write-Output "$n pid $p not running" }
      Remove-Item (Join-Path $run "$n.pid") -Force -ErrorAction SilentlyContinue
    }
  }
  # wiki.cmd spawns node as a child; make sure nothing still holds the ports
  foreach ($port in @($frontPort, $farmPort, $portalPort, $exchangePort)) {
    $owners = netstat -ano | Select-String (":{0} " -f $port) | Select-String 'LISTENING' | ForEach-Object { ($_ -split '\s+')[-1] } | Sort-Object -Unique
    foreach ($o in $owners) { if ($o -match '^\d+$' -and [int]$o -gt 0) { try { Stop-Process -Id ([int]$o) -Force -ErrorAction Stop; Write-Output "freed :$port (pid $o)" } catch {} } }
  }
  exit 0
}

# start
if (-not (Test-Path $farm)) { throw "farm dir missing - run: node bin\build-pages.js" }
$secretFile = Join-Path $run 'cookie-secret'
if (-not (Test-Path $secretFile)) {
  $bytes = New-Object byte[] 32
  (New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
  ($bytes | ForEach-Object { $_.ToString('x2') }) -join '' | Set-Content -Path $secretFile -Encoding ascii
}
$secret = (Get-Content $secretFile -Raw).Trim()

if (-not (Test-Port $farmPort)) {
  Write-Output "starting farm on :$farmPort (wiki --farm --allowed * --security_type friends --autoseed) ..."
  $args = @('--farm', '--port', "$farmPort", '--allowed', '*', '--security_type', 'friends', '--cookieSecret', $secret, '--session_duration', '30', '--autoseed', '--data', "$farm")
  $p = Start-Process -FilePath $wiki -ArgumentList $args -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput (Join-Path $run 'farm.log') -RedirectStandardError (Join-Path $run 'farm.err.log')
  Save-Pid 'farm' $p.Id
  Wait-Port $farmPort
} else { Write-Output "farm already up on :$farmPort" }
Write-Output ("farm   :{0}  {1}" -f $farmPort, (Up $farmPort))

$env:MAGES_FARM_PORT = "$farmPort"
$env:MAGES_FRONT_PORT = "$frontPort"
if (-not (Test-Port $portalPort)) {
  Write-Output "starting portal desk on :$portalPort ..."
  $p = Start-Process -FilePath 'node' -ArgumentList @("`"$portal`"", "$portalPort", "`"$farm`"", $portalSite) -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput (Join-Path $run 'portal.log') -RedirectStandardError (Join-Path $run 'portal.err.log')
  Save-Pid 'portal' $p.Id
  Wait-Port $portalPort
} else { Write-Output "portal already up on :$portalPort" }
Write-Output ("portal :{0}  {1}" -f $portalPort, (Up $portalPort))

if (-not (Test-Port $exchangePort)) {
  Write-Output "starting exchange desk on :$exchangePort ..."
  $p = Start-Process -FilePath 'node' -ArgumentList @("`"$exchange`"", "$exchangePort", "`"$farm`"", $exchangeSite) -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput (Join-Path $run 'exchange.log') -RedirectStandardError (Join-Path $run 'exchange.err.log')
  Save-Pid 'exchange' $p.Id
  Wait-Port $exchangePort
} else { Write-Output "exchange already up on :$exchangePort" }
Write-Output ("exchng :{0}  {1}" -f $exchangePort, (Up $exchangePort))

if (-not (Test-Port $frontPort)) {
  Write-Output "starting front on :$frontPort ..."
  $p = Start-Process -FilePath 'node' -ArgumentList @("`"$front`"", "$frontPort", "`"$site`"", "`"$frontOverlay`"") -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput (Join-Path $run 'front.log') -RedirectStandardError (Join-Path $run 'front.err.log')
  Save-Pid 'front' $p.Id
  Wait-Port $frontPort
} else { Write-Output "front already up on :$frontPort" }
Write-Output ("front  :{0}  {1}" -f $frontPort, (Up $frontPort))

Write-Output ""
Write-Output "the front    http://mages.localhost:$frontPort/        (board: /board)"
Write-Output "the Hall     http://wiki.mages.localhost:$farmPort/"
Write-Output "the Portal   http://portal.mages.localhost:$farmPort/   desk: http://portal.mages.localhost:$portalPort/"
Write-Output "the Swarm    http://swarm.mages.localhost:$farmPort/"
Write-Output "the Exchange http://exchange.mages.localhost:$farmPort/   desk: http://exchange.mages.localhost:$exchangePort/"
Write-Output "acceptance   node bin\verify.mjs"
