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

:: ================================================================
:: Step 1: Verify Node.js (ships with Claude Code)
:: ================================================================
echo   [1/7] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo   ERROR: Node.js not found.
    echo.
    echo   SkillChain requires Claude Code, which includes Node.js.
    echo   Install Claude Code first: https://claude.ai/download
    echo.
    echo   If you already have Claude Code, try restarting your terminal.
    goto :failed
)
for /f "tokens=*" %%v in ('node --version') do echo   Found Node.js %%v

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
powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri '%DOWNLOAD_URL%' -OutFile '%TEMP%\skillchain-mcp.tar.gz' -UseBasicParsing"
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
:: Step 5: Auto-configure any detected MCP clients
:: ================================================================
echo   [5/7] Configuring MCP clients...
set "SERVER_PATH=%SC_DIR%\server\index.js"
set "CONFIGURED=0"

:: --- Claude Code ---
set "CLAUDE_SETTINGS=%USERPROFILE%\.claude\settings.json"
if exist "%USERPROFILE%\.claude" (
    node -e "const fs=require('fs'),p='%CLAUDE_SETTINGS%'.replace(/\\/g,'/');let s={};try{s=JSON.parse(fs.readFileSync(p,'utf-8'))}catch{}if(!s.mcpServers)s.mcpServers={};s.mcpServers.skillchain={command:'node',args:['%SERVER_PATH%'.replace(/\\/g,'/')],env:{}};fs.writeFileSync(p,JSON.stringify(s,null,2),'utf-8');console.log('  Claude Code: configured')" 2>nul && set "CONFIGURED=1"
) else (
    echo   Claude Code: not detected
)

:: --- Cursor ---
set "CURSOR_SETTINGS=%USERPROFILE%\.cursor\mcp.json"
if exist "%USERPROFILE%\.cursor" (
    node -e "const fs=require('fs'),p='%CURSOR_SETTINGS%'.replace(/\\/g,'/');let s={};try{s=JSON.parse(fs.readFileSync(p,'utf-8'))}catch{}if(!s.mcpServers)s.mcpServers={};s.mcpServers.skillchain={command:'node',args:['%SERVER_PATH%'.replace(/\\/g,'/')],env:{}};fs.writeFileSync(p,JSON.stringify(s,null,2),'utf-8');console.log('  Cursor: configured')" 2>nul && set "CONFIGURED=1"
) else (
    echo   Cursor: not detected
)

:: --- Windsurf ---
set "WINDSURF_SETTINGS=%USERPROFILE%\.codeium\windsurf\mcp_config.json"
if exist "%USERPROFILE%\.codeium\windsurf" (
    node -e "const fs=require('fs'),p='%WINDSURF_SETTINGS%'.replace(/\\/g,'/');let s={};try{s=JSON.parse(fs.readFileSync(p,'utf-8'))}catch{}if(!s.mcpServers)s.mcpServers={};s.mcpServers.skillchain={command:'node',args:['%SERVER_PATH%'.replace(/\\/g,'/')],env:{}};fs.writeFileSync(p,JSON.stringify(s,null,2),'utf-8');console.log('  Windsurf: configured')" 2>nul && set "CONFIGURED=1"
) else (
    echo   Windsurf: not detected
)

:: --- VS Code (Copilot MCP) ---
set "VSCODE_SETTINGS=%USERPROFILE%\.vscode\mcp.json"
if exist "%USERPROFILE%\.vscode" (
    node -e "const fs=require('fs'),p='%VSCODE_SETTINGS%'.replace(/\\/g,'/');let s={};try{s=JSON.parse(fs.readFileSync(p,'utf-8'))}catch{}if(!s.servers)s.servers={};s.servers.skillchain={command:'node',args:['%SERVER_PATH%'.replace(/\\/g,'/')],env:{}};fs.writeFileSync(p,JSON.stringify(s,null,2),'utf-8');console.log('  VS Code: configured')" 2>nul && set "CONFIGURED=1"
) else (
    echo   VS Code: not detected
)

if "%CONFIGURED%"=="0" (
    echo.
    echo   No MCP client found. You need one to use SkillChain.
    echo.
    echo   Opening Claude Code download page...
    start "" "https://claude.ai/download"
    echo.
    echo   After installing Claude Code:
    echo     1. Open it and sign in
    echo     2. Re-run this installer ^(it will auto-configure^)
    echo     3. Just talk. Say "I feel stuck" or "help me budget"
    echo.
    echo   Or use any MCP-compatible app: Cursor, Windsurf, VS Code
    echo.
    :: Pre-create Claude dir and settings so it's ready when they install
    if not exist "%USERPROFILE%\.claude" mkdir "%USERPROFILE%\.claude"
    node -e "const fs=require('fs'),p='%CLAUDE_SETTINGS%'.replace(/\\/g,'/');let s={};try{s=JSON.parse(fs.readFileSync(p,'utf-8'))}catch{}if(!s.mcpServers)s.mcpServers={};s.mcpServers.skillchain={command:'node',args:['%SERVER_PATH%'.replace(/\\/g,'/')],env:{}};fs.writeFileSync(p,JSON.stringify(s,null,2),'utf-8');console.log('  Pre-configured for Claude Code')" 2>nul
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
echo echo.
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

if "%CONFIGURED%"=="1" (
    echo   MCP client config: OK
) else (
    echo   MCP clients: none detected ^(install one to use SkillChain^)
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
echo     1. Open any MCP-compatible AI tool:
echo        Claude Code, Cursor, Windsurf, VS Code, etc.
echo     2. Just talk normally
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
