@echo off
title BY.NVDILA CRM - Membuka Aplikasi & Server
cd /d "%~dp0"

set NODE_EXE=
for %%X in (node.exe) do (set NODE_EXE=%%~$PATH:X)
if not defined NODE_EXE (
  if exist "C:\Program Files\Adobe\Adobe Creative Cloud Experience\libs\node.exe" (
    set "NODE_EXE=C:\Program Files\Adobe\Adobe Creative Cloud Experience\libs\node.exe"
  ) else if exist "C:\Program Files\nodejs\node.exe" (
    set "NODE_EXE=C:\Program Files\nodejs\node.exe"
  )
)

if defined NODE_EXE (
  start "" /B "%NODE_EXE%" serve.cjs
  timeout /t 1 /nobreak >nul
  start "" "http://localhost:3000/"
) else (
  start "" "%~dp0app.html"
)
