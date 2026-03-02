import { createClient } from "@/lib/supabase/server";
import { DashboardStats } from "@/components/admin/DashboardStats";
import { RealtimeResponseCount } from "@/components/admin/RealtimeResponseCount";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const { data: surveys } = await supabase
    .from("surveys")
    .select("*")
    .order("created_at", { ascending: false });

  const surveyStats = await Promise.all(
    (surveys || []).map(async (survey) => {
      const { count } = await supabase
        .from("respondents")
        .select("*", { count: "exact", head: true })
        .eq("survey_id", survey.id);
      return {
        id: survey.id,
        title: survey.title,
        status: survey.status,
        responseCount: count || 0,
      };
    })
  );

  const totalSurveys = surveys?.length || 0;
  const totalResponses = surveyStats.reduce(
    (sum, s) => sum + s.responseCount,
    0
  );
  const activeSurveys = surveys?.filter((s) => s.status === "active").length || 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">대시보드</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              전체 설문
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalSurveys}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              진행 중
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{activeSurveys}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              총 응답 수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RealtimeResponseCount initialCount={totalResponses} />
          </CardContent>
        </Card>
      </div>

      <DashboardStats surveyStats={surveyStats} />
    </div>
  );
}
