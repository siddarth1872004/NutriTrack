@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js 20 or newer is required: https://nodejs.org/ & pause & exit /b 1)
if not exist .env.local (echo Create .env.local from .env.example and set DATABASE_URL first ^(see DEPLOYMENT.md^). & pause & exit /b 1)
call npm install || goto fail
call npm run build || goto fail
call npm start
goto end
:fail
echo NutriTrack could not start. Read the messages above.
pause
:end
endlocal
