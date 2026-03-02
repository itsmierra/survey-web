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
  const [respondentId, setRespondentId] = useState<string | null>(null);
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
      // 기존 응답자: 답변 불러와서 수정 모드 진입
      const { data: existingAnswers } = await supabase
        .from("answers")
        .select("question_id, value")
        .eq("respondent_id", existing.id);

      if (existingAnswers) {
        const restored: Record<string, AnswerValue> = {};
        for (const a of existingAnswers) {
          restored[a.question_id] = a.value as AnswerValue;
        }
        setAnswers(restored);
      }

      setRespondentId(existing.id);
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
      let activeRespondentId = respondentId;

      if (!activeRespondentId) {
        // 신규 응답자
        const { data: respondent, error: respondentError } = await supabase
          .from("respondents")
          .insert({ survey_id: survey.id, name: name! })
          .select()
          .single();

        if (respondentError) throw respondentError;
        activeRespondentId = respondent.id;
      } else {
        // 수정 모드: 기존 답변 삭제
        const { error: deleteError } = await supabase
          .from("answers")
          .delete()
          .eq("respondent_id", activeRespondentId);

        if (deleteError) throw deleteError;
      }

      const answerRows = Object.entries(answers).map(
        ([question_id, value]) => ({
          respondent_id: activeRespondentId,
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

  if (submitting) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-8">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 rounded-full gradient-bg opacity-20 animate-ping" />
            <div className="relative w-24 h-24 rounded-full gradient-bg flex items-center justify-center shadow-lg animate-pulse">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 19V5m0 0l-4 4m4-4l4 4"
                />
              </svg>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-lg font-semibold text-violet-700 dark:text-violet-400">
              답변을 제출하고 있습니다
            </p>
            <div className="flex justify-center gap-1.5">
              <span className="loading-dot bg-violet-500" />
              <span className="loading-dot bg-purple-500" />
              <span className="loading-dot bg-fuchsia-500" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="glass-card rounded-2xl p-4 shadow-sm space-y-2 sticky top-4 z-10">
        <div className="flex justify-between text-sm font-medium">
          <span className="text-violet-700 dark:text-violet-400">
            {answeredCount}/{visibleQuestions.length} 문항
          </span>
          <span className="text-violet-700 dark:text-violet-400">{progressPercent}%</span>
        </div>
        <div className="h-2 rounded-full bg-violet-100 dark:bg-violet-900 overflow-hidden">
          <div
            className="h-full rounded-full gradient-bg transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {visibleQuestions.map((question, index) => (
        <QuestionRenderer
          key={question.id}
          question={question}
          value={answers[question.id]}
          onChange={(value) =>
            setAnswers((prev) => ({ ...prev, [question.id]: value }))
          }
          index={index}
        />
      ))}

      {submitError && (
        <p className="text-sm text-destructive text-center">{submitError}</p>
      )}

      <Button
        className="w-full h-12 rounded-xl text-base font-semibold gradient-bg text-white hover:opacity-90 shadow-lg"
        size="lg"
        onClick={handleSubmit}
        disabled={submitting}
      >
        설문 제출하기
      </Button>
    </div>
  );
}
