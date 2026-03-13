import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-svh gradient-bg-page flex items-center justify-center p-4">
      <div className="text-center space-y-6 animate-fade-in-up">
        <div className="relative inline-block">
          <div className="text-[120px] font-bold leading-none bg-gradient-to-br from-violet-500 to-purple-700 bg-clip-text text-transparent select-none">
            404
          </div>
          <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full gradient-bg opacity-20 animate-float" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            페이지를 찾을 수 없습니다
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-bg text-white font-medium hover:opacity-90 transition-opacity"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
