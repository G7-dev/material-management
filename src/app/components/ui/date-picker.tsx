"use client";

import { useState, useEffect, type MouseEvent } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, XIcon } from "lucide-react";
import { cn } from "./utils";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
  showTime?: boolean;
  dateFormat?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "filled" | "borderless";
}

interface CalendarProps {
  month: Date;
  selected?: Date;
  onSelect?: (date: Date) => void;
  onMonthChange?: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  showTime?: boolean;
  onTimeChange?: (hours: number, minutes: number) => void;
}

function Calendar({
  month,
  selected,
  onSelect,
  onMonthChange,
  minDate,
  maxDate,
  showTime = false,
  onTimeChange,
}: CalendarProps) {
  const [selectedTime, setSelectedTime] = useState({ hours: new Date().getHours(), minutes: new Date().getMinutes() });

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const monthIndex = date.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, monthIndex, day));
    }

    return days;
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const isDateSelected = (date: Date) => {
    if (!selected) return false;
    return (
      date.getFullYear() === selected.getFullYear() &&
      date.getMonth() === selected.getMonth() &&
      date.getDate() === selected.getDate()
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const handlePreviousMonth = () => {
    const newMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1);
    onMonthChange?.(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    onMonthChange?.(newMonth);
  };

  const handleTimeChange = (type: "hours" | "minutes", value: number) => {
    const newTime = { ...selectedTime, [type]: value };
    setSelectedTime(newTime);
    onTimeChange?.(newTime.hours, newTime.minutes);
  };

  const days = getDaysInMonth(month);
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-muted"
          onClick={handlePreviousMonth}
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        
        <div className="text-center">
          <h3 className="font-semibold text-foreground">
            {format(month, "yyyy年MM月", { locale: zhCN })}
          </h3>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-muted"
          onClick={handleNextMonth}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="h-9" />;
          }

          const disabled = isDateDisabled(date);
          const selected = isDateSelected(date);
          const today = isToday(date);

          return (
            <Button
              key={date.toISOString()}
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 text-sm rounded-lg transition-all duration-200",
                "hover:bg-primary/10 hover:text-primary",
                today && "text-primary font-semibold",
                selected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                disabled && "text-muted-foreground/30 hover:bg-transparent hover:text-muted-foreground/30 cursor-not-allowed"
              )}
              disabled={disabled}
              onClick={() => onSelect?.(date)}
            >
              {date.getDate()}
            </Button>
          );
        })}
      </div>

      {/* Time Picker */}
      {showTime && (
        <div className="mt-4 pt-4 border-t border-border">
          <label className="block text-sm font-medium text-foreground mb-3">
            时间
          </label>
          <div className="flex items-center justify-center gap-1">
            {/* Hour selector */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  const newVal = (selectedTime.hours + 1) % 24;
                  handleTimeChange('hours', newVal);
                }}
                className="w-9 h-6 flex items-center justify-center rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
              >
                <ChevronUpIcon className="w-3.5 h-3.5" />
              </button>
              <span className="text-xl font-bold text-foreground w-10 text-center tabular-nums">
                {String(selectedTime.hours).padStart(2, '0')}
              </span>
              <button
                type="button"
                onClick={() => {
                  const newVal = (selectedTime.hours - 1 + 24) % 24;
                  handleTimeChange('hours', newVal);
                }}
                className="w-9 h-6 flex items-center justify-center rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
              >
                <ChevronRightIcon className="w-3.5 h-3.5 rotate-90" />
              </button>
            </div>
            <span className="text-lg font-bold text-muted-foreground mx-2">:</span>
            {/* Minute selector */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  const newVal = (selectedTime.minutes + 5) % 60;
                  handleTimeChange('minutes', newVal);
                }}
                className="w-9 h-6 flex items-center justify-center rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
              >
                <ChevronUpIcon className="w-3.5 h-3.5" />
              </button>
              <span className="text-xl font-bold text-foreground w-10 text-center tabular-nums">
                {String(selectedTime.minutes).padStart(2, '0')}
              </span>
              <button
                type="button"
                onClick={() => {
                  const newVal = (selectedTime.minutes - 5 + 60) % 60;
                  handleTimeChange('minutes', newVal);
                }}
                className="w-9 h-6 flex items-center justify-center rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
              >
                <ChevronRightIcon className="w-3.5 h-3.5 rotate-90" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DatePicker({
  value,
  onChange,
  placeholder = "请选择日期",
  className,
  disabled = false,
  label,
  error,
  helperText,
  required = false,
  minDate,
  maxDate,
  showTime = false,
  dateFormat = "yyyy年MM月dd日",
  size = "md",
  variant = "default",
}: DatePickerProps) {
  const [month, setMonth] = useState(value || new Date());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (value) {
      setMonth(value);
    }
  }, [value]);

  const handleDateSelect = (date: Date) => {
    let newDate = date;
    
    if (showTime && value) {
      // Preserve time if showTime is enabled
      newDate.setHours(value.getHours(), value.getMinutes());
    }
    
    onChange?.(newDate);
    if (!showTime) {
      setOpen(false);
    }
  };

  const handleTimeChange = (hours: number, minutes: number) => {
    if (value) {
      const newDate = new Date(value);
      newDate.setHours(hours, minutes);
      onChange?.(newDate);
    } else {
      const newDate = new Date();
      newDate.setHours(hours, minutes);
      onChange?.(newDate);
    }
  };

  const handleClear = (e: MouseEvent) => {
    e.stopPropagation();
    onChange?.(undefined);
  };

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

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <label className="flex items-center gap-1 text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive">*</span>}
        </label>
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
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
              <CalendarIcon className="w-4 h-4 text-muted-foreground group-data-[state=open]:text-primary transition-colors" />
              
              {value ? (
                <span className="truncate">
                  {format(value, dateFormat, { locale: zhCN })}
                  {showTime && ` ${format(value, "HH:mm", { locale: zhCN })}`}
                </span>
              ) : (
                <span className="text-muted-foreground truncate">{placeholder}</span>
              )}
            </div>
            
            <div className="flex items-center gap-1 flex-shrink-0">
              {value && !disabled && (
                <button
                  onClick={handleClear}
                  className="p-1 rounded-full hover:bg-muted transition-colors"
                >
                  <XIcon className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
          </button>
        </PopoverTrigger>
        
        <PopoverContent
          className="w-auto p-4 rounded-xl border border-border bg-background shadow-xl shadow-black/10"
          align="start"
        >
          <Calendar
            month={month}
            selected={value}
            onSelect={handleDateSelect}
            onMonthChange={setMonth}
            minDate={minDate}
            maxDate={maxDate}
            showTime={showTime}
            onTimeChange={handleTimeChange}
          />
          
          <div className="flex gap-2 mt-4 pt-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-border"
              onClick={() => setOpen(false)}
            >
              取消
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={() => setOpen(false)}
            >
              确定
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      
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

export { DatePicker };
export type { DatePickerProps };
