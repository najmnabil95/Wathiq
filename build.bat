@echo off
echo ========================================================
echo  IT-EDMS: Building Frontend and bundling into Laravel
echo ========================================================
cd /d "%~dp0frontend"
call npm run build
if %ERRORLEVEL% equ 0 (
    echo.
    echo [SUCCESS] Frontend built and integrated into backend/public successfully!
    echo You can now deploy the backend folder directly to your server.
) else (
    echo.
    echo [ERROR] Build failed. Please check the errors above.
)
cd /d "%~dp0"
pause
