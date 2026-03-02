"use client";

import { Input } from "@/components/ui/input";

interface DateTimeQuestionProps {
  value: string | undefined;
  onChange: (value: string) => void;
}

export function DateTimeQuestion({ value, onChange }: DateTimeQuestionProps) {
  return (
    <Input
      type="datetime-local"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="text-sm rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-colors dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-700"
    />
  );
}
