@echo off
rem Serves site/ on http://127.0.0.1:8737 and opens it. Ctrl+C stops it.
cd /d "%~dp0"
start "" http://127.0.0.1:8737/
python -m http.server 8737 --bind 127.0.0.1 --directory site
