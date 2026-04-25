@echo off
chcp 65001 >nul
echo ========================================
echo   3D 太阳系模拟 - 启动本地服务器
echo ========================================
echo.
echo 正在启动本地服务器...
echo.

where python >nul 2>nul
if %errorlevel%==0 (
    set PYTHON_CMD=python
) else (
    where py >nul 2>nul
    if %errorlevel%==0 (
        set PYTHON_CMD=py
    ) else (
        echo 未找到 Python。请先安装 Python，或手动使用其他 HTTP 服务器。
        pause
        exit /b 1
    )
)

start "Solar System Server" /min %PYTHON_CMD% -m http.server 8000
timeout /t 2 /nobreak >nul
start http://localhost:8000/solar_system.html

echo 浏览器已打开: http://localhost:8000/solar_system.html
echo 如需停止服务器，请关闭名为 "Solar System Server" 的窗口。
pause
