"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuestionForm } from "./QuestionForm";
import type { Question } from "@/lib/types";

interface QuestionEditorProps {
  surveyId: string;
  initialQuestions: Question[];
}

const typeLabels: Record<string, string> = {
  single_choice: "단일 선택",
  multiple_choice: "복수 선택",
  text: "주관식",
  rating: "평점",
  datetime: "날짜/시간",
};

export function QuestionEditor({
  surveyId,
  initialQuestions,
}: QuestionEditorProps) {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const handleSaved = () => {
    setShowForm(false);
    setEditingQuestion(null);
    router.refresh();
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm("이 문항을 삭제하시겠습니까?")) return;
    await fetch(`/api/questions/${questionId}`, { method: "DELETE" });
    setQuestions(questions.filter((q) => q.id !== questionId));
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newQuestions = [...questions];
    [newQuestions[index - 1], newQuestions[index]] = [
      newQuestions[index],
      newQuestions[index - 1],
    ];
    setQuestions(newQuestions);
    await fetch("/api/questions/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orders: newQuestions.map((q, i) => ({ id: q.id, order_index: i })),
      }),
    });
  };

  const handleMoveDown = async (index: number) => {
    if (index === questions.length - 1) return;
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[index + 1]] = [
      newQuestions[index + 1],
      newQuestions[index],
    ];
    setQuestions(newQuestions);
    await fetch("/api/questions/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orders: newQuestions.map((q, i) => ({ id: q.id, order_index: i })),
      }),
    });
  };

  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <Card key={question.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {index + 1}.
                </span>
                <CardTitle className="text-base">{question.title}</CardTitle>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs">
                  {typeLabels[question.type]}
                </Badge>
                {question.required && (
                  <Badge variant="destructive" className="text-xs">
                    필수
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
              >
                위로
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMoveDown(index)}
                disabled={index === questions.length - 1}
              >
                아래로
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingQuestion(question);
                  setShowForm(true);
                }}
              >
                수정
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => handleDelete(question.id)}
              >
                삭제
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {showForm ? (
        <QuestionForm
          surveyId={surveyId}
          question={editingQuestion}
          orderIndex={editingQuestion?.order_index ?? questions.length}
          allQuestions={questions}
          onSaved={handleSaved}
          onCancel={() => {
            setShowForm(false);
            setEditingQuestion(null);
          }}
        />
      ) : (
        <Button onClick={() => setShowForm(true)} variant="outline" className="w-full">
          + 문항 추가
        </Button>
      )}
    </div>
  );
}
