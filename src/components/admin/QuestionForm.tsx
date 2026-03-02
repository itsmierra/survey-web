"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Question, QuestionOption, QuestionType } from "@/lib/types";

interface QuestionFormProps {
  surveyId: string;
  question: Question | null;
  orderIndex: number;
  allQuestions: Question[];
  onSaved: () => void;
  onCancel: () => void;
}

export function QuestionForm({
  surveyId,
  question,
  orderIndex,
  allQuestions,
  onSaved,
  onCancel,
}: QuestionFormProps) {
  const [type, setType] = useState<QuestionType>(
    question?.type || "single_choice"
  );
  const [title, setTitle] = useState(question?.title || "");
  const [description, setDescription] = useState(question?.description || "");
  const [required, setRequired] = useState(question?.required || false);
  const [options, setOptions] = useState<QuestionOption[]>(
    question?.options || [{ label: "", value: "" }]
  );
  const [hasCondition, setHasCondition] = useState(!!question?.condition);
  const [conditionQuestionId, setConditionQuestionId] = useState(
    question?.condition?.question_id || ""
  );
  const [conditionValue, setConditionValue] = useState(
    (question?.condition?.value as string) || ""
  );
  const [loading, setLoading] = useState(false);

  const needsOptions = type === "single_choice" || type === "multiple_choice";

  const handleAddOption = () => {
    setOptions([...options, { label: "", value: "" }]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, label: string) => {
    const updated = [...options];
    updated[index] = { label, value: label.toLowerCase().replace(/\s+/g, "_") };
    setOptions(updated);
  };

  const handleSubmit = async () => {
    setLoading(true);

    const body = {
      survey_id: surveyId,
      type,
      title,
      description: description || null,
      required,
      order_index: orderIndex,
      options: needsOptions ? options.filter((o) => o.label.trim()) : null,
      condition: hasCondition && conditionQuestionId
        ? {
            question_id: conditionQuestionId,
            operator: "equals",
            value: conditionValue,
          }
        : null,
    };

    if (question) {
      await fetch(`/api/questions/${question.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    setLoading(false);
    onSaved();
  };

  const conditionCandidates = allQuestions.filter(
    (q) =>
      q.id !== question?.id &&
      (q.type === "single_choice" || q.type === "multiple_choice")
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {question ? "문항 수정" : "새 문항 추가"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>문항 유형</Label>
          <Select value={type} onValueChange={(v) => setType(v as QuestionType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single_choice">단일 선택</SelectItem>
              <SelectItem value="multiple_choice">복수 선택</SelectItem>
              <SelectItem value="text">주관식</SelectItem>
              <SelectItem value="rating">평점 (1~5)</SelectItem>
              <SelectItem value="datetime">날짜/시간</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>문항 제목</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="문항을 입력하세요"
          />
        </div>

        <div className="space-y-2">
          <Label>부연 설명 (선택)</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="문항에 대한 추가 설명..."
            rows={2}
          />
        </div>

        {needsOptions && (
          <div className="space-y-2">
            <Label>보기</Label>
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={option.label}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`보기 ${index + 1}`}
                />
                {options.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveOption(index)}
                  >
                    삭제
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={handleAddOption}>
              + 보기 추가
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Checkbox
            id="required"
            checked={required}
            onCheckedChange={(checked) => setRequired(checked === true)}
          />
          <Label htmlFor="required">필수 응답</Label>
        </div>

        {conditionCandidates.length > 0 && (
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="hasCondition"
                checked={hasCondition}
                onCheckedChange={(checked) => setHasCondition(checked === true)}
              />
              <Label htmlFor="hasCondition">조건부 문항 (특정 답변 시에만 표시)</Label>
            </div>

            {hasCondition && (
              <div className="space-y-2 ml-6">
                <Select
                  value={conditionQuestionId}
                  onValueChange={setConditionQuestionId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="조건 문항 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditionCandidates.map((q) => (
                      <SelectItem key={q.id} value={q.id}>
                        {q.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {conditionQuestionId && (
                  <div className="space-y-1">
                    <Label className="text-sm">다음 값을 선택했을 때 표시:</Label>
                    <Select value={conditionValue} onValueChange={setConditionValue}>
                      <SelectTrigger>
                        <SelectValue placeholder="값 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {conditionCandidates
                          .find((q) => q.id === conditionQuestionId)
                          ?.options?.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSubmit} disabled={loading || !title.trim()}>
            {loading ? "저장 중..." : question ? "수정" : "추가"}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            취소
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
