@echo off
title SkillChain Installer
setlocal enabledelayedexpansion
echo.
echo   SkillChain - AI Skill Marketplace
echo   ==================================
echo.

set "INSTALL_OK=1"
set "SC_DIR=%USERPROFILE%\.skillchain"

:: Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo   Python not found. Installing Python...
    echo.
    echo   Downloading Python 3.11...
    curl -sSL -o "%TEMP%\python-installer.exe" "https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe"
    if %errorlevel% neq 0 (
        echo   ERROR: Could not download Python.
        echo   Please install Python 3.11+ from https://python.org
        goto :failed
    )
    :: Verify SHA256 checksum (official Python.org hash)
    echo   Verifying download integrity...
    certutil -hashfile "%TEMP%\python-installer.exe" SHA256 | findstr /i "d6a66dcef3a8e5b26a554a77e0da8e59ecdbd29a02c2260b222c6bcc86020ab5" >nul 2>&1
    if %errorlevel% neq 0 (
        echo   WARNING: Checksum verification failed.
        echo   The download may be corrupted or tampered with.
        echo   Please download Python manually from https://python.org
        del "%TEMP%\python-installer.exe" 2>nul
        goto :failed
    )
    echo   Checksum verified.
    echo   Installing Python ^(this may take a minute^)...
    "%TEMP%\python-installer.exe" /quiet InstallAllUsers=0 PrependPath=1 Include_pip=1
    if %errorlevel% neq 0 (
        echo   ERROR: Python installation failed.
        echo   Please install Python 3.11+ manually from https://python.org
        goto :failed
    )
    echo   Python installed successfully.
    echo.
    :: Refresh PATH
    set "PATH=%LOCALAPPDATA%\Programs\Python\Python311;%LOCALAPPDATA%\Programs\Python\Python311\Scripts;%PATH%"
)

:: Install SkillChain
echo   [1/6] Installing SkillChain SDK...
pip install skillchain --quiet 2>nul
if %errorlevel% neq 0 (
    echo   Note: pip install skillchain failed, installing dependencies directly...
    pip install click cryptography rich requests numpy --quiet 2>nul
    if %errorlevel% neq 0 (
        echo   ERROR: Could not install dependencies.
        goto :failed
    )
)

:: Initialize SkillChain
echo   [2/6] Configuring Claude Code integration...
python -c "from skillchain.sdk.mcp_bridge.claude_settings import install_mcp_server; install_mcp_server()" 2>nul
if %errorlevel% neq 0 (
    echo   WARNING: Could not auto-configure Claude Code.
    echo   You may need to add the MCP server manually.
)

:: Create directories
echo   [3/6] Setting up directories...
if not exist "%SC_DIR%" mkdir "%SC_DIR%"
if not exist "%SC_DIR%\skills" mkdir "%SC_DIR%\skills"
if not exist "%SC_DIR%\state" mkdir "%SC_DIR%\state"
if not exist "%SC_DIR%\chains" mkdir "%SC_DIR%\chains"
if not exist "%SC_DIR%\bin" mkdir "%SC_DIR%\bin"

:: Initialize trainer
echo   [4/6] Creating trainer profile...
python -c "from skillchain.sdk.gamification import GamificationEngine; e = GamificationEngine(); print(f'  Level {e.get_trainer_card()[\"level\"]} {e.get_trainer_card()[\"title\"]}')" 2>nul

:: Register PATH using PowerShell (safe, no truncation, no 1024 char limit)
echo   [5/6] Registering PATH...
set "BIN_DIR=%SC_DIR%\bin"

:: Create a wrapper CMD that invokes the SDK CLI
echo @echo off > "%BIN_DIR%\skillchain.cmd"
echo python -m skillchain.sdk.cli %%* >> "%BIN_DIR%\skillchain.cmd"

:: Use PowerShell to safely append to user PATH without truncation
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$binDir = '%BIN_DIR%'; " ^
  "$currentPath = [Environment]::GetEnvironmentVariable('Path', 'User'); " ^
  "if ($currentPath -and $currentPath.Split(';') -contains $binDir) { " ^
  "  Write-Host '  Already on PATH.'; " ^
  "} else { " ^
  "  $newPath = if ($currentPath) { $currentPath.TrimEnd(';') + ';' + $binDir } else { $binDir }; " ^
  "  [Environment]::SetEnvironmentVariable('Path', $newPath, 'User'); " ^
  "  $env:Path = $newPath + ';' + $env:Path; " ^
  "  Write-Host '  Added to PATH:' $binDir; " ^
  "  Write-Host '  Restart your terminal for PATH changes to take effect.'; " ^
  "}"
if %errorlevel% neq 0 (
    echo   WARNING: Could not add to PATH automatically.
    echo   Manually add to PATH: %BIN_DIR%
)

:: Validate installation
echo   [6/6] Validating installation...
set "VALID=1"

if not exist "%SC_DIR%\marketplace" (
    echo   Marketplace: Skills load on first use from the network.
)

python -c "from skillchain.sdk.mcp_bridge.server import create_server; s = create_server(); print('  MCP server: OK')" 2>nul
if %errorlevel% neq 0 (
    echo   WARNING: MCP server import failed.
    echo   Ensure 'mcp' package is installed: pip install mcp
    set "VALID=0"
)

if exist "%USERPROFILE%\.claude\settings.json" (
    python -c "import json; s=json.load(open(r'%USERPROFILE%\.claude\settings.json')); assert 'skillchain' in s.get('mcpServers',{}); print('  Claude config: OK')" 2>nul
    if %errorlevel% neq 0 (
        echo   WARNING: SkillChain not found in Claude MCP settings.
        set "VALID=0"
    )
) else (
    echo   WARNING: Claude settings.json not found.
    set "VALID=0"
)

echo.
if "%VALID%"=="1" (
    echo   ========================================
    echo   Installation complete! All checks passed.
    echo   ========================================
) else (
    echo   ========================================
    echo   Installation complete with warnings.
    echo   ========================================
    echo   Check the warnings above.
)
echo.
echo   What happens now:
echo     1. Restart Claude Code ^(or any AI with MCP support^)
echo     2. Just talk to it normally
echo     3. Say things like:
echo        - "I hate my job"
echo        - "I feel stuck"
echo        - "help me budget"
echo        - "I'm scared of AI"
echo     4. Claude will find the right skill chain
echo        and walk you through it
echo.
echo   Your AI just got 120 skills and 65 chains.
echo   No extra apps. No websites. Just talk.
echo.
pause
goto :eof

:failed
echo.
echo   ========================================
echo   Installation FAILED
echo   ========================================
echo.
echo   Cleaning up partial installation...

:: Clean up partial install
if exist "%SC_DIR%\bin\skillchain.cmd" del "%SC_DIR%\bin\skillchain.cmd" 2>nul

echo   Check the error messages above and try again.
echo   For manual install: pip install skillchain
echo.
pause
exit /b 1
