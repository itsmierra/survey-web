import { createClient } from "@/lib/supabase/server";
import { DashboardStats } from "@/components/admin/DashboardStats";
import { RealtimeResponseCount } from "@/components/admin/RealtimeResponseCount";
import { TeamResponseStatus } from "@/components/admin/TeamResponseStatus";
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

  // Fetch active surveys with questions + respondents for team status
  const activeSurveyList = (surveys || []).filter((s) => s.status === "active");
  const activeSurveysWithDetails = await Promise.all(
    activeSurveyList.map(async (survey) => {
      const [{ data: questions }, { data: respondents }] = await Promise.all([
        supabase
          .from("questions")
          .select("*")
          .eq("survey_id", survey.id)
          .order("order_index"),
        supabase
          .from("respondents")
          .select("*, answers(*)")
          .eq("survey_id", survey.id),
      ]);
      return {
        ...survey,
        questions: questions || [],
        respondents: respondents || [],
      };
    })
  );

  const totalSurveys = surveys?.length || 0;
  const totalResponses = surveyStats.reduce(
    (sum, s) => sum + s.responseCount,
    0
  );
  const activeSurveys = activeSurveyList.length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">대시보드</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="h-1 gradient-bg" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              전체 설문
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalSurveys}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="h-1 gradient-bg-mint" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              진행 중
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">{activeSurveys}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="h-1 gradient-bg-ocean" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              총 응답 수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RealtimeResponseCount initialCount={totalResponses} />
          </CardContent>
        </Card>
      </div>

      <TeamResponseStatus surveys={activeSurveysWithDetails} />

      <DashboardStats surveyStats={surveyStats} />
    </div>
  );
}
