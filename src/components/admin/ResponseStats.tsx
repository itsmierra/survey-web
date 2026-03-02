"use client";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Question, RespondentWithAnswers, AnswerValue } from "@/lib/types";

interface ResponseStatsProps {
  questions: Question[];
  respondents: RespondentWithAnswers[];
}

const COLORS = ["#2563eb", "#16a34a", "#eab308", "#dc2626", "#9333ea", "#f97316"];

export function ResponseStats({ questions, respondents }: ResponseStatsProps) {
  const getAnswersForQuestion = (questionId: string): AnswerValue[] => {
    return respondents
      .flatMap((r) => r.answers)
      .filter((a) => a.question_id === questionId)
      .map((a) => a.value as AnswerValue);
  };

  return (
    <div className="space-y-6">
      {questions.map((question) => {
        const answers = getAnswersForQuestion(question.id);

        return (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle className="text-base">{question.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {answers.length}명 응답
              </p>
            </CardHeader>
            <CardContent>
              {(question.type === "single_choice" ||
                question.type === "multiple_choice") && (
                <ChoiceStats question={question} answers={answers} />
              )}
              {question.type === "rating" && (
                <RatingStats answers={answers} />
              )}
              {question.type === "text" && (
                <TextStats answers={answers} />
              )}
              {question.type === "datetime" && (
                <DatetimeStats answers={answers} />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ChoiceStats({
  question,
  answers,
}: {
  question: Question;
  answers: AnswerValue[];
}) {
  const counts: Record<string, number> = {};
  question.options?.forEach((opt) => (counts[opt.label] = 0));

  answers.forEach((a) => {
    const selected = a.selected;
    if (Array.isArray(selected)) {
      selected.forEach((s) => {
        const opt = question.options?.find((o) => o.value === s);
        if (opt) counts[opt.label] = (counts[opt.label] || 0) + 1;
      });
    } else if (selected) {
      const opt = question.options?.find((o) => o.value === selected);
      if (opt) counts[opt.label] = (counts[opt.label] || 0) + 1;
    }
  });

  const chartData = Object.entries(counts).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            label={(props) => {
              const { name, percent } = props as { name?: string; percent?: number };
              return `${name ?? ""} (${(((percent ?? 0)) * 100).toFixed(0)}%)`;
            }}
          >
            {chartData.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} layout="vertical">
          <XAxis type="number" allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={100} fontSize={12} />
          <Tooltip />
          <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function RatingStats({ answers }: { answers: AnswerValue[] }) {
  const ratings = answers.map((a) => a.rating).filter((r): r is number => r !== undefined);
  const avg = ratings.length > 0
    ? (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1)
    : "0";

  const distribution = [1, 2, 3, 4, 5].map((r) => ({
    rating: `${r}점`,
    count: ratings.filter((v) => v === r).length,
  }));

  return (
    <div className="space-y-4">
      <p className="text-2xl font-bold text-center">평균 {avg}점</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={distribution}>
          <XAxis dataKey="rating" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#eab308" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TextStats({ answers }: { answers: AnswerValue[] }) {
  const texts = answers.map((a) => a.text).filter((t): t is string => !!t);

  return (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {texts.length === 0 && (
        <p className="text-muted-foreground">응답 없음</p>
      )}
      {texts.map((text, i) => (
        <div key={i} className="p-2 bg-muted rounded text-sm">
          {text}
        </div>
      ))}
    </div>
  );
}

function DatetimeStats({ answers }: { answers: AnswerValue[] }) {
  const dates = answers
    .map((a) => a.datetime)
    .filter((d): d is string => !!d);

  return (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {dates.length === 0 && (
        <p className="text-muted-foreground">응답 없음</p>
      )}
      {dates.map((dt, i) => (
        <div key={i} className="p-2 bg-muted rounded text-sm">
          {new Date(dt).toLocaleString("ko-KR")}
        </div>
      ))}
    </div>
  );
}
