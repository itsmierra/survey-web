"use client";

import { useState } from "react";

interface RatingQuestionProps {
  value: number | undefined;
  onChange: (value: number) => void;
}

export function RatingQuestion({ value, onChange }: RatingQuestionProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const active = hovered ?? value ?? 0;

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            className="p-1 transition-transform hover:scale-110"
            onMouseEnter={() => setHovered(rating)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onChange(rating)}
          >
            <svg
              className={`w-10 h-10 transition-colors ${
                rating <= active
                  ? "text-amber-400 drop-shadow-sm"
                  : "text-slate-200"
              }`}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        ))}
      </div>
      {value && (
        <span className="text-sm font-medium text-amber-600">
          {value}점
        </span>
      )}
    </div>
  );
}
