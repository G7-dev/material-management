@echo off
chcp 65001 >nul
echo ============================================
echo 物资领用系统 - 最终上线前清理工具
echo ============================================
echo.

echo 警告：此操作将清除所有测试数据！
echo.
echo 将要执行的操作：
echo 1. 清除所有领用记录和审批记录
echo 2. 清除除管理员以外的所有账号
echo 3. 重置数据库序列
echo.

set /p confirm="请确认已备份重要数据并要继续吗？ (yes/no): "
if /i not "%confirm%"=="yes" (
    echo 操作已取消。
    pause
    exit /b
)

echo.
echo 请选择要执行的操作：
echo 1. 清除领用记录（requisitions表）
echo 2. 清除非管理员账号
echo 3. 执行完整清理（推荐）
echo 4. 取消
echo.
set /p choice="请输入选项编号 (1-4): "

if "%choice%"=="1" (
    echo.
    echo 正在清除领用记录...
    psql -h localhost -U postgres -d postgres -f supabase/cleanup_records.sql
    echo.
    echo 领用记录清除完成！
) else if "%choice%"=="2" (
    echo.
    echo 正在清除非管理员账号...
    psql -h localhost -U postgres -d postgres -f supabase/cleanup_users.sql
    echo.
    echo 账号清除完成！
) else if "%choice%"=="3" (
    echo.
    echo 正在执行完整清理...
    psql -h localhost -U postgres -d postgres -f supabase/final_cleanup_before_launch.sql
    echo.
    echo 完整清理完成！
) else (
    echo 操作已取消。
)

echo.
echo 请检查以上输出结果，确认清理是否成功。
echo.
pause
