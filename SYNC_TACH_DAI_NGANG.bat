@echo off
setlocal
cd /d "%~dp0"
call "%~dp0sync\_TACH_DAI_NGANG.bat"
exit /b %ERRORLEVEL%