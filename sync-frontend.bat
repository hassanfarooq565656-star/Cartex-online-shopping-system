@echo off
echo Syncing frontend to backend static folder...
xcopy /E /Y /I "%~dp0frontend\*" "%~dp0backend\src\main\resources\static\"
echo Done.
