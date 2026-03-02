import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ResponseStats } from "@/components/admin/ResponseStats";
import { ResponseTable } from "@/components/admin/ResponseTable";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{survey.title}</h1>
          <p className="text-sm text-muted-foreground">
            총 {respondents?.length || 0}명 응답
          </p>
        </div>
        <Link href={`/api/surveys/${id}/export?format=xlsx`}>
          <Button variant="outline">Excel 내보내기</Button>
        </Link>
      </div>

      <Tabs defaultValue="stats">
        <TabsList>
          <TabsTrigger value="stats">문항별 통계</TabsTrigger>
          <TabsTrigger value="responses">개별 응답</TabsTrigger>
        </TabsList>
        <TabsContent value="stats">
          <ResponseStats
            questions={questions}
            respondents={respondents || []}
          />
        </TabsContent>
        <TabsContent value="responses">
          <ResponseTable
            questions={questions}
            respondents={respondents || []}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
