"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Survey } from "@/lib/types";

interface SurveyActionsProps {
  survey: Survey;
}

export function SurveyActions({ survey }: SurveyActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [title, setTitle] = useState(survey.title);
  const [description, setDescription] = useState(survey.description || "");
  const [saving, setSaving] = useState(false);

  const updateStatus = async (status: string) => {
    await fetch(`/api/surveys/${survey.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  };

  const duplicate = async () => {
    await fetch(`/api/surveys/${survey.id}/duplicate`, { method: "POST" });
    router.refresh();
  };

  const deleteSurvey = async () => {
    if (!confirm("정말 이 설문을 삭제하시겠습니까?")) return;
    await fetch(`/api/surveys/${survey.id}`, { method: "DELETE" });
    router.refresh();
  };

  const handleEditSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await fetch(`/api/surveys/${survey.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || null,
      }),
    });
    setSaving(false);
    setEditOpen(false);
    router.refresh();
  };

  const openEdit = () => {
    setTitle(survey.title);
    setDescription(survey.description || "");
    setEditOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            ...
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={openEdit}>
            설문 정보 수정
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push(`/admin/surveys/${survey.id}`)}
          >
            문항 편집
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              router.push(`/admin/surveys/${survey.id}/responses`)
            }
          >
            응답 보기
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push(`/admin/surveys/${survey.id}/share`)}
          >
            공유
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {survey.status === "draft" && (
            <DropdownMenuItem onClick={() => updateStatus("active")}>
              설문 시작 (활성화)
            </DropdownMenuItem>
          )}
          {survey.status === "active" && (
            <DropdownMenuItem onClick={() => updateStatus("closed")}>
              설문 마감
            </DropdownMenuItem>
          )}
          {survey.status === "closed" && (
            <DropdownMenuItem onClick={() => updateStatus("draft")}>
              초안으로 되돌리기
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={duplicate}>설문 복제</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={deleteSurvey}
            className="text-destructive"
          >
            삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>설문 정보 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">설문 제목</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="설문 제목을 입력하세요"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">설명 (선택)</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="설문에 대한 간단한 설명..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={saving || !title.trim()}
            >
              {saving ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
