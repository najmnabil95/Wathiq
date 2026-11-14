@echo off
setlocal
cd /d "C:\Users\NajmaldeenYafouz\Desktop\IT-EDMS\backend"
"C:\xampp\php\php.exe" artisan edms:backup >> "C:\Users\NajmaldeenYafouz\Desktop\IT-EDMS\backend\storage\logs\backup-task.log" 2>&1
exit /b %ERRORLEVEL%
