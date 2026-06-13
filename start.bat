@echo off
echo ==========================================
echo    StudyNexus AI - Setup & Run
echo ==========================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found!
    echo Please install Python 3.11.9 from https://python.org
    echo IMPORTANT: Check "Add Python to PATH" during install!
    pause
    exit /b 1
)

echo [OK] Python found
echo.

REM Install dependencies
echo Installing dependencies (first time only)...
python -m pip install --upgrade pip
python -m pip install fastapi uvicorn python-multipart PyPDF2 requests python-dotenv Pillow pytesseract
if errorlevel 1 (
    echo [WARNING] Some packages may need Visual C++ Build Tools
    echo Trying pre-built wheels only...
    python -m pip install --only-binary :all: fastapi uvicorn python-multipart PyPDF2 requests python-dotenv Pillow
)

echo [OK] Dependencies installed
echo.

REM Check .env file
if not exist .env (
    echo [ERROR] .env file not found!
    pause
    exit /b 1
)

echo [OK] API key configured
echo.

REM Start server
echo ==========================================
echo    Starting StudyNexus AI Server...
echo.
echo    Open http://localhost:8000 in browser
echo ==========================================
echo.
echo Press Ctrl+C to stop the server
echo.

python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

pause
