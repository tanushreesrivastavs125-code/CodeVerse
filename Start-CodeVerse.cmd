@echo off
setlocal
cd /d "%~dp0"
node scripts/launcher.mjs --open %*
