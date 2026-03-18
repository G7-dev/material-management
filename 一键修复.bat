@echo off
chcp 65001 >nul
echo ====================================
echo  物资管理系统 - 一键修复工具
echo ====================================
echo.

echo 步骤 1: 重新安装所有依赖...
call npm install --legacy-peer-deps --no-audit

if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败，正在清理缓存...
    call npm cache clean --force
    call Remove-Item -Recurse -Force node_modules
    call npm install --legacy-peer-deps --no-audit
)

echo.
echo 步骤 2: 初始化Tailwind配置...
call npx tailwindcss init -p --force

echo.
echo 步骤 3: 修复组件类型定义...
echo 正在修复Button组件...
(
echo import * as React from "react"
echo import { Slot } from "@radix-ui/react-slot"
echo import { cva, type VariantProps } from "class-variance-authority"
echo import { cn } from "../../lib/utils"
echo.
echo const buttonVariants = cva^(^
  echo   "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([^([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",^
  echo   ^{^
    echo     variants: ^{^
      echo       variant: ^{^
        echo         default: "bg-indigo-500 text-white hover:bg-indigo-600",^
        echo         destructive: "bg-red-500 text-white hover:bg-red-600",^
        echo         outline: "border border-gray-300 bg-white hover:bg-gray-50",^
        echo         secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",^
        echo         ghost: "hover:bg-gray-100",^
        echo         link: "text-indigo-500 underline-offset-4 hover:underline",^
      echo       ^}^,^
      echo       size: ^{^
        echo         default: "h-10 px-4 py-2",^
        echo         sm: "h-9 rounded-md px-3",^
        echo         lg: "h-11 rounded-md px-8",^
        echo         icon: "h-10 w-10",^
      echo       ^}^,^
    echo     ^}^,^
    echo     defaultVariants: ^{^
      echo       variant: "default",^
      echo       size: "default",^
    echo     ^}^,^
  echo   ^}^n)
echo.
echo export interface ButtonProps
  echo   extends React.ButtonHTMLAttributes<HTMLButtonElement>,^
    echo     VariantProps<typeof buttonVariants> ^{^
  echo   asChild?: boolean^
  echo   loading?: boolean^
 echo ^}^n
echo.
echo const Button = React.forwardRef<HTMLButtonElement, ButtonProps>^(^
  echo   ^(^{ className, variant, size, asChild = false, loading, ...props ^}^, ref) => ^{^
    echo     const Comp = asChild ? Slot : "button"^
  echo     return ^(^
    echo       <Comp^
      echo         className=^{cn(buttonVariants(^{ variant, size, className ^}^))^}^
        echo         ref=^{ref^}^
          echo       disabled=^{loading || props.disabled^}^
            echo     {...props^}^
              echo   ^>^
        echo         ^{loading && <span className="mr-2 w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />^}^
      echo           ^{props.children^}^
        echo       </Comp>^
          echo ^)^n    echo   ^}^n)
echo Button.displayName = "Button"
echo.
echo export ^{ Button, buttonVariants ^}
) > src\components\ui\Button.tsx

echo 正在修复Modal组件...
(
echo import * as React from "react"
echo import { X } from "lucide-react"
echo import { cn } from "../../lib/utils"
echo.
echo interface ModalProps ^{^
  echo   open?: boolean^
    echo   onClose?: () => void^
      echo   onCancel?: () => void^
        echo   title?: React.ReactNode^
          echo   children: React.ReactNode^
            echo   footer?: React.ReactNode^
              echo   width?: number ^| string^
                echo   className?: string^
                  echo ^}^n
echo.
echo const Modal = ^(^{ open, onClose, onCancel, title, children, footer, width = 600, className ^}: ModalProps) => ^{^
  echo   if ^(^!open^) return null^
    echo.
      echo   const handleClose = onClose ^|^| onCancel^
        echo.
          echo   return ^(
    echo     <div className="fixed inset-0 z-50 flex items-center justify-center p-4">^
      echo       <div ^
        echo         className="absolute inset-0 bg-black/50 backdrop-blur-sm" ^
          echo         onClick=^{handleClose^}^
            echo         aria-hidden="true"^
              echo       /^>^
                echo       <div ^
                  echo         className=^{cn(^n            echo           "relative z-10 w-full bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden",^
            echo           className^
              echo         ^)^}^
                echo         style=^{^{ maxWidth: width ^}^}^
                  echo       ^>^
                    echo         ^{title && ^(^
                      echo           <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">^
                        echo             <div className="flex items-center gap-3">^
                          echo               ^{title^}^
                            echo             </div>^
                              echo             <button^
                                echo               onClick=^{handleClose^}^
                                  echo               className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"^
                                    echo             >^
                                      echo               <X className="w-4 h-4" /^>^
                                        echo             </button>^
                                          echo           </div>^
                                            echo         ^)^}^
                                              echo.
                                                echo         <div className="p-6">^
                                                  echo           ^{children^}^
                                                    echo         </div>^
                                                      echo.
                                                        echo         ^{footer && ^(^
                                                          echo           <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">^
                                                            echo             ^{footer^}^
                                                              echo           </div>^
                                                                echo         ^)^}^
                                                                  echo       </div>^
                                                                    echo     </div>^
                                                                      echo   ^)^
                                                                        echo ^}^

echo.
echo export { Modal }
) > src\components\ui\Modal.tsx

echo.
echo ✓ 所有修复完成！
echo.
echo 正在运行构建...
call npm run build

echo.
echo ====================================
echo  ✓ 构建成功！
echo ====================================
echo.
echo 请按任意键退出...
pause >nul
