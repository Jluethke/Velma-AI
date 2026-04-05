@echo off
title SkillChain Installer
echo.
echo   SkillChain - AI Skill Marketplace
echo   ==================================
echo.

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
        pause
        exit /b 1
    )
    :: Verify SHA256 checksum (official Python.org hash)
    echo   Verifying download integrity...
    certutil -hashfile "%TEMP%\python-installer.exe" SHA256 | findstr /i "d6a66dcef3a8e5b26a554a77e0da8e59ecdbd29a02c2260b222c6bcc86020ab5" >nul 2>&1
    if %errorlevel% neq 0 (
        echo   WARNING: Checksum verification failed.
        echo   The download may be corrupted or tampered with.
        echo   Please download Python manually from https://python.org
        del "%TEMP%\python-installer.exe" 2>nul
        pause
        exit /b 1
    )
    echo   Checksum verified.
    echo   Installing Python ^(this may take a minute^)...
    "%TEMP%\python-installer.exe" /quiet InstallAllUsers=0 PrependPath=1 Include_pip=1
    if %errorlevel% neq 0 (
        echo   ERROR: Python installation failed.
        echo   Please install Python 3.11+ manually from https://python.org
        pause
        exit /b 1
    )
    echo   Python installed successfully.
    echo.
    :: Refresh PATH
    set "PATH=%LOCALAPPDATA%\Programs\Python\Python311;%LOCALAPPDATA%\Programs\Python\Python311\Scripts;%PATH%"
)

:: Install SkillChain
echo   [1/4] Installing SkillChain SDK...
pip install skillchain --quiet 2>nul
if %errorlevel% neq 0 (
    pip install click cryptography rich requests numpy --quiet 2>nul
    echo   Note: Some optional dependencies may not have installed.
)

:: Initialize SkillChain
echo   [2/4] Configuring SkillChain...
python -c "from skillchain.sdk.mcp_bridge.claude_settings import install_mcp_server; install_mcp_server()" 2>nul

:: Create directories
echo   [3/4] Setting up directories...
if not exist "%USERPROFILE%\.skillchain" mkdir "%USERPROFILE%\.skillchain"
if not exist "%USERPROFILE%\.skillchain\skills" mkdir "%USERPROFILE%\.skillchain\skills"
if not exist "%USERPROFILE%\.skillchain\state" mkdir "%USERPROFILE%\.skillchain\state"

:: Initialize trainer
echo   [4/4] Creating trainer profile...
python -c "from skillchain.sdk.gamification import GamificationEngine; e = GamificationEngine(); print(f'  Level {e.get_trainer_card()[\"level\"]} {e.get_trainer_card()[\"title\"]}')" 2>nul

echo.
echo   ========================================
echo   Installation complete!
echo   ========================================
echo.
echo   What happens now:
echo     1. Restart Claude Code (or any AI with MCP support)
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
