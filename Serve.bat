@echo off
rem Serves site/ and its own shelf (shelf.local.json) on http://127.0.0.1:8737 and opens it. Ctrl+C stops it.
rem A shelf server still holding the port, left running from before, is stopped first, so the page
rem always talks to Server\shelf.py as it is now. Anything else on the port is left alone.
cd /d "%~dp0"
powershell -NoProfile -Command "$l = Get-NetTCPConnection -LocalPort 8737 -State Listen -ErrorAction SilentlyContinue; foreach ($id in @($l | ForEach-Object OwningProcess | Select-Object -Unique)) { $p = Get-CimInstance Win32_Process -Filter ('ProcessId=' + $id); if ($p.CommandLine -match 'shelf\.py') { Stop-Process -Id $id -Force; Write-Host ('Stopped the shelf server already running (process ' + $id + ').') } else { Write-Host ('Port 8737 is held by ' + $p.Name + ' (process ' + $id + '), not a shelf server: left running.') } }; Start-Sleep -Milliseconds 300"
start "" http://127.0.0.1:8737/
python Server\shelf.py --site site --data shelf.local.json --bind 127.0.0.1 --port 8737
if errorlevel 1 pause
