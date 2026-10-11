@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"
if errorlevel 1 (echo Loi tai engine. Kiem tra Internet, va thu lai. & pause & exit /b 1)
call "%~dp0CHAY_APP.bat"
