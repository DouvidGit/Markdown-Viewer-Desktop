$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$portableExe = Join-Path $scriptDir "dist\win-unpacked\Markdown Viewer.exe"

if (-not (Test-Path -LiteralPath $portableExe)) {
  throw "Cannot find packaged app: $portableExe. Run npm run dist first."
}

$appKey = "MarkdownViewer.md"
$command = "`"$portableExe`" `"%1`""

New-Item -Path "HKCU:\Software\Classes\$appKey\shell\open\command" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\Software\Classes\$appKey" -Name "(default)" -Value "Markdown Viewer Document"
Set-ItemProperty -Path "HKCU:\Software\Classes\$appKey\shell\open\command" -Name "(default)" -Value $command

New-Item -Path "HKCU:\Software\Classes\.md" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\Software\Classes\.md" -Name "(default)" -Value $appKey

New-Item -Path "HKCU:\Software\Classes\.markdown" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\Software\Classes\.markdown" -Name "(default)" -Value $appKey

Write-Host "Markdown Viewer has been registered for .md and .markdown files."
Write-Host "If Windows does not update immediately, open Settings > Apps > Default apps and choose Markdown Viewer for .md."
