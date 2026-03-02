"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Question, RespondentWithAnswers, AnswerValue } from "@/lib/types";

interface ResponseTableProps {
  questions: Question[];
  respondents: RespondentWithAnswers[];
}

function formatAnswer(question: Question, value: AnswerValue | undefined): string {
  if (!value) return "-";

  switch (question.type) {
    case "single_choice": {
      const selected = value.selected as string;
      return question.options?.find((o) => o.value === selected)?.label || selected || "-";
    }
    case "multiple_choice": {
      const selected = value.selected as string[];
      return (
        selected
          ?.map((s) => question.options?.find((o) => o.value === s)?.label || s)
          .join(", ") || "-"
      );
    }
    case "text":
      return value.text || "-";
    case "rating":
      return value.rating !== undefined ? `${value.rating}점` : "-";
    case "datetime":
      return value.datetime
        ? new Date(value.datetime).toLocaleString("ko-KR")
        : "-";
    default:
      return "-";
  }
}

export function ResponseTable({
  questions,
  respondents,
}: ResponseTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-white">이름</TableHead>
            <TableHead>응답일시</TableHead>
            {questions.map((q) => (
              <TableHead key={q.id} className="min-w-[150px]">
                {q.title}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {respondents.map((respondent) => (
            <TableRow key={respondent.id}>
              <TableCell className="sticky left-0 bg-white font-medium">
                {respondent.name}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {new Date(respondent.created_at).toLocaleString("ko-KR")}
              </TableCell>
              {questions.map((q) => {
                const answer = respondent.answers.find(
                  (a) => a.question_id === q.id
                );
                return (
                  <TableCell key={q.id} className="text-sm">
                    {formatAnswer(q, answer?.value as AnswerValue | undefined)}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
