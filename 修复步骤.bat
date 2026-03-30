@echo off
chcp 65001 >nul
echo ====================================
echo  物资管理系统 - 自动修复脚本
echo ====================================
echo.

REM 删除旧的配置文件
echo 步骤 1: 删除旧的配置文件...
del /F /Q "postcss.config.js" 2>nul
del /F /Q "tailwind.config.js" 2>nul

REM 重新安装依赖
echo 步骤 2: 重新安装所有依赖...
call npm install --legacy-peer-deps --no-audit

REM 初始化Tailwind配置
echo 步骤 3: 初始化Tailwind配置...
call npx tailwindcss init -p --force

REM 等待用户按键
echo.
echo ====================================
echo  ✓ 修复完成！
echo ====================================
echo.
echo 请按任意键启动开发服务器...
pause >nul

call npm run dev
