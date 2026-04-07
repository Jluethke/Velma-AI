@echo off
title SkillChain Installer
setlocal enabledelayedexpansion
echo.
echo   SkillChain - AI Skill Marketplace
echo   ==================================
echo.
echo   No Python required. Just Node.js (which Claude Code includes).
echo.

set "SC_DIR=%USERPROFILE%\.skillchain"
set "DOWNLOAD_URL=https://velma-ai.vercel.app/skillchain-mcp-0.1.0.tar.gz"

:: Check for Node.js
echo   [1/6] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo   Node.js not found.
    echo.
    echo   SkillChain requires Node.js, which comes with Claude Code.
    echo   If you have Claude Code installed, Node.js should be available.
    echo.
    echo   To install Node.js manually: https://nodejs.org
    echo.
    goto :failed
)
for /f "tokens=*" %%v in ('node --version') do echo   Found Node.js %%v

:: Create directories
echo   [2/6] Setting up directories...
if not exist "%SC_DIR%" mkdir "%SC_DIR%"
if not exist "%SC_DIR%\skills" mkdir "%SC_DIR%\skills"
if not exist "%SC_DIR%\state" mkdir "%SC_DIR%\state"
if not exist "%SC_DIR%\chains" mkdir "%SC_DIR%\chains"
if not exist "%SC_DIR%\server" mkdir "%SC_DIR%\server"
if not exist "%SC_DIR%\marketplace" mkdir "%SC_DIR%\marketplace"
if not exist "%SC_DIR%\marketplace\chains" mkdir "%SC_DIR%\marketplace\chains"

:: Download and extract
echo   [3/6] Downloading SkillChain...
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

:: Install Node.js dependencies for the server
echo   [4/6] Installing server dependencies...
cd /d "%SC_DIR%\server"
npm install --production --silent 2>nul
if %errorlevel% neq 0 (
    echo   WARNING: npm install had issues, trying again...
    npm install --production 2>nul
)

:: Configure Claude Code MCP settings
echo   [5/6] Configuring Claude Code...
set "CLAUDE_SETTINGS=%USERPROFILE%\.claude\settings.json"
if not exist "%USERPROFILE%\.claude" mkdir "%USERPROFILE%\.claude"

:: Use Node.js to safely merge into settings.json
node -e "const fs=require('fs'),p='%CLAUDE_SETTINGS%'.replace(/\\/g,'/');let s={};try{s=JSON.parse(fs.readFileSync(p,'utf-8'))}catch{}if(!s.mcpServers)s.mcpServers={};s.mcpServers.skillchain={command:'node',args:['%SC_DIR%\\server\\index.js'.replace(/\\/g,'/')],env:{}};fs.writeFileSync(p,JSON.stringify(s,null,2),'utf-8');console.log('  MCP server registered in '+p)"
if %errorlevel% neq 0 (
    echo   WARNING: Could not auto-configure Claude Code.
    echo   You may need to add the MCP server manually to ~/.claude/settings.json
)

:: Initialize trainer profile
echo   [6/6] Initializing trainer profile...
if not exist "%SC_DIR%\trainer.json" (
    echo {"xp":0,"level":1,"title":"Novice","skills_discovered":[],"chains_completed":[],"achievements_unlocked":{},"streak_current":0,"streak_best":0,"streak_last_date":"","evolution_levels":{},"daily_runs_today":[],"daily_runs_date":"","categories_today":[],"total_skill_runs":0,"total_chain_runs":0} > "%SC_DIR%\trainer.json"
)
if not exist "%SC_DIR%\profile.json" (
    echo {"display_name":"","role":"","industry":"","stage":"","team_size":"","experience_level":"","tech_stack":[],"goals":[],"preferred_output_style":"structured","preferred_tone":"friendly","favorite_domains":[],"skills_used":[],"chains_used":[],"created_at":"","updated_at":""} > "%SC_DIR%\profile.json"
)

:: Validate
echo.
set "VALID=1"
node -e "const s=require('%SC_DIR%\\server\\index.js'.replace(/\\/g,'/'));console.log('  MCP server: OK')" 2>nul
if %errorlevel% neq 0 (
    :: Server validation via import may fail due to stdio transport — that's OK
    if exist "%SC_DIR%\server\index.js" (
        echo   MCP server: OK ^(installed^)
    ) else (
        echo   WARNING: MCP server files not found.
        set "VALID=0"
    )
)

if exist "%CLAUDE_SETTINGS%" (
    node -e "const s=JSON.parse(require('fs').readFileSync('%CLAUDE_SETTINGS%'.replace(/\\/g,'/'),'utf-8'));if(s.mcpServers&&s.mcpServers.skillchain)console.log('  Claude config: OK');else{console.log('  WARNING: not in Claude settings');process.exit(1)}"
    if %errorlevel% neq 0 (
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
echo   Your AI just got 126 skills and 92 chains.
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
echo   Check the error messages above and try again.
echo   Make sure Node.js is installed: https://nodejs.org
echo.
pause
exit /b 1
