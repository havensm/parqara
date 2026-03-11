$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$distRoot = Join-Path $root "dist"
$stageRoot = Join-Path $distRoot "eb-web-stage"
$zipPath = Join-Path $distRoot "parqara-web-eb.zip"

$itemsToInclude = @(
  ".next",
  ".platform",
  ".ebextensions",
  "prisma",
  "public",
  "src",
  "middleware.ts",
  "next.config.ts",
  "package.json",
  "package-lock.json",
  "postcss.config.mjs",
  "Procfile",
  "tsconfig.json"
)

$requiredArchiveEntries = @(
  ".next/BUILD_ID",
  ".platform/hooks/predeploy/01_bootstrap.sh",
  ".ebextensions/01-healthcheck.config",
  "package.json"
)

Push-Location $root
try {
  if (Test-Path ".next") {
    Remove-Item ".next" -Recurse -Force
  }

  npm run build

  if (Test-Path $stageRoot) {
    Remove-Item $stageRoot -Recurse -Force
  }

  if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
  }

  New-Item -ItemType Directory -Path $stageRoot -Force | Out-Null

  foreach ($item in $itemsToInclude) {
    if (-not (Test-Path $item)) {
      throw "Bundle input missing: $item"
    }

    Copy-Item -Path $item -Destination $stageRoot -Recurse -Force
  }

  Add-Type -AssemblyName System.IO.Compression.FileSystem

  if ($IsLinux -or $IsMacOS) {
    $zipCommand = Get-Command zip -ErrorAction SilentlyContinue

    if (-not $zipCommand) {
      throw "The 'zip' command is required to build the Elastic Beanstalk archive on Unix runners."
    }

    Push-Location $stageRoot
    try {
      & $zipCommand.Source -qr $zipPath .

      if ($LASTEXITCODE -ne 0) {
        throw "zip exited with code $LASTEXITCODE"
      }
    }
    finally {
      Pop-Location
    }
  }
  else {
    [System.IO.Compression.ZipFile]::CreateFromDirectory(
      $stageRoot,
      $zipPath,
      [System.IO.Compression.CompressionLevel]::Optimal,
      $false
    )
  }

  $archive = [System.IO.Compression.ZipFile]::OpenRead($zipPath)

  try {
    $entryNames = $archive.Entries | ForEach-Object { $_.FullName.Replace('\\', '/') }

    foreach ($requiredEntry in $requiredArchiveEntries) {
      if ($entryNames -notcontains $requiredEntry) {
        throw "Bundle archive missing required entry: $requiredEntry"
      }
    }
  }
  finally {
    $archive.Dispose()
  }

  Write-Output "Created EBS bundle: $zipPath"
}
finally {
  Pop-Location
}
