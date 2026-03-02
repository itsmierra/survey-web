"use client";

import type { QuestionOption } from "@/lib/types";

interface SingleChoiceQuestionProps {
  options: QuestionOption[];
  value: string | undefined;
  onChange: (value: string) => void;
}

export function SingleChoiceQuestion({
  options,
  value,
  onChange,
}: SingleChoiceQuestionProps) {
  return (
    <div className="space-y-2">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
              selected
                ? "border-violet-500 bg-violet-50 text-violet-700 shadow-sm dark:bg-violet-950 dark:text-violet-300"
                : "border-transparent bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            <span className="flex items-center gap-3">
              <span
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  selected ? "border-violet-500" : "border-slate-300"
                }`}
              >
                {selected && (
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                )}
              </span>
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
