@echo off
setlocal
cd /d "%~dp0"
if not exist "creatorhub\creatorhub.py" (
    git submodule update --init --depth 1 creatorhub
    if errorlevel 1 exit /b 1
)
call "creatorhub\start.cmd" %*
exit /b %errorlevel%
