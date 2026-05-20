@echo off
title Push CARTEX to GitHub
cd /d "%~dp0"

set "GH=%ProgramFiles%\GitHub CLI\gh.exe"
if not exist "%GH%" (
  echo GitHub CLI not found. Install from: https://cli.github.com/
  pause
  exit /b 1
)

echo Checking GitHub login...
"%GH%" auth status >nul 2>&1
if %errorlevel% neq 0 (
  echo.
  echo You need to log in first. Running: gh auth login
  "%GH%" auth login
)

set /p REPO_NAME=Enter GitHub repo name (e.g. cartex-online-shopping): 
if "%REPO_NAME%"=="" set REPO_NAME=cartex-online-shopping

echo Creating repo and pushing to GitHub...
"%GH%" repo create %REPO_NAME% --public --source=. --remote=origin --push

if %errorlevel% equ 0 (
  echo.
  echo Success! Check your repo on github.com
) else (
  echo.
  echo Failed. If repo exists, run:
  echo   git remote add origin https://github.com/YOUR_USERNAME/%REPO_NAME%.git
  echo   git push -u origin main
)
pause
