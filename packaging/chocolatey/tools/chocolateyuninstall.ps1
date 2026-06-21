$ErrorActionPreference = 'Stop'

[array]$keys = Get-UninstallRegistryKey -SoftwareName 'mdedit*'
foreach ($key in $keys) {
  Uninstall-ChocolateyPackage `
    -PackageName 'mdedit' `
    -FileType 'msi' `
    -SilentArgs "$($key.PSChildName) /qn /norestart" `
    -ValidExitCodes @(0, 3010, 1605, 1614, 1641)
}
