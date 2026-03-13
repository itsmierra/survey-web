"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuestionForm } from "./QuestionForm";
import { BatchQuestionForm } from "./BatchQuestionForm";
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

  useEffect(() => {
    setQuestions(initialQuestions);
  }, [initialQuestions]);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const handleSaved = () => {
    setShowForm(false);
    setShowBatchForm(false);
    setEditingQuestion(null);
    router.refresh();
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm("이 문항을 삭제하시겠습니까?")) return;
    await fetch(`/api/questions/${questionId}`, { method: "DELETE" });
    setQuestions(questions.filter((q) => q.id !== questionId));
    router.refresh();
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
    router.refresh();
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
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <Card key={question.id} className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </span>
                <CardTitle className="text-base">{question.title}</CardTitle>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs">
                  {typeLabels[question.type]}
                </Badge>
                {question.required && (
                  <Badge className="text-xs bg-rose-100 text-rose-700 hover:bg-rose-100">
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
                  setShowBatchForm(false);
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

      {showForm && (
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
      )}

      {showBatchForm && (
        <BatchQuestionForm
          surveyId={surveyId}
          startOrderIndex={questions.length}
          allQuestions={questions}
          onSaved={handleSaved}
          onCancel={() => setShowBatchForm(false)}
        />
      )}

      {!showForm && !showBatchForm && (
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setEditingQuestion(null);
              setShowForm(true);
            }}
            variant="outline"
            className="flex-1"
          >
            + 문항 1개 추가
          </Button>
          <Button
            onClick={() => setShowBatchForm(true)}
            className="flex-1 gradient-bg text-white hover:opacity-90"
          >
            + 여러 문항 한번에 추가
          </Button>
        </div>
      )}
    </div>
  );
}
