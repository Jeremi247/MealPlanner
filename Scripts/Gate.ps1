<#
.SYNOPSIS
    The gate: the test suite, then the docs check. Exit code is the total findings.
    See docs/testing.md.
#>

[CmdletBinding()]
param()

$Total = 0
& (Join-Path $PSScriptRoot 'Test.ps1');      $Total += $LASTEXITCODE
& (Join-Path $PSScriptRoot 'CheckDocs.ps1'); $Total += $LASTEXITCODE

if ($Total -eq 0) { Write-Host 'Gate                         OK' -ForegroundColor Green }
else { Write-Host "Gate                         FAILED  $Total findings" -ForegroundColor Red }
exit $Total
