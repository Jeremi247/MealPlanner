@echo off
rem Serves site/ and its own shelf (shelf.local.json) on http://127.0.0.1:8737 and opens it. Ctrl+C stops it.
cd /d "%~dp0"
start "" http://127.0.0.1:8737/
python Server\shelf.py --site site --data shelf.local.json --bind 127.0.0.1 --port 8737
if errorlevel 1 pause
