import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CompletePage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="text-xl">설문이 제출되었습니다!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            소중한 답변 감사합니다.
          </p>
          <Link href="/">
            <Button variant="outline">메인으로 돌아가기</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
