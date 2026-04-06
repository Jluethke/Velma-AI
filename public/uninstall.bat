@echo off
title SkillChain Uninstaller
setlocal enabledelayedexpansion
echo.
echo   SkillChain Uninstaller
echo   ======================
echo.
echo   This will remove SkillChain from your system.
echo   Your wallet and on-chain data are NOT affected.
echo.
set /p CONFIRM="  Are you sure? (y/n): "
if /i not "%CONFIRM%"=="y" (
    echo.
    echo   Uninstall cancelled.
    echo.
    pause
    exit /b 0
)

echo.
echo   [1/4] Removing Claude Code integration...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$settingsPath = Join-Path $env:USERPROFILE '.claude\settings.json'; " ^
  "if (Test-Path $settingsPath) { " ^
  "  $settings = Get-Content $settingsPath -Raw | ConvertFrom-Json; " ^
  "  if ($settings.mcpServers.PSObject.Properties['skillchain']) { " ^
  "    $settings.mcpServers.PSObject.Properties.Remove('skillchain'); " ^
  "    $settings | ConvertTo-Json -Depth 10 | Set-Content $settingsPath -Encoding UTF8; " ^
  "    Write-Host '  Removed from Claude Code settings.'; " ^
  "  } else { " ^
  "    Write-Host '  Not found in Claude Code settings.'; " ^
  "  } " ^
  "} else { " ^
  "  Write-Host '  Claude settings.json not found.'; " ^
  "}"

echo   [2/4] Removing PATH entry...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$binDir = Join-Path $env:USERPROFILE '.skillchain\bin'; " ^
  "$currentPath = [Environment]::GetEnvironmentVariable('Path', 'User'); " ^
  "if ($currentPath -and $currentPath -like \"*$binDir*\") { " ^
  "  $newPath = ($currentPath.Split(';') | Where-Object { $_ -ne $binDir }) -join ';'; " ^
  "  [Environment]::SetEnvironmentVariable('Path', $newPath, 'User'); " ^
  "  Write-Host '  Removed from PATH.'; " ^
  "} else { " ^
  "  Write-Host '  Not on PATH.'; " ^
  "}"

echo   [3/4] Removing SkillChain directory...
set "SC_DIR=%USERPROFILE%\.skillchain"
if exist "%SC_DIR%" (
    rmdir /s /q "%SC_DIR%"
    echo   Removed %SC_DIR%
) else (
    echo   Directory not found.
)

echo   [4/5] Removing from Add/Remove Programs...
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\SkillChain" /f >nul 2>&1
if %errorlevel% equ 0 (
    echo   Registry entry removed.
) else (
    echo   Registry entry not found.
)

echo   [5/5] Uninstalling pip package...
pip uninstall skillchain -y --quiet 2>nul
if %errorlevel% equ 0 (
    echo   Package removed.
) else (
    echo   Package not found or already removed.
)

echo.
echo   ========================================
echo   SkillChain has been uninstalled.
echo   ========================================
echo.
echo   What was removed:
echo     - MCP server from Claude Code
echo     - ~/.skillchain/ directory
echo     - skillchain pip package
echo     - PATH entry
echo.
echo   What was NOT removed:
echo     - Your wallet and TRUST tokens
echo     - Any on-chain data
echo     - Your Claude Code installation
echo.
echo   To reinstall: velma-ai.vercel.app
echo.
pause
