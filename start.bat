@echo off
cd /d "%~dp0"
echo.
echo  CallShield is running.
echo  On this computer open:  http://localhost:8000
echo  On a phone (same Wi-Fi) open:  http://YOUR-PC-IP:8000
echo  Your PC's IP addresses:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do echo     %%a
echo.
echo  Press Ctrl+C to stop.
echo.
start "" http://localhost:8000
python -m http.server 8000
