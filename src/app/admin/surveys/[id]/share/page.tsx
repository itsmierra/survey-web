import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { SharePanel } from "@/components/admin/SharePanel";

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: survey } = await supabase
    .from("surveys")
    .select("id, title, status")
    .eq("id", id)
    .single();

  if (!survey) notFound();

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{survey.title}</h1>
      <p className="text-sm text-muted-foreground">설문 공유</p>
      <SharePanel surveyId={survey.id} />
    </div>
  );
}
