import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: surveys } = await supabase
    .from("surveys")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground text-center">
        참여할 설문을 선택해주세요
      </p>

      {(!surveys || surveys.length === 0) && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">&#128203;</div>
          <p className="text-muted-foreground">
            현재 진행 중인 설문이 없습니다.
          </p>
        </div>
      )}

      {surveys?.map((survey, index) => {
        const colors = [
          "border-l-violet-500",
          "border-l-blue-500",
          "border-l-emerald-500",
          "border-l-amber-500",
          "border-l-rose-500",
        ];
        const borderColor = colors[index % colors.length];

        return (
          <Link key={survey.id} href={`/survey/${survey.id}`}>
            <Card className={`card-hover border-l-4 ${borderColor} shadow-sm hover:shadow-lg`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{survey.title}</CardTitle>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    진행중
                  </Badge>
                </div>
                {survey.description && (
                  <CardDescription className="whitespace-pre-line">{survey.description}</CardDescription>
                )}
              </CardHeader>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
