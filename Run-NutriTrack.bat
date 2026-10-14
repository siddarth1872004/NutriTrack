@echo off
setlocal
cd /d "%~dp0"
title NutriTrack Local
where py >nul 2>nul
if not errorlevel 1 goto use_py
where python >nul 2>nul
if not errorlevel 1 goto use_python
echo Python 3.10 or newer is required.
echo Install it from https://www.python.org/downloads/ and enable Add Python to PATH.
pause
exit /b 1
:use_py
py -3 server.py --ensure-admin
if errorlevel 1 goto done
py -3 server.py
goto done
:use_python
python server.py --ensure-admin
if errorlevel 1 goto done
python server.py
:done
if errorlevel 1 (
  echo NutriTrack stopped with an error. Read the message above.
  pause
)
endlocal
