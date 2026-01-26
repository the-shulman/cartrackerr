import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DateRange } from "@/hooks/useMetrics";

interface DateRangeSelectorProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export function DateRangeSelector({ dateRange, onDateRangeChange }: DateRangeSelectorProps) {
  const presets = [
    {
      label: "Últimos 7 días",
      getValue: () => ({ startDate: subDays(new Date(), 7), endDate: new Date() }),
    },
    {
      label: "Últimos 30 días",
      getValue: () => ({ startDate: subDays(new Date(), 30), endDate: new Date() }),
    },
    {
      label: "Este mes",
      getValue: () => ({ startDate: startOfMonth(new Date()), endDate: new Date() }),
    },
    {
      label: "Mes pasado",
      getValue: () => ({
        startDate: startOfMonth(subMonths(new Date(), 1)),
        endDate: endOfMonth(subMonths(new Date(), 1)),
      }),
    },
    {
      label: "Últimos 3 meses",
      getValue: () => ({ startDate: subMonths(new Date(), 3), endDate: new Date() }),
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1">
        {presets.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            onClick={() => onDateRangeChange(preset.getValue())}
            className="text-xs"
          >
            {preset.label}
          </Button>
        ))}
      </div>
      
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="min-w-[130px]">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(dateRange.startDate, "d MMM yyyy", { locale: es })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRange.startDate}
              onSelect={(date) => date && onDateRangeChange({ ...dateRange, startDate: date })}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        
        <span className="text-muted-foreground">-</span>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="min-w-[130px]">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(dateRange.endDate, "d MMM yyyy", { locale: es })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRange.endDate}
              onSelect={(date) => date && onDateRangeChange({ ...dateRange, endDate: date })}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
