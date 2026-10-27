@echo off
echo ========================================================
echo       STUDENT EXPENSE OPTIMIZER - STARTUP SCRIPT
echo ========================================================
echo.
echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "SEO Backend (FastAPI)" cmd /k "cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo [2/2] Starting React Vite Frontend on http://127.0.0.1:5173 ...
start "SEO Frontend (Vite)" cmd /k "cd frontend && npm run dev -- --host 127.0.0.1 --port 5173"

echo.
echo ========================================================
echo   Application is now launching!
echo   - Web App UI:        http://127.0.0.1:5173/
echo   - Backend Swagger:   http://127.0.0.1:8000/docs
echo ========================================================
echo.
pause
