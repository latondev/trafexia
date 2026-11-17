$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$toolRoot = Join-Path $projectRoot 'resources\tools\mitmproxy'
$tempRoot = Join-Path $toolRoot 'temp'
New-Item -ItemType Directory -Force -Path $toolRoot, $tempRoot | Out-Null
$env:TEMP = $tempRoot
$env:TMP = $tempRoot
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Download the portable official release, with no global Python or installer.
$release = Invoke-RestMethod 'https://api.github.com/repos/mitmproxy/mitmproxy/releases/latest' -Headers @{ 'User-Agent' = 'Trafexia-Setup' }
$version = $release.tag_name -replace '^v', ''
if ($version -notmatch '^\d+\.\d+\.\d+$') { throw 'Unexpected official release version.' }
# The project publishes Windows binaries on its own CDN, not as GitHub assets.
$fileName = "mitmproxy-$version-windows-x86_64.zip"
$downloadUrl = "https://downloads.mitmproxy.org/$version/$fileName"
$archive = Join-Path $tempRoot $fileName
Write-Host "Downloading $fileName into $toolRoot"
Invoke-WebRequest -UseBasicParsing -Uri $downloadUrl -OutFile $archive
$actual = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant()
# Save a local digest for reproducibility; this is not an upstream signature.
[IO.File]::WriteAllText((Join-Path $toolRoot 'download-sha256.txt'), "$actual  $downloadUrl")
Expand-Archive -LiteralPath $archive -DestinationPath $toolRoot -Force
$exe = Get-ChildItem -LiteralPath $toolRoot -Filter 'mitmdump.exe' -Recurse | Select-Object -First 1
if (-not $exe) { throw 'mitmdump.exe was not found after extraction.' }
[IO.File]::WriteAllText((Join-Path $toolRoot 'release.txt'), $release.tag_name)
Write-Host "Ready: $($exe.FullName)"
Write-Host 'Restart Trafexia and open Windows Apps. Certificate trust is configured separately in the app.'
