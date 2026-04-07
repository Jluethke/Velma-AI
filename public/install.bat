@echo off
title SkillChain Installer
setlocal enabledelayedexpansion

:: Safety net — if ANYTHING causes the script to exit unexpectedly, pause first
:: so the user can actually read the error instead of the window vanishing.
if "%~1"=="--inner" goto :main
cmd /k "%~f0" --inner
exit /b

:main
echo.
echo   SkillChain - AI Skill Marketplace
echo   ==================================
echo.

set "SC_DIR=%USERPROFILE%\.skillchain"
set "DOWNLOAD_URL=https://velma-ai.vercel.app/skillchain-mcp-0.1.0.tar.gz"
set "NODE_VERSION=22.15.0"
set "NODE_URL=https://nodejs.org/dist/v%NODE_VERSION%/node-v%NODE_VERSION%-x64.msi"

:: ================================================================
:: Step 1: Ensure Node.js is available
:: ================================================================
echo   [1/7] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo   Node.js not found. Installing automatically...
    echo.

    :: Check if curl is available
    curl --version >nul 2>&1
    if !errorlevel! neq 0 (
        echo   ERROR: curl not found. Cannot download Node.js.
        echo   Please install Node.js manually from https://nodejs.org
        echo   Then re-run this installer.
        goto :failed
    )

    echo   Downloading Node.js v%NODE_VERSION%...
    curl -sSL -o "%TEMP%\node-installer.msi" "%NODE_URL%"
    if !errorlevel! neq 0 (
        echo   ERROR: Failed to download Node.js.
        echo   Please install Node.js manually from https://nodejs.org
        goto :failed
    )

    echo   Installing Node.js ^(this may take a minute and request admin access^)...
    msiexec /i "%TEMP%\node-installer.msi" /qn /norestart
    if !errorlevel! neq 0 (
        echo.
        echo   Automatic install needs admin access. Trying interactive install...
        msiexec /i "%TEMP%\node-installer.msi"
        if !errorlevel! neq 0 (
            echo   ERROR: Node.js installation failed.
            echo   Please install Node.js manually from https://nodejs.org
            del "%TEMP%\node-installer.msi" 2>nul
            goto :failed
        )
    )
    del "%TEMP%\node-installer.msi" 2>nul

    :: Refresh PATH so we can find node/npm in this session
    set "PATH=%ProgramFiles%\nodejs;%LOCALAPPDATA%\Programs\nodejs;%PATH%"

    node --version >nul 2>&1
    if !errorlevel! neq 0 (
        echo   ERROR: Node.js installed but not found on PATH.
        echo   Please close this window, open a new terminal, and re-run the installer.
        goto :failed
    )
    for /f "tokens=*" %%v in ('node --version') do echo   Installed Node.js %%v
) else (
    for /f "tokens=*" %%v in ('node --version') do echo   Found Node.js %%v
)

:: ================================================================
:: Step 2: Create directories
:: ================================================================
echo   [2/7] Setting up directories...
if not exist "%SC_DIR%" mkdir "%SC_DIR%"
if not exist "%SC_DIR%\skills" mkdir "%SC_DIR%\skills"
if not exist "%SC_DIR%\state" mkdir "%SC_DIR%\state"
if not exist "%SC_DIR%\chains" mkdir "%SC_DIR%\chains"
if not exist "%SC_DIR%\server" mkdir "%SC_DIR%\server"
if not exist "%SC_DIR%\marketplace" mkdir "%SC_DIR%\marketplace"
if not exist "%SC_DIR%\marketplace\chains" mkdir "%SC_DIR%\marketplace\chains"

:: ================================================================
:: Step 3: Download and extract
:: ================================================================
echo   [3/7] Downloading SkillChain...
curl -sSL -o "%TEMP%\skillchain-mcp.tar.gz" "%DOWNLOAD_URL%"
if %errorlevel% neq 0 (
    echo   ERROR: Download failed.
    echo   URL: %DOWNLOAD_URL%
    goto :failed
)

echo   Extracting...
tar -xzf "%TEMP%\skillchain-mcp.tar.gz" -C "%SC_DIR%"
if %errorlevel% neq 0 (
    echo   ERROR: Extraction failed.
    goto :failed
)
del "%TEMP%\skillchain-mcp.tar.gz" 2>nul
echo   Downloaded and extracted.

:: ================================================================
:: Step 4: Install Node.js dependencies
:: ================================================================
echo   [4/7] Installing server dependencies...
cd /d "%SC_DIR%\server"
npm install --omit=dev --silent 2>nul
if %errorlevel% neq 0 (
    echo   Retrying npm install...
    npm install --omit=dev 2>nul
    if !errorlevel! neq 0 (
        echo   ERROR: npm install failed.
        goto :failed
    )
)

:: ================================================================
:: Step 5: Configure Claude Code (if installed)
:: ================================================================
echo   [5/7] Configuring Claude Code...
set "CLAUDE_SETTINGS=%USERPROFILE%\.claude\settings.json"
if not exist "%USERPROFILE%\.claude" mkdir "%USERPROFILE%\.claude"

