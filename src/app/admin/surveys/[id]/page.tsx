import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { QuestionEditor } from "@/components/admin/QuestionEditor";

export default async function SurveyEditPage({
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

  const sortedQuestions = (survey.questions || []).sort(
    (a: { order_index: number }, b: { order_index: number }) =>
      a.order_index - b.order_index
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{survey.title}</h1>
        <p className="text-sm text-muted-foreground">문항 편집</p>
      </div>

      <QuestionEditor surveyId={id} initialQuestions={sortedQuestions} />
    </div>
  );
}
