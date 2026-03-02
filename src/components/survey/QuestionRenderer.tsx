"use client";

import type { Question, AnswerValue } from "@/lib/types";
import { SingleChoiceQuestion } from "./questions/SingleChoiceQuestion";
import { MultipleChoiceQuestion } from "./questions/MultipleChoiceQuestion";
import { TextQuestion } from "./questions/TextQuestion";
import { RatingQuestion } from "./questions/RatingQuestion";
import { DateTimeQuestion } from "./questions/DateTimeQuestion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface QuestionRendererProps {
  question: Question;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
}

export function QuestionRenderer({
  question,
  value,
  onChange,
}: QuestionRendererProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-2">
          <CardTitle className="text-base flex-1">
            {question.title}
          </CardTitle>
          {question.required && (
            <Badge variant="destructive" className="text-xs shrink-0">
              필수
            </Badge>
          )}
        </div>
        {question.description && (
          <p className="text-sm text-muted-foreground">{question.description}</p>
        )}
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
