$ErrorActionPreference = 'Stop'
$sdkRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\android-sdk'))
$avdRoot = Join-Path $sdkRoot 'avd'
$userHome = Join-Path $sdkRoot 'user-home'
$tempRoot = Join-Path $sdkRoot 'temp'
$cmdlineTools = Join-Path $sdkRoot 'cmdline-tools\latest'
$sdkManager = Join-Path $cmdlineTools 'bin\sdkmanager.bat'
$avdManager = Join-Path $cmdlineTools 'bin\avdmanager.bat'
$zipPath = Join-Path $tempRoot 'trafexia-commandlinetools.zip'
$staging = Join-Path $tempRoot 'trafexia-commandlinetools'
$downloadUrl = 'https://dl.google.com/android/repository/commandlinetools-win-15859902_latest.zip'
$expectedSha256 = '90ae805d20434428bffcb699c290860f19bb5f66a67e6b330067e3de801fb04a'

Write-Host 'Trafexia lightweight Android emulator setup' -ForegroundColor Cyan
Write-Host "SDK location: $sdkRoot"
Write-Host 'This downloads the command-line tools, emulator and one Android system image. Android Studio is not installed.'
Write-Host 'Google Android SDK licenses will be shown for your acceptance.'
if ((Read-Host 'Continue? [y/N]') -notin @('y', 'Y', 'yes', 'YES')) { exit 0 }

New-Item -ItemType Directory -Force -Path $sdkRoot | Out-Null
New-Item -ItemType Directory -Force -Path $userHome, $tempRoot | Out-Null
$env:TEMP = $tempRoot
$env:TMP = $tempRoot
$env:ANDROID_USER_HOME = $userHome
$env:ANDROID_EMULATOR_HOME = $userHome
if (-not (Test-Path $sdkManager)) {
  Write-Host 'Downloading Android command-line tools...'
  Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath
  $actualHash = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($actualHash -ne $expectedSha256) { throw "Android command-line tools checksum mismatch: $actualHash" }
  Remove-Item -LiteralPath $staging -Recurse -Force -ErrorAction SilentlyContinue
  Expand-Archive -LiteralPath $zipPath -DestinationPath $staging -Force
  New-Item -ItemType Directory -Force -Path (Split-Path $cmdlineTools) | Out-Null
  Move-Item -LiteralPath (Join-Path $staging 'cmdline-tools') -Destination $cmdlineTools -Force
  Remove-Item -LiteralPath $zipPath, $staging -Recurse -Force -ErrorAction SilentlyContinue
}

$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:ANDROID_USER_HOME = $userHome
$env:ANDROID_EMULATOR_HOME = $userHome
$env:ANDROID_AVD_HOME = $avdRoot
New-Item -ItemType Directory -Force -Path $avdRoot | Out-Null
Write-Host 'Accept the Android SDK licenses in the next prompt.' -ForegroundColor Yellow
& $sdkManager "--sdk_root=$sdkRoot" --licenses
if ($LASTEXITCODE -ne 0) { throw 'License acceptance failed.' }

Write-Host 'Installing only the emulator, ADB and Android 35 Google APIs image...'
& $sdkManager "--sdk_root=$sdkRoot" 'platform-tools' 'emulator' 'system-images;android-35;google_apis;x86_64'
if ($LASTEXITCODE -ne 0) { throw 'Android emulator packages failed to install.' }

$avdName = 'Trafexia_API_35'
$existing = & $avdManager list avd
if ($existing -notmatch "Name: $avdName") {
  # Avoid device-profile lookup: recent system images may omit the legacy devices.xml catalog.
  & $avdManager create avd --name $avdName --package 'system-images;android-35;google_apis;x86_64' --force
  if ($LASTEXITCODE -ne 0) { throw 'Could not create the Trafexia AVD.' }
}

Write-Host "`nSetup complete. Restart Trafexia; emulator and ADB are installed under $sdkRoot." -ForegroundColor Green
Read-Host 'Press Enter to close'
