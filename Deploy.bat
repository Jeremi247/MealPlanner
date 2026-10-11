@echo off
rem Runs the gate, then ships site/ and Server/ to onee-chan (by address), served at https://mealplanner.home/.
rem Nothing is deployed when the gate fails. See docs/deploy.md.
setlocal
cd /d "%~dp0"
set "SERVER=jeremi@192.168.1.31"
set "RC=1"

powershell -NoProfile -ExecutionPolicy Bypass -File Scripts\Gate.ps1
if errorlevel 1 (
	echo Gate failed: nothing deployed.
	goto :end
)

echo Deploying to %SERVER% ...
"%SystemRoot%\System32\tar.exe" -cf - -C Server compose.yaml Caddyfile install.sh shelf.py -C .. site | ssh %SERVER% "rm -rf ~/mealplanner/incoming && mkdir -p ~/mealplanner/incoming && tar -xf - -C ~/mealplanner/incoming && sh ~/mealplanner/incoming/install.sh"
if errorlevel 1 (
	echo Deploy FAILED.
	goto :end
)
echo Deployed: https://mealplanner.home/
set "RC=0"

:end
rem Keep the window open when started from Explorer.
echo %cmdcmdline% | find /i "%~nx0" >nul && pause
exit /b %RC%
