import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CompletePage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-6">
        <div className="animate-check-pop">
          <div className="w-24 h-24 rounded-full gradient-bg-mint mx-auto flex items-center justify-center shadow-lg">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-blue-500 dark:from-violet-400 dark:to-blue-400 bg-clip-text text-transparent">
            설문이 제출되었습니다!
          </h2>
          <p className="text-muted-foreground">
            소중한 답변 감사합니다.
          </p>
        </div>
        <Link href="/">
          <Button className="gradient-bg text-white hover:opacity-90 shadow-md">
            메인으로 돌아가기
          </Button>
        </Link>
      </div>
    </div>
  );
}
