"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
      {options.map((option) => (
        <div key={option.value} className="flex items-center space-x-3 py-2">
          <Checkbox
            id={option.value}
            checked={value.includes(option.value)}
            onCheckedChange={() => handleToggle(option.value)}
          />
          <Label htmlFor={option.value} className="text-base cursor-pointer flex-1">
            {option.label}
          </Label>
        </div>
      ))}
    </div>
  );
}
