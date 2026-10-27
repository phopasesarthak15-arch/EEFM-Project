@echo off
echo ========================================================
echo       STUDENT EXPENSE OPTIMIZER - AUTOMATED TESTS
echo ========================================================
echo.
set PYTHONPATH=backend
python -m pytest backend/tests -v
echo.
pause
