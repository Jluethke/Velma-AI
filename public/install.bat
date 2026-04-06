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
echo   [1/7] Installing SkillChain SDK...
pip install https://velma-ai.vercel.app/skillchain-0.1.1-py3-none-any.whl --quiet 2>nul
if %errorlevel% neq 0 (
    echo   Note: Direct download failed, trying PyPI fallback...
    pip install skillchain --quiet 2>nul
    if %errorlevel% neq 0 (
        echo   Note: PyPI also failed, installing dependencies directly...
        pip install click cryptography rich requests numpy --quiet 2>nul
        if %errorlevel% neq 0 (
            echo   ERROR: Could not install dependencies.
            goto :failed
        )
    )
)

:: Initialize SkillChain
echo   [2/7] Configuring Claude Code integration...
python -c "from skillchain.sdk.mcp_bridge.claude_settings import install_mcp_server; install_mcp_server()" 2>nul
if %errorlevel% neq 0 (
    echo   WARNING: Could not auto-configure Claude Code.
    echo   You may need to add the MCP server manually.
)

:: Create directories
echo   [3/7] Setting up directories...
if not exist "%SC_DIR%" mkdir "%SC_DIR%"
if not exist "%SC_DIR%\skills" mkdir "%SC_DIR%\skills"
if not exist "%SC_DIR%\state" mkdir "%SC_DIR%\state"
if not exist "%SC_DIR%\chains" mkdir "%SC_DIR%\chains"
if not exist "%SC_DIR%\bin" mkdir "%SC_DIR%\bin"

:: Initialize trainer
echo   [4/7] Creating trainer profile...
python -c "from skillchain.sdk.gamification import GamificationEngine; e = GamificationEngine(); print(f'  Level {e.get_trainer_card()[\"level\"]} {e.get_trainer_card()[\"title\"]}')" 2>nul

:: Register PATH using PowerShell (safe, no truncation, no 1024 char limit)
:: NOTE: We use PowerShell instead of setx because setx is missing on some
:: Windows builds and has a 1024-character limit that can TRUNCATE PATH.
echo   [5/7] Registering PATH...
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
    echo   WARNING: Could not add to PATH automatically via PowerShell.
    echo   Trying fallback method...
    :: Fallback: use reg + setx if PowerShell is unavailable
    for /f "tokens=2,*" %%A in ('reg query "HKCU\Environment" /v Path 2^>nul') do set "CURRENT_PATH=%%B"
    if defined CURRENT_PATH (
        echo !CURRENT_PATH! | findstr /i /c:"%BIN_DIR%" >nul 2>&1
        if !errorlevel! neq 0 (
            C:\Windows\System32\setx.exe PATH "!CURRENT_PATH!;%BIN_DIR%" >nul 2>&1
            if !errorlevel! neq 0 (
                echo   WARNING: Could not add to PATH automatically.
                echo   Please add this to your PATH manually: %BIN_DIR%
                echo   Open: System Properties ^> Environment Variables ^> User PATH ^> New
            ) else (
                echo   Added to PATH via setx: %BIN_DIR%
            )
        )
    ) else (
        C:\Windows\System32\setx.exe PATH "%BIN_DIR%" >nul 2>&1 || (
            echo   WARNING: Could not add to PATH automatically.
            echo   Please add this to your PATH manually: %BIN_DIR%
        )
    )
)

