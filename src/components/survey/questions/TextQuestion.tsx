"use client";

import { Textarea } from "@/components/ui/textarea";

interface TextQuestionProps {
  value: string | undefined;
  onChange: (value: string) => void;
}

export function TextQuestion({ value, onChange }: TextQuestionProps) {
  return (
    <Textarea
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder="답변을 입력해주세요..."
      rows={3}
      className="text-sm rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-colors resize-none dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-700"
    />
  );
}
