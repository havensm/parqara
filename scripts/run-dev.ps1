$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

function Remove-WithRetry {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [int]$Attempts = 6,
    [int]$DelaySeconds = 2
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    return
  }

  for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
    try {
      Remove-Item -LiteralPath $Path -Recurse -Force -ErrorAction Stop
      return
    } catch {
      if ($attempt -eq $Attempts) {
        throw
      }

      Start-Sleep -Seconds $DelaySeconds
    }
  }
}

try {
  Remove-WithRetry -Path (Join-Path $repoRoot '.next')
} catch {
  throw "Unable to clear .next before starting Next.js. This workspace is under OneDrive and a sync/file lock is still holding the build directory. Close any running local app windows or pause OneDrive sync, then retry. Original error: $($_.Exception.Message)"
}

$nextCli = Join-Path $repoRoot 'node_modules\.bin\next.cmd'
if (-not (Test-Path -LiteralPath $nextCli)) {
  throw "Could not find $nextCli. Run npm install first."
}

& $nextCli dev --webpack @args
