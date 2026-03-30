import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from './utils';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface AppSelectProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  height?: string;   // e.g. 'h-11', 'h-10', 'h-12'
  disabled?: boolean;
}

export function AppSelect({
  value: controlledValue,
  defaultValue,
  onChange,
  options,
  placeholder = '请选择',
  className,
  height = 'h-11',
  disabled = false,
}: AppSelectProps) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const value = isControlled ? controlledValue : internalValue;

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find(o => o.value === value);

  const handleSelect = (optVal: string) => {
    if (!isControlled) setInternalValue(optVal);
    onChange?.(optVal);
    setOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 rounded-lg border text-sm transition-all duration-200 outline-none',
          height,
          open
            ? 'border-primary/60 ring-3 ring-primary/15 bg-white shadow-sm shadow-primary/10'
            : 'border-border bg-white hover:border-primary/30 hover:bg-primary/[0.02] shadow-sm',
          !selected && 'text-muted-foreground',
          selected && 'text-foreground',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <span className="flex items-center gap-2 min-w-0 flex-1">
          {selected?.icon && (
            <span className="flex-shrink-0 text-primary">{selected.icon}</span>
          )}
          <span className={cn('truncate', !selected && 'text-muted-foreground/70')}>
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 flex-shrink-0 transition-transform duration-200',
            open ? 'rotate-180 text-primary' : 'text-muted-foreground/60',
          )}
        />
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          className={cn(
            'absolute z-50 w-full mt-1.5 rounded-xl border border-border/80 bg-white shadow-xl shadow-black/10 overflow-hidden',
            'animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150',
          )}
        >
          {/* Top accent line */}
          <div className="h-0.5 bg-gradient-to-r from-primary/60 via-secondary/60 to-transparent" />

          <div className="p-1.5 max-h-60 overflow-y-auto">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-all duration-150 group',
                    isSelected
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground hover:bg-primary/6 hover:text-primary',
                  )}
                >
                  {/* Leading icon slot */}
                  {opt.icon ? (
                    <span className={cn(
                      'flex-shrink-0 transition-colors',
                      isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary',
                    )}>
                      {opt.icon}
                    </span>
                  ) : (
                    <span className={cn(
                      'w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors',
                      isSelected ? 'bg-primary' : 'bg-border group-hover:bg-primary/50',
                    )} />
                  )}

                  <span className="flex-1 truncate">{opt.label}</span>

                  {/* Checkmark */}
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
