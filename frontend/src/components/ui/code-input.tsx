"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function CodeInput({
  length = 6,
  value,
  onChange,
  disabled,
  autoFocus,
}: {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const refs = React.useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const setAt = (index: number, char: string) => {
    const next = digits.slice();
    next[index] = char;
    onChange(next.join("").slice(0, length));
  };

  return (
    <div className="flex justify-center gap-2" onPaste={(e) => {
      e.preventDefault();
      const pasted = e.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, length);
      if (!pasted) return;
      onChange(pasted);
      const focusAt = Math.min(pasted.length, length - 1);
      refs.current[focusAt]?.focus();
    }}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          value={digit}
          aria-label={`Digit ${index + 1}`}
          className={cn(
            "h-12 w-10 rounded-md border bg-transparent text-center text-lg font-semibold tabular-nums outline-none",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "disabled:opacity-50",
          )}
          onChange={(e) => {
            const char = e.target.value.replace(/\D/g, "").slice(-1);
            setAt(index, char);
            if (char && index < length - 1) refs.current[index + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[index] && index > 0) {
              refs.current[index - 1]?.focus();
            }
            if (e.key === "ArrowLeft" && index > 0) {
              refs.current[index - 1]?.focus();
            }
            if (e.key === "ArrowRight" && index < length - 1) {
              refs.current[index + 1]?.focus();
            }
          }}
        />
      ))}
    </div>
  );
}
