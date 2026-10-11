@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (echo Can cai Node.js LTS tai https://nodejs.org/ & pause & exit /b 1)
echo Dang mo app Co Tuong tren cong rieng, khong trung voi app khac...
node server.js
pause
