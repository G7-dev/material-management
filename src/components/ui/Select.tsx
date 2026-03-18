import * as React from "react"
import { cn } from "../../lib/utils"
import { ChevronDown } from "lucide-react"

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  options: SelectOption[]
  className?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ value, onChange, placeholder, options, className }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={cn(
            "w-full h-12 rounded-xl border border-gray-300 bg-white px-3.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 cursor-pointer appearance-none",
            className
          )}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }
