@echo off
set "TARGET=%~dp0backend\src\main\resources\application-local.properties"
set "EXAMPLE=%~dp0backend\src\main\resources\application-local.properties.example"

if exist "%TARGET%" (
    echo application-local.properties already exists.
    notepad "%TARGET%"
    exit /b 0
)

copy "%EXAMPLE%" "%TARGET%"
echo Created application-local.properties — add your MySQL password and API keys.
notepad "%TARGET%"
