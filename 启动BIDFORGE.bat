@echo off
setlocal

cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-bidforge.ps1"

if errorlevel 1 (
  echo.
  echo BIDFORGE failed to start. Please check the error above.
  pause
)
