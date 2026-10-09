<#
.SYNOPSIS
    Runs Tests/index.html in headless Chrome and fails on any failing test.

.DESCRIPTION
    The page writes its result into #summary; this reads it back from the dumped DOM.
    A page that never ran its tests prints NOT RUN and fails too. Exit code is the
    number of failed tests, or 1 when the run produced no result. See docs/testing.md.
#>

[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
$Page = Join-Path $RepoRoot 'Tests\index.html'

$Candidates = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
)
$Browser = $Candidates | Where-Object { $_ -and (Test-Path -LiteralPath $_) } | Select-Object -First 1
if (-not $Browser) { Write-Host 'Tests                        FAILED  no Chrome or Edge found' -ForegroundColor Red; exit 1 }

$Url = ([Uri] $Page).AbsoluteUri
$Profile = Join-Path ([IO.Path]::GetTempPath()) ('nm-tests-' + [Guid]::NewGuid())
# Chrome logs to stderr on every run; Windows PowerShell would make that terminating.
$ErrorActionPreference = 'Continue'
try {
    $Dom = & $Browser --headless=new --disable-gpu --no-first-run --no-default-browser-check `
        --allow-file-access-from-files "--user-data-dir=$Profile" --dump-dom $Url 2>$null | Out-String
} finally {
    Remove-Item -LiteralPath $Profile -Recurse -Force -ErrorAction SilentlyContinue
    $ErrorActionPreference = 'Stop'
}

$Match = [regex]::Match($Dom, '<pre id="summary">([\s\S]*?)</pre>')
if (-not $Match.Success) { Write-Host 'Tests                        FAILED  no result in the page' -ForegroundColor Red; exit 1 }
$Text = [Net.WebUtility]::HtmlDecode($Match.Groups[1].Value).Trim()
$Lines = $Text -split "`n"
$Last = $Lines[-1]

if ($Last -match '^PASSED (\d+)/(\d+)$') {
    Write-Host ('{0,-28} {1,-6} {2} tests' -f 'Tests', 'OK', $Matches[2]) -ForegroundColor Green
    exit 0
}
$Failed = @($Lines | Where-Object { $_ -like 'FAIL *' })
Write-Host ('{0,-28} {1,-6} {2}' -f 'Tests', 'FAILED', $Last) -ForegroundColor Red
foreach ($Line in $Failed) { Write-Host "    $Line" }
exit [Math]::Max(1, $Failed.Count)
