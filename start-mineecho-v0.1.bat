@echo off
setlocal
cd /d "%~dp0"
node scripts\start-runtime.mjs
pause
