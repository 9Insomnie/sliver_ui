param(
    [string]$BackendAddr = "127.0.0.1:8080",
    [int]$FrontendPort = 5173
)

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$GoTmp = Join-Path $Root ".gotmp"
New-Item -ItemType Directory -Force -Path $GoTmp | Out-Null

$env:GOTMPDIR = $GoTmp
$env:GOTOOLCHAIN = "auto"
if ($env:GOSUMDB -eq "off") {
    $env:GOSUMDB = "sum.golang.org"
}

$Backend = Start-Process `
    -FilePath "go" `
    -ArgumentList @("run", ".", "--addr", $BackendAddr) `
    -WorkingDirectory (Join-Path $Root "backend") `
    -WindowStyle Hidden `
    -PassThru

try {
    $Npm = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
    if (-not $Npm) {
        $Npm = (Get-Command npm -ErrorAction Stop).Source
    }
    Start-Process `
        -FilePath $Npm `
        -ArgumentList @("run", "dev", "--", "--host", "127.0.0.1", "--port", "$FrontendPort") `
        -WorkingDirectory (Join-Path $Root "frontend") `
        -WindowStyle Hidden `
        -Wait
} finally {
    if ($Backend -and -not $Backend.HasExited) {
        Stop-Process -Id $Backend.Id -Force
    }
}