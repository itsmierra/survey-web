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
      className="text-base"
    />
  );
}