:: Register in Add/Remove Programs
echo   [6/7] Registering in Add/Remove Programs...
set "UNINSTALL_KEY=HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\SkillChain"
reg add "%UNINSTALL_KEY%" /v "DisplayName" /t REG_SZ /d "SkillChain - AI Skill Marketplace" /f >nul 2>&1
reg add "%UNINSTALL_KEY%" /v "DisplayVersion" /t REG_SZ /d "1.0.0" /f >nul 2>&1
reg add "%UNINSTALL_KEY%" /v "Publisher" /t REG_SZ /d "The Wayfinder Trust" /f >nul 2>&1
reg add "%UNINSTALL_KEY%" /v "InstallLocation" /t REG_SZ /d "%SC_DIR%" /f >nul 2>&1
reg add "%UNINSTALL_KEY%" /v "UninstallString" /t REG_SZ /d "\"%SC_DIR%\bin\uninstall.bat\"" /f >nul 2>&1
reg add "%UNINSTALL_KEY%" /v "DisplayIcon" /t REG_SZ /d "%SC_DIR%\bin\skillchain.cmd" /f >nul 2>&1
reg add "%UNINSTALL_KEY%" /v "NoModify" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "%UNINSTALL_KEY%" /v "NoRepair" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "%UNINSTALL_KEY%" /v "URLInfoAbout" /t REG_SZ /d "https://velma-ai.vercel.app" /f >nul 2>&1
echo   Registered.

:: Create uninstaller in install directory (self-contained, no network dependency)
echo   Creating uninstaller...
(
echo @echo off
echo title SkillChain Uninstaller
echo setlocal enabledelayedexpansion
echo echo.
echo echo   SkillChain Uninstaller
echo echo   ======================
echo echo.
echo echo   This will remove SkillChain from your system.
echo echo   Your wallet and on-chain data are NOT affected.
echo echo.
echo set /p CONFIRM="  Are you sure? ^(y/n^): "
echo if /i not "%%CONFIRM%%"=="y" ^(
echo     echo.
echo     echo   Uninstall cancelled.
echo     echo.
echo     pause
echo     exit /b 0
echo ^)
echo echo.
echo echo   [1/5] Removing Claude Code integration...
echo powershell -NoProfile -ExecutionPolicy Bypass -Command "$settingsPath = Join-Path $env:USERPROFILE '.claude\settings.json'; if (Test-Path $settingsPath) { $settings = Get-Content $settingsPath -Raw ^| ConvertFrom-Json; if ($settings.mcpServers.PSObject.Properties['skillchain']) { $settings.mcpServers.PSObject.Properties.Remove('skillchain'); $settings ^| ConvertTo-Json -Depth 10 ^| Set-Content $settingsPath -Encoding UTF8; Write-Host '  Removed from Claude Code settings.'; } else { Write-Host '  Not found in Claude Code settings.'; } } else { Write-Host '  Claude settings.json not found.'; }"
echo echo   [2/5] Removing PATH entry...
echo powershell -NoProfile -ExecutionPolicy Bypass -Command "$binDir = Join-Path $env:USERPROFILE '.skillchain\bin'; $currentPath = [Environment]::GetEnvironmentVariable('Path', 'User'); if ($currentPath -and $currentPath -like \"*$binDir*\") { $newPath = ($currentPath.Split(';') ^| Where-Object { $_ -ne $binDir }) -join ';'; [Environment]::SetEnvironmentVariable('Path', $newPath, 'User'); Write-Host '  Removed from PATH.'; } else { Write-Host '  Not on PATH.'; }"
echo echo   [3/5] Removing SkillChain directory...
echo set "SC_DIR=%%USERPROFILE%%\.skillchain"
echo if exist "%%SC_DIR%%" ^( rmdir /s /q "%%SC_DIR%%" ^& echo   Removed %%SC_DIR%% ^) else ^( echo   Directory not found. ^)
echo echo   [4/5] Removing from Add/Remove Programs...
echo reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\SkillChain" /f ^>nul 2^>^&1
echo echo   [5/5] Uninstalling pip package...
echo pip uninstall skillchain -y --quiet 2^>nul
echo echo.
echo echo   SkillChain has been uninstalled.
echo echo   To reinstall: velma-ai.vercel.app
echo echo.
echo pause
) > "%SC_DIR%\bin\uninstall.bat"

:: Validate installation
echo   [7/7] Validating installation...
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
echo   Your AI just got hundreds of skills and chains.
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
