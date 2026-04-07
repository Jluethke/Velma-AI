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
set "DOWNLOAD_URL=https://velma-ai.vercel.app/skillchain-mcp-0.1.0.zip"
set "DL_FILE=%TEMP%\skillchain-mcp.zip"
set "PS=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"

:: ================================================================
:: Step 1: Create directories
:: ================================================================
echo   [1/6] Setting up directories...
if not exist "%SC_DIR%" mkdir "%SC_DIR%"
if not exist "%SC_DIR%\skills" mkdir "%SC_DIR%\skills"
if not exist "%SC_DIR%\state" mkdir "%SC_DIR%\state"
if not exist "%SC_DIR%\chains" mkdir "%SC_DIR%\chains"
if not exist "%SC_DIR%\server" mkdir "%SC_DIR%\server"
if not exist "%SC_DIR%\marketplace" mkdir "%SC_DIR%\marketplace"
if not exist "%SC_DIR%\marketplace\chains" mkdir "%SC_DIR%\marketplace\chains"

:: ================================================================
:: Step 2: Download and extract (node_modules pre-bundled)
:: ================================================================
echo   [2/6] Downloading SkillChain...
set "DL_OK=0"

:: Try PowerShell (full path — works even if PATH is broken)
if exist "%PS%" (
    "%PS%" -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri '%DOWNLOAD_URL%' -OutFile '%DL_FILE%' -UseBasicParsing" 2>nul && set "DL_OK=1"
)
:: Fallback: curl
if "!DL_OK!"=="0" (
    curl -sSL -o "%DL_FILE%" "%DOWNLOAD_URL%" 2>nul && set "DL_OK=1"
)
:: Fallback: certutil (available since Windows Vista)
if "!DL_OK!"=="0" (
    certutil -urlcache -split -f "%DOWNLOAD_URL%" "%DL_FILE%" >nul 2>&1 && set "DL_OK=1"
)
:: Fallback: bitsadmin
if "!DL_OK!"=="0" (
    bitsadmin /transfer skillchain /download /priority high "%DOWNLOAD_URL%" "%DL_FILE%" >nul 2>&1 && set "DL_OK=1"
)

if "!DL_OK!"=="0" (
    echo   ERROR: Download failed. No download tool available.
    echo   URL: %DOWNLOAD_URL%
    goto :failed
)

echo   Extracting...
"%PS%" -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Path '%DL_FILE%' -DestinationPath '%SC_DIR%' -Force"
if %errorlevel% neq 0 (
    echo   ERROR: Extraction failed.
    goto :failed
)
del "%DL_FILE%" 2>nul
echo   Downloaded and extracted.

:: ================================================================
:: Step 3: Install Claude Code instructions
:: ================================================================
echo   [3/7] Installing Claude Code instructions...
set "CLAUDE_MD=%USERPROFILE%\.claude\CLAUDE.md"
if not exist "%USERPROFILE%\.claude" mkdir "%USERPROFILE%\.claude"

:: Check if SkillChain instructions already exist in CLAUDE.md
set "ALREADY_INSTALLED=0"
if exist "%CLAUDE_MD%" (
    findstr /c:"SkillChain AI Skill Marketplace" "%CLAUDE_MD%" >nul 2>&1 && set "ALREADY_INSTALLED=1"
)

if "!ALREADY_INSTALLED!"=="0" (
    if exist "%SC_DIR%\INSTRUCTIONS.md" (
        type "%SC_DIR%\INSTRUCTIONS.md" >> "%CLAUDE_MD%"
        echo   Added SkillChain instructions to CLAUDE.md
    ) else (
        echo   WARNING: INSTRUCTIONS.md not found in package.
    )
) else (
    echo   SkillChain instructions already in CLAUDE.md
)

:: ================================================================
:: Step 4: Auto-configure any detected MCP clients (all PowerShell)
:: ================================================================
echo   [4/7] Configuring MCP clients...
set "SERVER_PATH=%SC_DIR%\server\index.js"
set "CONFIGURED=0"

:: PowerShell helper — reads a JSON settings file, adds skillchain MCP entry, writes it back.
:: Uses forward slashes in the server path for cross-platform JSON compatibility.
set "PS_SERVER_PATH=%SERVER_PATH:\=/%"

:: --- Claude Code ---
if exist "%USERPROFILE%\.claude" (
    "%PS%" -NoProfile -ExecutionPolicy Bypass -Command ^
      "$p='%USERPROFILE%\.claude\settings.json';" ^
      "$s=@{}; if(Test-Path $p){try{$s=Get-Content $p -Raw|ConvertFrom-Json}catch{$s=@{}}};" ^
      "if(-not $s.mcpServers){$s|Add-Member -NotePropertyName mcpServers -NotePropertyValue @{} -Force};" ^
      "$entry=@{command='node';args=@('%PS_SERVER_PATH%');env=@{}};" ^
      "$s.mcpServers|Add-Member -NotePropertyName skillchain -NotePropertyValue $entry -Force;" ^
      "$s|ConvertTo-Json -Depth 10|Out-String|%{[IO.File]::WriteAllText($p,$_.Trim())};" ^
      "Write-Host '  Claude Code: configured'" 2>nul && set "CONFIGURED=1"
) else (
    echo   Claude Code: not detected
)