:: Use Node.js to safely merge into settings.json
node -e "const fs=require('fs'),p='%CLAUDE_SETTINGS%'.replace(/\\/g,'/');let s={};try{s=JSON.parse(fs.readFileSync(p,'utf-8'))}catch{}if(!s.mcpServers)s.mcpServers={};s.mcpServers.skillchain={command:'node',args:['%SC_DIR%\\server\\index.js'.replace(/\\/g,'/')],env:{}};fs.writeFileSync(p,JSON.stringify(s,null,2),'utf-8');console.log('  MCP server registered in '+p)"
if %errorlevel% neq 0 (
    echo   WARNING: Could not auto-configure Claude Code.
    echo   You may need to add the MCP server manually to ~/.claude/settings.json
)

:: ================================================================
:: Step 6: Register in Add/Remove Programs
:: ================================================================
echo   [6/7] Registering in Add/Remove Programs...
set "UNINSTALL_KEY=HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\SkillChain"
reg add "%UNINSTALL_KEY%" /v "DisplayName" /t REG_SZ /d "SkillChain - AI Skill Marketplace" /f >nul 2>&1
reg add "%UNINSTALL_KEY%" /v "DisplayVersion" /t REG_SZ /d "0.1.0" /f >nul 2>&1
reg add "%UNINSTALL_KEY%" /v "Publisher" /t REG_SZ /d "The Wayfinder Trust" /f >nul 2>&1
reg add "%UNINSTALL_KEY%" /v "InstallLocation" /t REG_SZ /d "%SC_DIR%" /f >nul 2>&1
reg add "%UNINSTALL_KEY%" /v "UninstallString" /t REG_SZ /d "\"%SC_DIR%\uninstall.bat\"" /f >nul 2>&1
reg add "%UNINSTALL_KEY%" /v "NoModify" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "%UNINSTALL_KEY%" /v "NoRepair" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "%UNINSTALL_KEY%" /v "URLInfoAbout" /t REG_SZ /d "https://velma-ai.vercel.app" /f >nul 2>&1
echo   Registered.

:: Create uninstaller
(
echo @echo off
echo title SkillChain Uninstaller
echo echo.
echo echo   SkillChain Uninstaller
echo echo   ======================
echo echo.
echo set /p CONFIRM="  Remove SkillChain? ^(y/n^): "
echo if /i not "%%CONFIRM%%"=="y" ^( echo   Cancelled. ^& pause ^& exit /b 0 ^)
echo echo   Removing...
echo reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\SkillChain" /f ^>nul 2^>^&1
echo rmdir /s /q "%%USERPROFILE%%\.skillchain" 2^>nul
echo echo   Done. You may also want to remove 'skillchain' from ~/.claude/settings.json
echo pause
) > "%SC_DIR%\uninstall.bat"

:: ================================================================
:: Step 7: Initialize profiles and validate
:: ================================================================
echo   [7/7] Initializing and validating...
if not exist "%SC_DIR%\trainer.json" (
    echo {"xp":0,"level":1,"title":"Novice","skills_discovered":[],"chains_completed":[],"achievements_unlocked":{},"streak_current":0,"streak_best":0,"streak_last_date":"","evolution_levels":{},"daily_runs_today":[],"daily_runs_date":"","categories_today":[],"total_skill_runs":0,"total_chain_runs":0} > "%SC_DIR%\trainer.json"
)
if not exist "%SC_DIR%\profile.json" (
    echo {"display_name":"","role":"","industry":"","stage":"","team_size":"","experience_level":"","tech_stack":[],"goals":[],"preferred_output_style":"structured","preferred_tone":"friendly","favorite_domains":[],"skills_used":[],"chains_used":[],"created_at":"","updated_at":""} > "%SC_DIR%\profile.json"
)

set "VALID=1"

if exist "%SC_DIR%\server\index.js" (
    echo   MCP server: OK
) else (
    echo   WARNING: MCP server files not found.
    set "VALID=0"
)

if exist "%CLAUDE_SETTINGS%" (
    node -e "const s=JSON.parse(require('fs').readFileSync('%CLAUDE_SETTINGS%'.replace(/\\/g,'/'),'utf-8'));if(s.mcpServers&&s.mcpServers.skillchain)console.log('  Claude config: OK');else{console.log('  WARNING: not in Claude settings');process.exit(1)}" 2>nul
    if !errorlevel! neq 0 set "VALID=0"
) else (
    echo   Claude Code: not installed ^(install later from claude.ai/code^)
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
echo     1. Install Claude Code from https://claude.ai/code ^(if you haven't^)
echo     2. Open Claude Code and just talk normally
echo     3. Say things like:
echo        - "I hate my job"
echo        - "I feel stuck"
echo        - "help me budget"
echo        - "I'm scared of AI"
echo     4. Claude will find the right skill chain
echo        and walk you through it
echo.
echo   Your AI just got 126 skills and 92 chains.
echo   No extra apps. No websites. Just talk.
echo.
echo   Press any key to close...
pause >nul
exit /b 0

:failed
echo.
echo   ========================================
echo   Installation FAILED
echo   ========================================
echo.
echo   Check the error messages above and try again.
echo.
echo   Press any key to close...
pause >nul
exit /b 1
