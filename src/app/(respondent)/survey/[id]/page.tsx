import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { SurveyForm } from "@/components/survey/SurveyForm";
import type { SurveyWithQuestions } from "@/lib/types";

export default async function SurveyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: survey } = await supabase
    .from("surveys")
    .select("*, questions(*)")
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (!survey) {
    notFound();
  }

  const surveyWithSortedQuestions: SurveyWithQuestions = {
    ...survey,
    questions: survey.questions.sort(
      (a: { order_index: number }, b: { order_index: number }) =>
        a.order_index - b.order_index
    ),
  };

  return <SurveyForm survey={surveyWithSortedQuestions} />;
}
