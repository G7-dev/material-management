"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { cn } from "./utils";

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface Group {
  label: string;
  options: Option[];
}

interface EnhancedSelectProps {
  options: Option[] | Group[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "filled" | "borderless";
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  loading?: boolean;
  emptyText?: string;
  portal?: boolean;
}

const sizeClasses = {
  sm: "h-9 text-sm",
  md: "h-11 text-sm",
  lg: "h-12 text-base",
};

const variantClasses = {
  default: "border-input bg-background hover:border-primary/60",
  filled: "border-transparent bg-muted/50 hover:bg-muted/70",
  borderless: "border-transparent bg-transparent hover:bg-muted/30",
};

function EnhancedSelect({
  options,
  value,
  onChange,
  placeholder = "请选择...",
  className,
  disabled = false,
  searchable = false,
  clearable = false,
  size = "md",
  variant = "default",
  label,
  error,
  helperText,
  required = false,
  loading = false,
  emptyText = "暂无选项",
  portal = true,
}: EnhancedSelectProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const isGrouped = options.length > 0 && "options" in options[0];
  
  const flatOptions = React.useMemo(() => {
    if (!isGrouped) return options as Option[];
    return (options as Group[]).flatMap(group => group.options);
  }, [options, isGrouped]);

  const filteredOptions = React.useMemo(() => {
    if (!searchable || !searchQuery) return options;
    
    const query = searchQuery.toLowerCase();
    if (isGrouped) {
      return (options as Group[]).map(group => ({
        ...group,
        options: group.options.filter(opt => 
          opt.label.toLowerCase().includes(query) ||
          opt.value.toLowerCase().includes(query)
        ),
      })).filter(group => group.options.length > 0);
    }
    
    return (options as Option[]).filter(opt =>
      opt.label.toLowerCase().includes(query) ||
      opt.value.toLowerCase().includes(query)
    );
  }, [options, searchable, searchQuery, isGrouped]);

  const selectedOption = flatOptions.find(opt => opt.value === value);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.("");
  };

  const handleValueChange = (newValue: string) => {
    onChange?.(newValue);
    if (searchable) {
      setSearchQuery("");
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <label className="flex items-center gap-1 text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive">*</span>}
        </label>
      )}
      
      <SelectPrimitive.Root
        value={value}
        onValueChange={handleValueChange}
        disabled={disabled || loading}
        open={open}
        onOpenChange={setOpen}
      >
        <SelectPrimitive.Trigger
          className={cn(
            "relative w-full flex items-center justify-between gap-3 rounded-xl border px-4 py-2 outline-none transition-all duration-200",
            "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/60",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "hover:shadow-sm hover:shadow-primary/5",
            sizeClasses[size],
            variantClasses[variant],
            error && "border-destructive ring-destructive/20",
            "group"
          )}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {selectedOption?.icon && (
              <span className="flex-shrink-0 text-muted-foreground group-data-[state=open]:text-primary transition-colors">
                {selectedOption.icon}
              </span>
            )}
            <SelectPrimitive.Value placeholder={placeholder}>
              {selectedOption ? (
                <span className="flex items-center gap-2">
                  {selectedOption.icon && (
                    <span className="flex-shrink-0 text-muted-foreground">
                      {selectedOption.icon}
                    </span>
                  )}
                  <span className="truncate">{selectedOption.label}</span>
                </span>
              ) : (
                <span className="text-muted-foreground truncate">{placeholder}</span>
              )}
            </SelectPrimitive.Value>
          </div>
          
          <div className="flex items-center gap-1 flex-shrink-0">
            {clearable && value && !disabled && (
              <button
                onClick={handleClear}
                className="p-1 rounded-full hover:bg-muted transition-colors"
              >
                <XIcon className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            )}
            
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            ) : (
              <SelectPrimitive.Icon asChild>
                <ChevronDownIcon className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </SelectPrimitive.Icon>
            )}
          </div>
        </SelectPrimitive.Trigger>

        {portal ? (
          <SelectPrimitive.Portal>
            <SelectContent 
              searchable={searchable}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              emptyText={emptyText}
              filteredOptions={filteredOptions}
              isGrouped={isGrouped}
            />
          </SelectPrimitive.Portal>
        ) : (
          <SelectContent 
            searchable={searchable}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            emptyText={emptyText}
            filteredOptions={filteredOptions}
            isGrouped={isGrouped}
          />
        )}
      </SelectPrimitive.Root>
      
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <span>•</span>
          <span>{error}</span>
        </p>
      )}
      
      {helperText && !error && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}

