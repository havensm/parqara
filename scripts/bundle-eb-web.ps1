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

  Compress-Archive -Path (Join-Path $stageRoot "*") -DestinationPath $zipPath -Force
  Write-Output "Created EBS bundle: $zipPath"
}
finally {
  Pop-Location
}
