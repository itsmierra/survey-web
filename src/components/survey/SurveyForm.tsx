"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { NameEntryForm } from "./NameEntryForm";
import { QuestionRenderer } from "./QuestionRenderer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { SurveyWithQuestions, AnswerValue, QuestionCondition } from "@/lib/types";

interface SurveyFormProps {
  survey: SurveyWithQuestions;
}

export function SurveyForm({ survey }: SurveyFormProps) {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 조건부 문항 필터링
  const visibleQuestions = useMemo(() => {
    return survey.questions.filter((q) => {
      if (!q.condition) return true;
      const condition = q.condition as QuestionCondition;
      const dependentAnswer = answers[condition.question_id];
      if (!dependentAnswer) return false;

      const selectedValue = dependentAnswer.selected;
      switch (condition.operator) {
        case "equals":
          if (Array.isArray(selectedValue)) {
            return Array.isArray(condition.value)
              ? condition.value.every((v) => selectedValue.includes(v))
              : selectedValue.includes(condition.value);
          }
          return selectedValue === condition.value;
        case "not_equals":
          return selectedValue !== condition.value;
        case "contains":
          if (Array.isArray(selectedValue)) {
            return Array.isArray(condition.value)
              ? condition.value.some((v) => selectedValue.includes(v))
              : selectedValue.includes(condition.value);
          }
          return false;
        default:
          return true;
      }
    });
  }, [survey.questions, answers]);

  const answeredCount = visibleQuestions.filter(
    (q) => answers[q.id] !== undefined
  ).length;
  const progressPercent =
    visibleQuestions.length > 0
      ? Math.round((answeredCount / visibleQuestions.length) * 100)
      : 0;

  const requiredUnanswered = visibleQuestions.filter(
    (q) => q.required && !answers[q.id]
  );

  const handleNameSubmit = async (inputName: string) => {
    const supabase = createClient();

    const { data: existing } = await supabase
      .from("respondents")
      .select("id")
      .eq("survey_id", survey.id)
      .eq("name", inputName)
      .single();

    if (existing) {
      setNameError("이미 응답한 이름입니다. 다른 이름을 입력해주세요.");
      return;
    }

    setName(inputName);
    setNameError(null);
  };

  const handleSubmit = async () => {
    if (requiredUnanswered.length > 0) {
      setSubmitError(
        `필수 문항 ${requiredUnanswered.length}개에 답변해주세요.`
      );
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const supabase = createClient();

      const { data: respondent, error: respondentError } = await supabase
        .from("respondents")
        .insert({ survey_id: survey.id, name: name! })
        .select()
        .single();

      if (respondentError) throw respondentError;

      const answerRows = Object.entries(answers).map(
        ([question_id, value]) => ({
          respondent_id: respondent.id,
          question_id,
          value,
        })
      );

      if (answerRows.length > 0) {
        const { error: answerError } = await supabase
          .from("answers")
          .insert(answerRows);

        if (answerError) throw answerError;
      }

      router.push(`/survey/${survey.id}/complete`);
    } catch {
      setSubmitError("제출 중 오류가 발생했습니다. 다시 시도해주세요.");
      setSubmitting(false);
    }
  };

  if (!name) {
    return (
      <NameEntryForm
        surveyTitle={survey.title}
        onSubmit={handleNameSubmit}
        error={nameError}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            {answeredCount}/{visibleQuestions.length} 문항
          </span>
          <span>{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} />
      </div>

      {visibleQuestions.map((question) => (
        <QuestionRenderer
          key={question.id}
          question={question}
          value={answers[question.id]}
          onChange={(value) =>
            setAnswers((prev) => ({ ...prev, [question.id]: value }))
          }
        />
      ))}

      {submitError && (
        <p className="text-sm text-destructive text-center">{submitError}</p>
      )}

      <Button
        className="w-full"
        size="lg"
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? "제출 중..." : "설문 제출하기"}
      </Button>
    </div>
  );
}
