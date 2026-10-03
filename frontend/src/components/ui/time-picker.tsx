"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function TimePicker({
  value,
  onChange,
  disabled,
  placeholder = "Select time",
}: TimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedHour, setSelectedHour] = React.useState<string>("");
  const [selectedMinute, setSelectedMinute] = React.useState<string>("");

  const hours = React.useMemo(
    () => Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0")),
    []
  );

  const minutes = React.useMemo(
    () => Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0")),
    []
  );

  React.useEffect(() => {
    if (value && value.includes(":")) {
      const parts = value.split(":");
      const hour = parts[0] ?? "00";
      const minute = (parts[1] ?? "00").slice(0, 2);
      setSelectedHour(String(Number(hour)).padStart(2, "0"));
      setSelectedMinute(String(Number(minute)).padStart(2, "0"));
    }
  }, [value]);

  const handleHourSelect = (hour: string) => {
    setSelectedHour(hour);
  };

  const handleMinuteSelect = (minute: string) => {
    setSelectedMinute(minute);
  };

  const handleSetTime = () => {
    if (selectedHour && selectedMinute) {
      const timeString = `${selectedHour}:${selectedMinute}`;
      onChange(timeString);
      setIsOpen(false);
    }
  };

  const displayValue =
    selectedHour && selectedMinute ? `${selectedHour}:${selectedMinute}` : "";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[140px] justify-start text-left font-normal",
            !displayValue && "text-muted-foreground"
          )}
          type="button"
          disabled={disabled}
        >
          <Clock className="mr-2 h-4 w-4" />
          {displayValue || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col">
          <div className="flex">
            <div className="border-r">
              <div className="p-2 text-sm font-medium text-center border-b">
                Hours
              </div>
              <ScrollArea className="h-60">
                <div className="p-1 w-16">
                  {hours.map((hour) => (
                    <Button
                      key={hour}
                      variant={selectedHour === hour ? "default" : "ghost"}
                      size="sm"
                      type="button"
                      className="w-full h-8 justify-center text-sm mb-1"
                      onClick={() => handleHourSelect(hour)}
                    >
                      {hour}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div>
              <div className="p-2 text-sm font-medium text-center border-b">
                Minutes
              </div>
              <ScrollArea className="h-60">
                <div className="p-1 w-20">
                  {minutes.map((minute) => (
                    <Button
                      key={minute}
                      variant={selectedMinute === minute ? "default" : "ghost"}
                      type="button"
                      size="sm"
                      className="w-full h-8 justify-center text-sm mb-1"
                      onClick={() => handleMinuteSelect(minute)}
                    >
                      {minute}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          <div className="border-t p-2">
            <Button
              type="button"
              size="sm"
              className="w-full"
              onClick={handleSetTime}
              disabled={!selectedHour || !selectedMinute}
            >
              Set Time
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
