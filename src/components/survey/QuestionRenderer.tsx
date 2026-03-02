"use client";

import type { Question, AnswerValue } from "@/lib/types";
import { SingleChoiceQuestion } from "./questions/SingleChoiceQuestion";
import { MultipleChoiceQuestion } from "./questions/MultipleChoiceQuestion";
import { TextQuestion } from "./questions/TextQuestion";
import { RatingQuestion } from "./questions/RatingQuestion";
import { DateTimeQuestion } from "./questions/DateTimeQuestion";

interface QuestionRendererProps {
  question: Question;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
  index: number;
}

export function QuestionRenderer({
  question,
  value,
  onChange,
  index,
}: QuestionRendererProps) {
  const isAnswered = value !== undefined;

  return (
    <div
      className="animate-fade-in-up glass-card rounded-2xl shadow-sm overflow-hidden"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start gap-3">
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
              isAnswered
                ? "gradient-bg text-white shadow-sm"
                : "bg-violet-100 text-violet-600 dark:bg-violet-900 dark:text-violet-400"
            }`}
          >
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold leading-snug">
              {question.title}
              {question.required && (
                <span className="text-rose-500 ml-1">*</span>
              )}
            </h3>
            {question.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {question.description}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="px-5 pb-5">
        {question.type === "single_choice" && question.options && (
          <SingleChoiceQuestion
            options={question.options}
            value={value?.selected as string | undefined}
            onChange={(selected) => onChange({ selected })}
          />
        )}
        {question.type === "multiple_choice" && question.options && (
          <MultipleChoiceQuestion
            options={question.options}
            value={value?.selected as string[] | undefined}
            onChange={(selected) => onChange({ selected })}
          />
        )}
        {question.type === "text" && (
          <TextQuestion
            value={value?.text}
            onChange={(text) => onChange({ text })}
          />
        )}
        {question.type === "rating" && (
          <RatingQuestion
            value={value?.rating}
            onChange={(rating) => onChange({ rating })}
          />
        )}
        {question.type === "datetime" && (
          <DateTimeQuestion
            value={value?.datetime}
            onChange={(datetime) => onChange({ datetime })}
          />
        )}
      </div>
    </div>
  );
}
