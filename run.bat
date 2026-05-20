@echo off
title CARTEX - Online Shopping System
echo ========================================
echo   CARTEX Backend + Frontend
echo   http://localhost:8080
echo ========================================
echo.

cd /d "%~dp0backend"

REM --- Find Java ---
set "JAVA_EXE="
if defined JAVA_HOME if exist "%JAVA_HOME%\bin\java.exe" set "JAVA_EXE=%JAVA_HOME%\bin\java.exe"
if not defined JAVA_EXE for %%J in (
  "C:\Program Files\Java\jdk-21\bin\java.exe"
  "C:\Program Files\Java\jdk-17\bin\java.exe"
  "C:\Program Files\Eclipse Adoptium\jdk-17*\bin\java.exe"
  "C:\Program Files\Microsoft\jdk-17*\bin\java.exe"
  "C:\Program Files\Android\Android Studio\jbr\bin\java.exe"
) do if exist %%~J set "JAVA_EXE=%%~J" & goto :found_java
where java >nul 2>&1 && set "JAVA_EXE=java"
:found_java
if not defined JAVA_EXE (
  echo ERROR: Java 17+ not found.
  echo Install JDK 17: https://adoptium.net/temurin/releases/?version=17
  pause
  exit /b 1
)
echo Using Java: %JAVA_EXE%

REM --- Find Maven ---
set "MVN_CMD="
where mvn >nul 2>&1 && set "MVN_CMD=mvn"
if not defined MVN_CMD if exist "%~dp0backend\mvnw.cmd" set "MVN_CMD=%~dp0backend\mvnw.cmd"
if not defined MVN_CMD (
  echo ERROR: Maven not found.
  echo Install Maven: https://maven.apache.org/download.cgi
  echo Or open this folder in Cursor and use: Java Extension Pack
  pause
  exit /b 1
)

echo Syncing frontend files...
call "%~dp0sync-frontend.bat" >nul

echo Starting Spring Boot...
call %MVN_CMD% spring-boot:run
pause
