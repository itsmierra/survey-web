import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ResponsesPageContent } from "@/components/admin/ResponsesPageContent";

export default async function ResponsesPage({
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
    .single();

  if (!survey) notFound();

  const { data: respondents } = await supabase
    .from("respondents")
    .select("*, answers(*)")
    .eq("survey_id", id)
    .order("created_at", { ascending: false });

  const questions = (survey.questions || []).sort(
    (a: { order_index: number }, b: { order_index: number }) =>
      a.order_index - b.order_index
  );

  return (
    <ResponsesPageContent
      surveyId={id}
      surveyTitle={survey.title}
      questions={questions}
      respondents={respondents || []}
    />
  );
}
