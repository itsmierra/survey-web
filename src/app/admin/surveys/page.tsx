import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SurveyActions } from "@/components/admin/SurveyActions";

export default async function AdminSurveysPage() {
  const supabase = await createClient();

  const { data: surveys } = await supabase
    .from("surveys")
    .select("*, questions(count)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">설문 관리</h1>
        <Link href="/admin/surveys/new">
          <Button>새 설문 만들기</Button>
        </Link>
      </div>

      {(!surveys || surveys.length === 0) && (
        <p className="text-center text-muted-foreground py-8">
          등록된 설문이 없습니다.
        </p>
      )}

      <div className="grid gap-4">
        {surveys?.map((survey) => (
          <Card key={survey.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{survey.title}</CardTitle>
                <SurveyActions survey={survey} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Badge
                  variant={
                    survey.status === "active"
                      ? "default"
                      : survey.status === "draft"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {survey.status === "active"
                    ? "진행중"
                    : survey.status === "draft"
                    ? "초안"
                    : "마감"}
                </Badge>
                <span>
                  문항 {survey.questions?.[0]?.count || 0}개
                </span>
                <span>
                  {new Date(survey.created_at).toLocaleDateString("ko-KR")}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
