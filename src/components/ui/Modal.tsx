import * as React from "react"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"

interface ModalProps {
  open?: boolean
  onClose?: () => void
  onCancel?: () => void
  title?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  width?: number | string
  className?: string
}

const Modal = ({ open, onClose, onCancel, title, children, footer, width = 600, className }: ModalProps) => {
  if (!open) return null

  const handleClose = onClose || onCancel

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={handleClose}
        aria-hidden="true"
      />
      <div 
        className={cn(
          "relative z-10 w-full bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden",
          className
        )}
        style={{ maxWidth: width }}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center gap-3">
              {title}
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {/* Body */}
        <div className="p-6">
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export { Modal }
