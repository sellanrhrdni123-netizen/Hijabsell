@echo off
title BY.NVDILA CRM - Sinkronisasi Real-Time HP & Laptop
cd /d "%~dp0"
echo ==========================================================
echo    BY.NVDILA - SERVER SINKRONISASI REAL-TIME (HP ^& LAPTOP)
echo ==========================================================
echo.
set NODE_EXE=
for %%X in (node.exe) do (set NODE_EXE=%%~$PATH:X)
if not defined NODE_EXE (
  if exist "C:\Program Files\Adobe\Adobe Creative Cloud Experience\libs\node.exe" (
    set "NODE_EXE=C:\Program Files\Adobe\Adobe Creative Cloud Experience\libs\node.exe"
  ) else if exist "C:\Program Files\nodejs\node.exe" (
    set "NODE_EXE=C:\Program Files\nodejs\node.exe"
  )
)
if not defined NODE_EXE (
  echo Error: Node.js tidak ditemukan di sistem.
  pause
  exit /b 1
)
"%NODE_EXE%" serve.cjs
pause
