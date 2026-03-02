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
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        참여할 설문을 선택해주세요
      </p>

      {(!surveys || surveys.length === 0) && (
        <p className="text-center text-muted-foreground py-8">
          현재 진행 중인 설문이 없습니다.
        </p>
      )}

      {surveys?.map((survey) => (
        <Link key={survey.id} href={`/survey/${survey.id}`}>
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{survey.title}</CardTitle>
                <Badge variant="secondary">진행중</Badge>
              </div>
              {survey.description && (
                <CardDescription>{survey.description}</CardDescription>
              )}
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