interface SelectContentProps {
  searchable?: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  emptyText: string;
  filteredOptions: Option[] | Group[];
  isGrouped: boolean;
  children?: React.ReactNode;
}

function SelectContent({
  searchable,
  searchQuery,
  onSearchChange,
  emptyText,
  filteredOptions,
  isGrouped,
  children,
  ...props
}: SelectContentProps) {
  return (
    <SelectPrimitive.Content
      className={cn(
        "z-50 min-w-[12rem] overflow-hidden rounded-xl border border-border bg-background",
        "shadow-xl shadow-black/10",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
      )}
      position="popper"
      sideOffset={4}
      {...props}
    >
      <div className="h-0.5 bg-gradient-to-r from-primary/60 via-secondary/60 to-transparent" />
      
      {searchable && (
        <div className="p-2 border-b border-border">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="搜索选项..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-muted/30 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
      
      <SelectPrimitive.Viewport className="p-1 max-h-[var(--radix-select-content-available-height)] overflow-y-auto">
        <SelectScrollUpButton />
        
        {children || (
          <>
            {isGrouped ? (
              (filteredOptions as Group[]).map((group, index) => (
                <React.Fragment key={group.label}>
                  {index > 0 && <SelectSeparator />}
                  <SelectLabel>{group.label}</SelectLabel>
                  {group.options.map((option) => (
                    <EnhancedSelectItem
                      key={option.value}
                      value={option.value}
                      icon={option.icon}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </EnhancedSelectItem>
                  ))}
                </React.Fragment>
              ))
            ) : (
              (filteredOptions as Option[]).map((option) => (
                <EnhancedSelectItem
                  key={option.value}
                  value={option.value}
                  icon={option.icon}
                  disabled={option.disabled}
                >
                  {option.label}
                </EnhancedSelectItem>
              ))
            )}
            
            {filteredOptions.length === 0 && (
              <div className="py-6 px-3 text-center">
                <p className="text-sm text-muted-foreground">{emptyText}</p>
              </div>
            )}
          </>
        )}
        
        <SelectScrollDownButton />
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  );
}

interface EnhancedSelectItemProps extends React.ComponentProps<typeof SelectPrimitive.Item> {
  icon?: React.ReactNode;
  children: React.ReactNode;
}

function EnhancedSelectItem({
  className,
  icon,
  children,
  ...props
}: EnhancedSelectItemProps) {
  return (
    <SelectPrimitive.Item
      className={cn(
        "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm outline-none cursor-pointer",
        "text-foreground hover:text-primary",
        "hover:bg-primary/6 data-[highlighted]:bg-primary/6 data-[highlighted]:text-primary",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "transition-colors duration-150",
        "data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary data-[state=checked]:font-medium",
        className
      )}
      {...props}
    >
      <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </span>
      
      <SelectPrimitive.ItemText className="flex-1 truncate">
        {children}
      </SelectPrimitive.ItemText>
      
      <span className="absolute right-3 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="h-4 w-4 text-primary" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  );
}

function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      className={cn(
        "px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide",
        className
      )}
      {...props}
    />
  );
}

function SelectSeparator({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      className={cn(
        "flex cursor-default items-center justify-center py-1 text-muted-foreground hover:text-foreground",
        className
      )}
      {...props}
    >
      <ChevronUpIcon className="h-4 w-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      className={cn(
        "flex cursor-default items-center justify-center py-1 text-muted-foreground hover:text-foreground",
        className
      )}
      {...props}
    >
      <ChevronDownIcon className="h-4 w-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

export { EnhancedSelect };
export type { Option, Group, EnhancedSelectProps };
