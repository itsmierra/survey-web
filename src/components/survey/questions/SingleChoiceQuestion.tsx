"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
    <RadioGroup value={value || ""} onValueChange={onChange}>
      {options.map((option) => (
        <div key={option.value} className="flex items-center space-x-3 py-2">
          <RadioGroupItem value={option.value} id={option.value} />
          <Label htmlFor={option.value} className="text-base cursor-pointer flex-1">
            {option.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}
