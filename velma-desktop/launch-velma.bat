@echo off
:: Velma Desktop Launcher — single instance
tasklist /FI "IMAGENAME eq electron.exe" 2>NUL | find /I "electron.exe" >NUL
if "%ERRORLEVEL%"=="0" (
  echo Velma already running.
  exit /b 0
)
cd /d "%~dp0"
start "" "node_modules\.bin\electron.cmd" .
