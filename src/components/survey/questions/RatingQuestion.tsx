"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RatingQuestionProps {
  value: number | undefined;
  onChange: (value: number) => void;
}

export function RatingQuestion({ value, onChange }: RatingQuestionProps) {
  return (
    <div className="flex gap-2 justify-center py-2">
      {[1, 2, 3, 4, 5].map((rating) => (
        <Button
          key={rating}
          type="button"
          variant={value === rating ? "default" : "outline"}
          className={cn(
            "w-12 h-12 text-lg",
            value === rating && "ring-2 ring-offset-2"
          )}
          onClick={() => onChange(rating)}
        >
          {rating}
        </Button>
      ))}
    </div>
  );
}
