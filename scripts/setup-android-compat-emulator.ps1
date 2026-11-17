param([switch]$NonInteractive)

$ErrorActionPreference = 'Stop'
$sdkRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\android-sdk'))
$avdRoot = Join-Path $sdkRoot 'avd'
$userRoot = Join-Path $sdkRoot 'user-home'
$tempRoot = Join-Path $sdkRoot 'temp'
$manager = Join-Path $sdkRoot 'cmdline-tools\latest\bin\sdkmanager.bat'
$avdManager = Join-Path $sdkRoot 'cmdline-tools\latest\bin\avdmanager.bat'
$avdName = 'Trafexia_Compat_API_30'
$package = 'system-images;android-30;google_apis;x86_64'

if (-not (Test-Path -LiteralPath $manager)) {
  throw 'Run setup-android-emulator.ps1 first to install Android command-line tools.'
}
if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64' -or $env:PROCESSOR_ARCHITEW6432 -eq 'ARM64') {
  throw 'This compatibility profile is for Intel/AMD x86_64 hosts.'
}
Write-Host "Android 11 compatibility image and AVD will be installed under: $sdkRoot"
Write-Host 'This reuses the existing emulator and ADB. ARM64 app compatibility must be tested per app.'
if (-not $NonInteractive -and (Read-Host 'Continue? [y/N]') -notin @('y', 'Y', 'yes', 'YES')) { exit 0 }

New-Item -ItemType Directory -Force -Path $avdRoot, $userRoot, $tempRoot | Out-Null
$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:ANDROID_AVD_HOME = $avdRoot
$env:ANDROID_USER_HOME = $userRoot
$env:ANDROID_EMULATOR_HOME = $userRoot
$env:TEMP = $tempRoot
$env:TMP = $tempRoot
$env:TMPDIR = $tempRoot
# Also place Java's temporary files on the project drive.
$env:JAVA_TOOL_OPTIONS = "$env:JAVA_TOOL_OPTIONS `"-Djava.io.tmpdir=$tempRoot`"".Trim()

& $manager "--sdk_root=$sdkRoot" $package
if ($LASTEXITCODE -ne 0) { throw 'Android 11 download failed. If licenses are missing, run sdkmanager --licenses interactively and retry.' }

$config = Join-Path $avdRoot "$avdName.avd\config.ini"
if (-not (Test-Path -LiteralPath $config)) {
  # Explicit ASCII stdin avoids the UTF-8 BOM emitted by Windows PowerShell
  # pipelines, which avdmanager interprets as part of the answer to its prompt.
  $startInfo = New-Object Diagnostics.ProcessStartInfo
  $startInfo.FileName = $env:ComSpec
  $startInfo.Arguments = '/d /s /c ""' + $avdManager + '" create avd --name ' + $avdName + ' --package "' + $package + '" --path "' + (Join-Path $avdRoot "$avdName.avd") + '""'
  $startInfo.UseShellExecute = $false
  $startInfo.CreateNoWindow = $true
  $startInfo.RedirectStandardInput = $true
  $child = [Diagnostics.Process]::Start($startInfo)
  $child.StandardInput.WriteLine('no')
  $child.StandardInput.Close()
  $child.WaitForExit()
  if ($child.ExitCode -ne 0) { throw 'Could not create the Android 11 compatibility AVD.' }
  $child.Dispose()
}

# Apply lightweight defaults before the first boot; do not alter an AVD that
# already has userdata, which may contain apps and user files.
$avdDir = Split-Path -Parent $config
if (-not (Test-Path -LiteralPath (Join-Path $avdDir 'userdata-qemu.img'))) {
  $settings = @{
    'hw.ramSize' = '2048'
    'hw.cpu.ncore' = '2'
    'hw.lcd.width' = '540'
    'hw.lcd.height' = '960'
    'hw.lcd.density' = '240'
    'disk.dataPartition.size' = '4G'
    'fastboot.forceColdBoot' = 'yes'
    'fastboot.forceFastBoot' = 'no'
    'hw.camera.front' = 'none'
    'hw.camera.back' = 'none'
  }
  $lines = @(Get-Content -LiteralPath $config)
  foreach ($key in $settings.Keys) {
    $lines = @($lines | Where-Object { -not $_.StartsWith($key + '=') }) + ($key + '=' + $settings[$key])
  }
  [IO.File]::WriteAllLines($config, $lines, (New-Object Text.UTF8Encoding($false)))
}
if (-not (Test-Path -LiteralPath $config)) { throw 'AVD config is missing after setup.' }
Write-Host "Ready: $avdName. Restart Trafexia to use the Android 11 compatibility profile." -ForegroundColor Green
