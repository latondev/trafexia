$ErrorActionPreference = 'Stop'
if ($env:PROCESSOR_ARCHITECTURE -ne 'ARM64' -and $env:PROCESSOR_ARCHITEW6432 -ne 'ARM64') {
  throw 'The bundled Android Emulator cannot boot ARM64 system images on Intel/AMD x86_64 PCs. Use setup-android-emulator.ps1 for an x86_64 image with ARM translation. ARM64 app compatibility must be checked per app; downloading an ARM64 image will not fix native crashes.'
}
$sdkRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\android-sdk'))
$avdRoot = Join-Path $sdkRoot 'avd'
$userHome = Join-Path $sdkRoot 'user-home'
$tempRoot = Join-Path $sdkRoot 'temp'
$sdkManager = Join-Path $sdkRoot 'cmdline-tools\latest\bin\sdkmanager.bat'
$avdManager = Join-Path $sdkRoot 'cmdline-tools\latest\bin\avdmanager.bat'
$package = 'system-images;android-35;google_apis;arm64-v8a'
$avdName = 'Trafexia_ARM64_API_35'

if (-not (Test-Path $sdkManager) -or -not (Test-Path $avdManager)) {
  throw 'Android command-line tools were not found. Run setup-android-emulator.ps1 first.'
}

Write-Host 'This adds an ARM64 Android image for ARM64-only APK splits.' -ForegroundColor Cyan
Write-Host 'This setup requires a compatible Windows ARM64 host and emulator binary.' -ForegroundColor Yellow
if ((Read-Host 'Continue? [y/N]') -notin @('y', 'Y', 'yes', 'YES')) { exit 0 }

$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:ANDROID_USER_HOME = $userHome
$env:ANDROID_EMULATOR_HOME = $userHome
$env:ANDROID_AVD_HOME = $avdRoot
New-Item -ItemType Directory -Force -Path $avdRoot, $userHome, $tempRoot | Out-Null
$env:TEMP = $tempRoot
$env:TMP = $tempRoot

& $sdkManager "--sdk_root=$sdkRoot" $package
if ($LASTEXITCODE -ne 0) { throw 'ARM64 system image failed to install.' }

$existing = & $avdManager list avd
if ($existing -notmatch "Name: $avdName") {
  & $avdManager create avd --name $avdName --package $package --force
  if ($LASTEXITCODE -ne 0) { throw 'Could not create the ARM64 AVD.' }
}

Write-Host "ARM64 AVD is ready: $avdName" -ForegroundColor Green
Read-Host 'Press Enter to close'
