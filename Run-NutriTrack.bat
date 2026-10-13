@echo off
setlocal
cd /d "%~dp0"
title NutriTrack Local
where py >nul 2>nul
if %errorlevel%==0 (py -3 server.py) else (python server.py)
if errorlevel 1 (echo If Python is missing, install Python 3.10+ and enable Add Python to PATH. & pause)
endlocal
