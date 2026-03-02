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

interface DraftQuestion {
  id: string;
  type: QuestionType;
  title: string;
  description: string;
  required: boolean;
  options: QuestionOption[];
}

interface BatchQuestionFormProps {
  surveyId: string;
  startOrderIndex: number;
  allQuestions: Question[];
  onSaved: () => void;
  onCancel: () => void;
}

const typeLabels: Record<QuestionType, string> = {
  single_choice: "단일 선택",
  multiple_choice: "복수 선택",
  text: "주관식",
  rating: "평점 (1~5)",
  datetime: "날짜/시간",
};

let nextDraftId = 0;
function createDraftQuestion(): DraftQuestion {
  return {
    id: `draft-${++nextDraftId}`,
    type: "single_choice",
    title: "",
    description: "",
    required: false,
    options: [{ label: "", value: "" }],
  };
}

export function BatchQuestionForm({
  surveyId,
  startOrderIndex,
  onSaved,
  onCancel,
}: BatchQuestionFormProps) {
  const [drafts, setDrafts] = useState<DraftQuestion[]>([createDraftQuestion()]);
  const [loading, setLoading] = useState(false);

  const updateDraft = (draftId: string, updates: Partial<DraftQuestion>) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === draftId ? { ...d, ...updates } : d))
    );
  };

  const removeDraft = (draftId: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== draftId));
  };

  const addDraft = () => {
    setDrafts((prev) => [...prev, createDraftQuestion()]);
  };

  const handleOptionChange = (draftId: string, index: number, label: string) => {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.id !== draftId) return d;
        const updated = [...d.options];
        updated[index] = { label, value: label.toLowerCase().replace(/\s+/g, "_") };
        return { ...d, options: updated };
      })
    );
  };

  const addOption = (draftId: string) => {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.id !== draftId) return d;
        return { ...d, options: [...d.options, { label: "", value: "" }] };
      })
    );
  };

  const removeOption = (draftId: string, index: number) => {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.id !== draftId) return d;
        return { ...d, options: d.options.filter((_, i) => i !== index) };
      })
    );
  };

  const validDrafts = drafts.filter((d) => d.title.trim());

  const handleSubmitAll = async () => {
    if (validDrafts.length === 0) return;
    setLoading(true);

    const body = validDrafts.map((d, i) => {
      const needsOptions = d.type === "single_choice" || d.type === "multiple_choice";
      return {
        survey_id: surveyId,
        type: d.type,
        title: d.title,
        description: d.description || null,
        required: d.required,
        order_index: startOrderIndex + i,
        options: needsOptions ? d.options.filter((o) => o.label.trim()) : null,
        condition: null,
      };
    });

    await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="h-1 gradient-bg" />
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>여러 문항 한번에 추가</span>
            <span className="text-sm font-normal text-muted-foreground">
              {validDrafts.length}개 문항 작성됨
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {drafts.map((draft, draftIndex) => {
            const needsOptions = draft.type === "single_choice" || draft.type === "multiple_choice";
            return (
              <div
                key={draft.id}
                className="relative border rounded-lg p-4 space-y-3 bg-slate-50/50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-violet-700">
                    문항 {draftIndex + 1}
                  </span>
                  {drafts.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive h-7 text-xs"
                      onClick={() => removeDraft(draft.id)}
                    >
                      삭제
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">문항 유형</Label>
                    <Select
                      value={draft.type}
                      onValueChange={(v) => updateDraft(draft.id, { type: v as QuestionType })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(typeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">문항 제목</Label>
                    <Input
                      value={draft.title}
                      onChange={(e) => updateDraft(draft.id, { title: e.target.value })}
                      placeholder="문항을 입력하세요"
                      className="h-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">부연 설명 (선택)</Label>
                  <Textarea
                    value={draft.description}
                    onChange={(e) => updateDraft(draft.id, { description: e.target.value })}
                    placeholder="문항에 대한 추가 설명..."
                    rows={1}
                    className="min-h-[36px]"
                  />
                </div>

                {needsOptions && (
                  <div className="space-y-2">
                    <Label className="text-xs">보기</Label>
                    {draft.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex gap-2">
                        <Input
                          value={option.label}
                          onChange={(e) =>
                            handleOptionChange(draft.id, optIndex, e.target.value)
                          }
                          placeholder={`보기 ${optIndex + 1}`}
                          className="h-8 text-sm"
                        />
                        {draft.options.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => removeOption(draft.id, optIndex)}
                          >
                            X
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => addOption(draft.id)}
                    >
                      + 보기 추가
                    </Button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`required-${draft.id}`}
                    checked={draft.required}
                    onCheckedChange={(checked) =>
                      updateDraft(draft.id, { required: checked === true })
                    }
                  />
                  <Label htmlFor={`required-${draft.id}`} className="text-xs">
                    필수 응답
                  </Label>
                </div>
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed"
            onClick={addDraft}
          >
            + 문항 추가
          </Button>

          <div className="flex gap-2 pt-2 border-t">
            <Button
              onClick={handleSubmitAll}
              disabled={loading || validDrafts.length === 0}
              className="flex-1 gradient-bg text-white hover:opacity-90"
            >
              {loading
                ? "저장 중..."
                : `${validDrafts.length}개 문항 일괄 저장`}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              취소
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
