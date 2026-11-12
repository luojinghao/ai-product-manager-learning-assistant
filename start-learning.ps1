param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$learningUrl = 'http://127.0.0.1:5173/'
function Test-LearningServer {
    try {
        $response = Invoke-WebRequest -Uri $learningUrl -UseBasicParsing -TimeoutSec 2
        return $response.StatusCode -eq 200 -and $response.Content.Contains('content="zhixing-ai-studio"')
    } catch { return $false }
}
if (-not (Test-LearningServer)) {
    if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'node_modules/vite/bin/vite.js'))) {
        throw 'Dependencies are missing. Run npm install in this folder first.'
    }
    $learningNode = (Get-Command node -ErrorAction Stop).Source
    Start-Process -FilePath $learningNode -ArgumentList @('node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5173', '--strictPort') -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $PSScriptRoot '.learning-server.log') -RedirectStandardError (Join-Path $PSScriptRoot '.learning-server-error.log')
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        if (Test-LearningServer) { break }
        Start-Sleep -Milliseconds 500
    }
    if (-not (Test-LearningServer)) { throw 'Server did not start. Check .learning-server-error.log or run npm run dev.' }
}
if (-not $NoBrowser) {
    try { Start-Process $learningUrl }
    catch { Write-Warning "Browser could not be opened automatically. Open $learningUrl manually." }
}
Write-Host "Learning studio is ready: $learningUrl"
