@echo off
title IT-EDMS Server
echo ========================================================
echo  IT-EDMS: Running Enterprise Document Management System
echo ========================================================
echo.
cd /d "%~dp0backend"

set PHP_EXE=php
where php >nul 2>nul
if %ERRORLEVEL% neq 0 (
    if exist "C:\xampp\php\php.exe" (
        set PHP_EXE=C:\xampp\php\php.exe
    ) else (
        echo [ERROR] PHP was not found! Please make sure XAMPP is installed.
        pause
        exit /b 1
    )
)

rem Check if MySQL is running on port 3306
netstat -ano | findstr ":3306 " >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [INFO] MySQL is not running. Attempting to start MySQL...
    if exist "C:\xampp\mysql_start.bat" (
        start "" "C:\xampp\mysql_start.bat"
        timeout /t 3 /nobreak >nul
    )
)

echo Starting server on http://localhost:8000 ...
start http://localhost:8000
"%PHP_EXE%" artisan serve --port=8000
pause
