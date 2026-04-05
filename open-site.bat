@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo [錯誤] 找不到 Node.js。請先安裝：https://nodejs.org/
  echo 安裝後再雙擊本檔，或於資料夾執行：npm start
  pause
  exit /b 1
)

echo.
echo  正在啟動網站… 約 2 秒後會用預設瀏覽器開啟首頁。
echo  網址：http://127.0.0.1:3000/index.html
echo  關閉本視窗即停止伺服器。
echo.

start "" cmd /c "timeout /t 2 /nobreak >nul && start http://127.0.0.1:3000/index.html"

node server\index.js
if errorlevel 1 pause
