"use client";

import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { Survey } from "@/lib/types";

interface SurveyActionsProps {
  survey: Survey;
}

export function SurveyActions({ survey }: SurveyActionsProps) {
  const router = useRouter();

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          ...
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => router.push(`/admin/surveys/${survey.id}`)}
        >
          문항 편집
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push(`/admin/surveys/${survey.id}/responses`)}
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
        <DropdownMenuItem onClick={deleteSurvey} className="text-destructive">
          삭제
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
