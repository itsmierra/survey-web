import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import type { Question, AnswerValue } from "@/lib/types";

function formatAnswerValue(
  question: Question,
  value: AnswerValue | undefined
): string {
  if (!value) return "";

  switch (question.type) {
    case "single_choice": {
      const selected = value.selected as string;
      return (
        question.options?.find((o) => o.value === selected)?.label ||
        selected ||
        ""
      );
    }
    case "multiple_choice": {
      const selected = value.selected as string[];
      return (
        selected
          ?.map((s) => question.options?.find((o) => o.value === s)?.label || s)
          .join(", ") || ""
      );
    }
    case "text":
      return value.text || "";
    case "rating":
      return value.rating !== undefined ? String(value.rating) : "";
    case "datetime":
      return value.datetime
        ? new Date(value.datetime).toLocaleString("ko-KR")
        : "";
    default:
      return "";
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: survey } = await supabase
    .from("surveys")
    .select("*, questions(*)")
    .eq("id", id)
    .single();

  if (!survey)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: respondents } = await supabase
    .from("respondents")
    .select("*, answers(*)")
    .eq("survey_id", id)
    .order("created_at", { ascending: true });

  const questions = (survey.questions || []).sort(
    (a: { order_index: number }, b: { order_index: number }) =>
      a.order_index - b.order_index
  ) as Question[];

  const rows = (respondents || []).map((respondent) => {
    const row: Record<string, string> = {
      이름: respondent.name,
      응답일시: new Date(respondent.created_at).toLocaleString("ko-KR"),
    };

    questions.forEach((q) => {
      const answer = respondent.answers.find(
        (a: { question_id: string }) => a.question_id === q.id
      );
      row[q.title] = formatAnswerValue(
        q,
        answer?.value as AnswerValue | undefined
      );
    });

    return row;
  });

  const url = new URL(request.url);
  const format = url.searchParams.get("format") || "xlsx";

  const workbook = XLSX.utils.book_new();

  const summaryData = [
    ["설문 제목", survey.title],
    ["총 응답 수", String(respondents?.length || 0)],
    ["내보내기 일시", new Date().toLocaleString("ko-KR")],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "요약");

  const dataSheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, dataSheet, "응답 데이터");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: format === "csv" ? "csv" : "xlsx",
  });

  const filename = `${survey.title}_응답_${new Date().toISOString().slice(0, 10)}`;
  const contentType =
    format === "csv"
      ? "text/csv"
      : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}.${format}"`,
    },
  });
}
