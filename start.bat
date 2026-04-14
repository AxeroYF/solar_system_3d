@echo off
chcp 65001 >nul
echo ========================================
echo   3D 太阳系模拟 - 启动本地服务器
echo ========================================
echo.
echo 正在启动... 浏览器将自动打开
echo 按 Ctrl+C 停止服务器
echo.
start http://localhost:8000/solar_system.html
python -m http.server 8000
