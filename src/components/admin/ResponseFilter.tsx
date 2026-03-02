"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import type { Question, RespondentWithAnswers } from "@/lib/types";

interface FilterOption {
  label: string;
  value: string;
  count: number;
}

interface FilterConfig {
  question: Question;
  options: FilterOption[];
}

interface ResponseFilterProps {
  questions: Question[];
  respondents: RespondentWithAnswers[];
  activeFilters: Record<string, string | null>; // questionId -> selected option value (null = all)
  onFilterChange: (questionId: string, value: string | null) => void;
}

function detectFilterableQuestions(questions: Question[]): Question[] {
  // Prioritize: questions with "팀" in title, then other choice questions
  const teamQuestions = questions.filter(
    (q) =>
      (q.type === "single_choice" || q.type === "multiple_choice") &&
      q.title.includes("팀")
  );

  const otherChoiceQuestions = questions.filter(
    (q) =>
      (q.type === "single_choice" || q.type === "multiple_choice") &&
      !q.title.includes("팀")
  );

  return [...teamQuestions, ...otherChoiceQuestions];
}

function buildFilterConfig(
  question: Question,
  respondents: RespondentWithAnswers[]
): FilterConfig {
  const options: FilterOption[] = (question.options || []).map((opt) => {
    const count = respondents.filter((r) =>
      r.answers.some((a) => {
        if (a.question_id !== question.id) return false;
        const selected = a.value?.selected;
        if (Array.isArray(selected)) return selected.includes(opt.value);
        return selected === opt.value;
      })
    ).length;

    return { label: opt.label, value: opt.value, count };
  });

  return { question, options };
}

export function ResponseFilter({
  questions,
  respondents,
  activeFilters,
  onFilterChange,
}: ResponseFilterProps) {
  const filterConfigs = useMemo(() => {
    const filterable = detectFilterableQuestions(questions);
    return filterable.map((q) => buildFilterConfig(q, respondents));
  }, [questions, respondents]);

  if (filterConfigs.length === 0) return null;

  return (
    <div className="space-y-3">
      {filterConfigs.map(({ question, options }) => {
        const activeValue = activeFilters[question.id] ?? null;

        return (
          <div key={question.id} className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground shrink-0">
              {question.title}:
            </span>
            <button
              onClick={() => onFilterChange(question.id, null)}
              className="focus:outline-none"
            >
              <Badge
                variant={activeValue === null ? "default" : "outline"}
                className="cursor-pointer"
              >
                전체 ({respondents.length})
              </Badge>
            </button>
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() =>
                  onFilterChange(
                    question.id,
                    activeValue === opt.value ? null : opt.value
                  )
                }
                className="focus:outline-none"
              >
                <Badge
                  variant={activeValue === opt.value ? "default" : "outline"}
                  className="cursor-pointer"
                >
                  {opt.label} ({opt.count})
                </Badge>
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export function applyFilters(
  respondents: RespondentWithAnswers[],
  questions: Question[],
  activeFilters: Record<string, string | null>
): RespondentWithAnswers[] {
  const activeEntries = Object.entries(activeFilters).filter(
    ([, value]) => value !== null
  );

  if (activeEntries.length === 0) return respondents;

  return respondents.filter((r) =>
    activeEntries.every(([questionId, filterValue]) => {
      const answer = r.answers.find((a) => a.question_id === questionId);
      if (!answer) return false;
      const selected = answer.value?.selected;
      if (Array.isArray(selected)) return selected.includes(filterValue!);
      return selected === filterValue;
    })
  );
}
