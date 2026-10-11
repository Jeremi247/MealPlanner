<#
.SYNOPSIS
    Runs Tests/test_shelf.py, the shelf server's tests, and fails on any failing test.

.DESCRIPTION
    Exit code is the number of failed tests, or 1 when Python is missing or the run
    produced no result. See docs/testing.md.
#>

[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
$Python = Get-Command python -ErrorAction SilentlyContinue
if (-not $Python) { Write-Host 'Server tests                 FAILED  no python on PATH' -ForegroundColor Red; exit 1 }

# unittest reports on stderr; Windows PowerShell would make that terminating.
$ErrorActionPreference = 'Continue'
$Out = & $Python.Source -m unittest (Join-Path $RepoRoot 'Tests\test_shelf.py') 2>&1 | ForEach-Object { "$_" }
$ErrorActionPreference = 'Stop'

$Ran = $Out | Where-Object { $_ -match '^Ran (\d+) tests?' } | Select-Object -First 1
if (-not $Ran) {
    Write-Host 'Server tests                 FAILED  no result' -ForegroundColor Red
    $Out | ForEach-Object { Write-Host "    $_" }
    exit 1
}
$Count = [regex]::Match($Ran, '\d+').Value
$Summary = $Out | Where-Object { $_ -match '^(OK|FAILED)' } | Select-Object -Last 1
if ($Summary -like 'OK*') {
    Write-Host ('{0,-28} {1,-6} {2} tests' -f 'Server tests', 'OK', $Count) -ForegroundColor Green
    exit 0
}
$Failed = @($Out | Where-Object { $_ -match '^(FAIL|ERROR): ' })
Write-Host ('{0,-28} {1,-6} {2}' -f 'Server tests', 'FAILED', $Summary) -ForegroundColor Red
foreach ($Line in $Failed) { Write-Host "    $Line" }
exit [Math]::Max(1, $Failed.Count)
