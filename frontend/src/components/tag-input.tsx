"use client";
import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const COLORS = [
  "bg-sky-100 text-sky-800 border-sky-200",
  "bg-violet-100 text-violet-800 border-violet-200",
  "bg-emerald-100 text-emerald-800 border-emerald-200",
  "bg-amber-100 text-amber-800 border-amber-200",
  "bg-rose-100 text-rose-800 border-rose-200",
  "bg-teal-100 text-teal-800 border-teal-200",
  "bg-indigo-100 text-indigo-800 border-indigo-200",
  "bg-orange-100 text-orange-800 border-orange-200",
];

function colorFor(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash + value.charCodeAt(i) * 17) % COLORS.length;
  return COLORS[hash]!;
}

export function TagInput({
  value,
  onChange,
  placeholder,
  max = 20,
  name,
  lowercase = true,
  capitalize = true,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  max?: number;
  name?: string;
  lowercase?: boolean;
  capitalize?: boolean;
}) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const parts = raw
      .split(",")
      .map((p) => {
        const trimmed = p.trim();
        return lowercase ? trimmed.toLowerCase() : trimmed;
      })
      .filter(Boolean);
    if (!parts.length) return;
    const next = [...value];
    for (const part of parts) {
      if (next.length >= max) break;
      if (!next.includes(part)) next.push(part);
    }
    onChange(next);
    setDraft("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="rounded-md border bg-white px-2 py-2 focus-within:ring-2 focus-within:ring-ring/25">
      <input type="hidden" name={name} value={value.join(",")} />
      <div className="flex flex-wrap gap-1.5">
        {value.map((tag) => (
          <span
            key={tag}
            className={cn(
              "inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-1 text-xs",
              capitalize && "capitalize",
              colorFor(tag),
            )}
          >
            <span className="truncate">{tag}</span>
            <button
              type="button"
              className="rounded-full p-0.5 hover:bg-black/10"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              aria-label={`Remove ${tag}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <Input
          value={draft}
          onChange={(e) => {
            const v = e.target.value;
            if (v.includes(",")) add(v);
            else setDraft(v);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => {
            if (draft.trim()) add(draft);
          }}
          placeholder={value.length ? "" : placeholder}
          className="h-8 min-w-[140px] flex-1 border-0 px-1 shadow-none focus-visible:ring-0"
        />
      </div>
    </div>
  );
}

export function TagChip({ tag }: { tag: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[11px] capitalize",
        colorFor(tag),
      )}
    >
      {tag}
    </span>
  );
}