:: --- Cursor ---
if exist "%USERPROFILE%\.cursor" (
    "%PS%" -NoProfile -ExecutionPolicy Bypass -Command ^
      "$p='%USERPROFILE%\.cursor\mcp.json';" ^
      "$s=@{}; if(Test-Path $p){try{$s=Get-Content $p -Raw|ConvertFrom-Json}catch{$s=@{}}};" ^
      "if(-not $s.mcpServers){$s|Add-Member -NotePropertyName mcpServers -NotePropertyValue @{} -Force};" ^
      "$entry=@{command='node';args=@('%PS_SERVER_PATH%');env=@{}};" ^
      "$s.mcpServers|Add-Member -NotePropertyName skillchain -NotePropertyValue $entry -Force;" ^
      "$s|ConvertTo-Json -Depth 10|Out-String|%{[IO.File]::WriteAllText($p,$_.Trim())};" ^
      "Write-Host '  Cursor: configured'" 2>nul && set "CONFIGURED=1"
) else (
    echo   Cursor: not detected
)

:: --- Windsurf ---
if exist "%USERPROFILE%\.codeium\windsurf" (
    "%PS%" -NoProfile -ExecutionPolicy Bypass -Command ^
      "$p='%USERPROFILE%\.codeium\windsurf\mcp_config.json';" ^
      "$s=@{}; if(Test-Path $p){try{$s=Get-Content $p -Raw|ConvertFrom-Json}catch{$s=@{}}};" ^
      "if(-not $s.mcpServers){$s|Add-Member -NotePropertyName mcpServers -NotePropertyValue @{} -Force};" ^
      "$entry=@{command='node';args=@('%PS_SERVER_PATH%');env=@{}};" ^
      "$s.mcpServers|Add-Member -NotePropertyName skillchain -NotePropertyValue $entry -Force;" ^
      "$s|ConvertTo-Json -Depth 10|Out-String|%{[IO.File]::WriteAllText($p,$_.Trim())};" ^
      "Write-Host '  Windsurf: configured'" 2>nul && set "CONFIGURED=1"
) else (
    echo   Windsurf: not detected
)

:: --- VS Code (Copilot MCP) ---
if exist "%USERPROFILE%\.vscode" (
    "%PS%" -NoProfile -ExecutionPolicy Bypass -Command ^
      "$p='%USERPROFILE%\.vscode\mcp.json';" ^
      "$s=@{}; if(Test-Path $p){try{$s=Get-Content $p -Raw|ConvertFrom-Json}catch{$s=@{}}};" ^
      "if(-not $s.servers){$s|Add-Member -NotePropertyName servers -NotePropertyValue @{} -Force};" ^
      "$entry=@{command='node';args=@('%PS_SERVER_PATH%');env=@{}};" ^
      "$s.servers|Add-Member -NotePropertyName skillchain -NotePropertyValue $entry -Force;" ^
      "$s|ConvertTo-Json -Depth 10|Out-String|%{[IO.File]::WriteAllText($p,$_.Trim())};" ^
      "Write-Host '  VS Code: configured'" 2>nul && set "CONFIGURED=1"
) else (
    echo   VS Code: not detected
)

if "%CONFIGURED%"=="0" (
    echo.
    echo   No MCP client found. You need one to use SkillChain.
    echo.
    echo   Install Claude Code: https://claude.ai/download
    echo   Or use: Cursor, Windsurf, VS Code
    echo.
    echo   After installing, re-run this installer to auto-configure.
    echo.
    :: Pre-create Claude dir and settings so it's ready when they install
    if not exist "%USERPROFILE%\.claude" mkdir "%USERPROFILE%\.claude"
    "%PS%" -NoProfile -ExecutionPolicy Bypass -Command ^
      "$p='%USERPROFILE%\.claude\settings.json';" ^
      "$s=@{}; if(Test-Path $p){try{$s=Get-Content $p -Raw|ConvertFrom-Json}catch{$s=@{}}};" ^
      "if(-not $s.mcpServers){$s|Add-Member -NotePropertyName mcpServers -NotePropertyValue @{} -Force};" ^
      "$entry=@{command='node';args=@('%PS_SERVER_PATH%');env=@{}};" ^
      "$s.mcpServers|Add-Member -NotePropertyName skillchain -NotePropertyValue $entry -Force;" ^
      "$s|ConvertTo-Json -Depth 10|Out-String|%{[IO.File]::WriteAllText($p,$_.Trim())};" ^
      "Write-Host '  Pre-configured for Claude Code'" 2>nul
)

:: ================================================================
:: Step 4: Register in Add/Remove Programs
:: ================================================================
echo   [5/7] Registering in Add/Remove Programs...
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
:: Step 5: Initialize profiles
:: ================================================================
echo   [6/7] Initializing profiles...
if not exist "%SC_DIR%\trainer.json" (
    echo {"xp":0,"level":1,"title":"Novice","skills_discovered":[],"chains_completed":[],"achievements_unlocked":{},"streak_current":0,"streak_best":0,"streak_last_date":"","evolution_levels":{},"daily_runs_today":[],"daily_runs_date":"","categories_today":[],"total_skill_runs":0,"total_chain_runs":0} > "%SC_DIR%\trainer.json"
)
if not exist "%SC_DIR%\profile.json" (
    echo {"display_name":"","role":"","industry":"","stage":"","team_size":"","experience_level":"","tech_stack":[],"goals":[],"preferred_output_style":"structured","preferred_tone":"friendly","favorite_domains":[],"skills_used":[],"chains_used":[],"created_at":"","updated_at":""} > "%SC_DIR%\profile.json"
)

:: ================================================================
:: Step 6: Validate
:: ================================================================
echo   [7/7] Validating...
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
echo     4. Your AI will find the right skill chain
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
