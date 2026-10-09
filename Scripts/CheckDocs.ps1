<#
.SYNOPSIS
    Fails when a markdown link does not resolve, or a doc is over its word budget.

.DESCRIPTION
    Links: every relative link in CLAUDE.md and docs/**/*.md must name a file or
    directory that exists, and its #anchor, if any, a heading in the target, slugged
    the way GitHub does it. Links inside fenced code and inline code are skipped.

    Budgets (docs/conventions/docs-and-comments.md), words counted as runs of
    non-whitespace:
      CLAUDE.md          over 480
      todo detail files  docs/todo/P*/*.md, over 360
      record openings    docs/decisions/0*.md: the Scope paragraph plus the Decision
                         and Consequences sections, over 480
      topic docs         everything else under docs/ but the template, over 1440

    Exit code is the number of findings. Run by Scripts/Gate.ps1.
#>

[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
$Docs = Join-Path $RepoRoot 'docs'

function Get-Rel([string] $Path) { $Path.Substring($RepoRoot.Length + 1) }

function Get-Prose([string[]] $Lines) {
    $InFence = $false
    foreach ($Line in $Lines) {
        if ($Line -match '^\s*```') { $InFence = -not $InFence; continue }
        if (-not $InFence) { $Line -replace '`[^`]*`', '' }
    }
}

function Get-Slug([string] $Heading) {
    $s = $Heading.Trim().ToLowerInvariant() -replace '`', ''
    $s = $s -replace '[^\p{L}\p{N}\s_-]', ''
    return ($s -replace '\s', '-')
}

function Get-Anchors([string] $File) {
    $Lines = Get-Content -LiteralPath $File -Encoding UTF8
    return @(Get-Prose $Lines | Where-Object { $_ -match '^#{1,6}\s+(.+)$' } | ForEach-Object { Get-Slug ($_ -replace '^#{1,6}\s+', '') })
}

function Measure-Words([string[]] $Lines) {
    $n = 0
    foreach ($Line in $Lines) { $n += @($Line -split '\s+' | Where-Object { $_ -ne '' }).Count }
    return $n
}

$Files = @(Get-Item -LiteralPath (Join-Path $RepoRoot 'CLAUDE.md')) + @(Get-ChildItem -LiteralPath $Docs -Filter '*.md' -Recurse -File)

# --- Links -------------------------------------------------------------------

$LinkFindings = New-Object System.Collections.Generic.List[string]
$Checked = 0
foreach ($File in $Files) {
    $Lines = Get-Content -LiteralPath $File.FullName -Encoding UTF8
    foreach ($Line in (Get-Prose $Lines)) {
        foreach ($m in [regex]::Matches($Line, '\[[^\]]*\]\(([^)\s]+)\)')) {
            $Target = $m.Groups[1].Value
            if ($Target -match '^(https?|mailto):') { continue }
            $Checked++
            $Path, $Anchor = $Target -split '#', 2
            $Resolved = if ($Path) { [IO.Path]::GetFullPath((Join-Path $File.DirectoryName $Path)) } else { $File.FullName }
            if (-not (Test-Path -LiteralPath $Resolved)) { $LinkFindings.Add("$(Get-Rel $File.FullName): $Target does not exist"); continue }
            if ($Anchor -and (Test-Path -LiteralPath $Resolved -PathType Leaf)) {
                if ((Get-Anchors $Resolved) -notcontains $Anchor) { $LinkFindings.Add("$(Get-Rel $File.FullName): #$Anchor is not a heading in $Path") }
            }
        }
    }
}

# --- Budgets -----------------------------------------------------------------

$BudgetFindings = New-Object System.Collections.Generic.List[string]
foreach ($File in $Files) {
    $Rel = (Get-Rel $File.FullName) -replace '\\', '/'
    if ($Rel -eq 'docs/_template.md' -or $Rel -eq 'docs/todo/_item.md' -or $Rel -eq 'docs/decisions/README.md' -or $Rel -match '^docs/todo/P\d\.md$') { continue }
    $Lines = @(Get-Content -LiteralPath $File.FullName -Encoding UTF8)
    if ($Rel -eq 'CLAUDE.md') { $Cap = 480; $Words = Measure-Words $Lines }
    elseif ($Rel -match '^docs/todo/P\d/') { $Cap = 360; $Words = Measure-Words $Lines }
    elseif ($Rel -match '^docs/decisions/0') {
        $Cap = 480
        $Opening = New-Object System.Collections.Generic.List[string]
        $Section = ''
        foreach ($Line in $Lines) {
            if ($Line -match '^##\s+(.+)$') { $Section = $Matches[1].Trim(); continue }
            if ($Line -match '^Scope:' -or $Section -eq 'Decision' -or $Section -eq 'Consequences') { $Opening.Add($Line) }
        }
        if (-not ($Lines -match '^## Decision$')) { $BudgetFindings.Add("${Rel}: no '## Decision' section") }
        $Words = Measure-Words $Opening
    }
    else { $Cap = 1440; $Words = Measure-Words $Lines }
    if ($Words -gt $Cap) { $BudgetFindings.Add("${Rel}: $Words words, over $Cap") }
}

function Write-Summary([string] $Name, [string] $Detail, $Findings) {
    $Ok = $Findings.Count -eq 0
    Write-Host ('{0,-28} {1,-6} {2}  {3} findings' -f $Name, $(if ($Ok) { 'OK' } else { 'FAILED' }), $Detail, $Findings.Count) -ForegroundColor $(if ($Ok) { 'Green' } else { 'Red' })
    foreach ($f in $Findings) { Write-Host "    $f" }
}

Write-Summary 'Links' "$Checked links" $LinkFindings
Write-Summary 'Budgets' "$($Files.Count) files" $BudgetFindings
exit ($LinkFindings.Count + $BudgetFindings.Count)
