@echo off
cd /d "%~dp0"

where codex >nul 2>&1
if errorlevel 1 (
  echo codex CLI was not found in PATH.
  echo Install it or add it to PATH, then run this file again.
  pause
  exit /b 1
)

codex
