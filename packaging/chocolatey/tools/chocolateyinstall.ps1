# __VERSION__ and __CHECKSUM__ are filled in at release time by the CI workflow.
$ErrorActionPreference = 'Stop'

$version = '__VERSION__'
$url64 = "https://github.com/lexandro/mdedit/releases/download/v$version/mdedit_${version}_x64_en-US.msi"

$packageArgs = @{
  packageName    = 'mdedit'
  fileType       = 'msi'
  url64bit       = $url64
  checksum64     = '__CHECKSUM__'
  checksumType64 = 'sha256'
  silentArgs     = '/qn /norestart'
  validExitCodes = @(0, 3010, 1641)
}

Install-ChocolateyPackage @packageArgs
