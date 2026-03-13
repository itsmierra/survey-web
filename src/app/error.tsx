"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-svh gradient-bg-page flex items-center justify-center p-4">
      <div className="text-center space-y-6 animate-fade-in-up">
        <div className="relative inline-block">
          <div className="w-24 h-24 mx-auto rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full gradient-bg-warm opacity-20 animate-float" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            문제가 발생했습니다
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            예기치 않은 오류가 발생했습니다. 다시 시도해 주세요.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={reset}
            className="rounded-xl gradient-bg text-white hover:opacity-90 px-6 py-3 h-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
            다시 시도
          </Button>
        </div>
      </div>
    </div>
  );
}
