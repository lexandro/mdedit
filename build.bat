@echo off
setlocal
rem Build a runnable release exe for local testing (skips installer bundling).
cd /d "%~dp0"

echo Building mdedit (release, no installer)...
call bun run tauri build --no-bundle
if errorlevel 1 (
  echo.
  echo Build FAILED.
  exit /b 1
)

echo.
echo Build OK.
echo Exe: %~dp0src-tauri\target\release\mdedit.exe
echo Note: mdedit is single-instance - close any running mdedit before testing.
endlocal

