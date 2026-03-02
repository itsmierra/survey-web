"use client";

import type { QuestionOption } from "@/lib/types";

interface MultipleChoiceQuestionProps {
  options: QuestionOption[];
  value: string[] | undefined;
  onChange: (value: string[]) => void;
}

export function MultipleChoiceQuestion({
  options,
  value = [],
  onChange,
}: MultipleChoiceQuestionProps) {
  const handleToggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <div className="space-y-2">
      {options.map((option) => {
        const checked = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleToggle(option.value)}
            className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
              checked
                ? "border-violet-500 bg-violet-50 text-violet-700 shadow-sm dark:bg-violet-950 dark:text-violet-300"
                : "border-transparent bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            <span className="flex items-center gap-3">
              <span
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                  checked ? "border-violet-500 bg-violet-500" : "border-slate-300"
                }`}
              >
                {checked && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
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
