import { SnowEffect } from "@/components/survey/SnowEffect";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function RespondentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen gradient-bg-page">
      <SnowEffect />
      <header className="gradient-bg text-white px-4 py-4 shadow-lg">
        <div className="max-w-lg mx-auto flex items-center justify-center gap-2 relative">
          <span className="text-2xl">&#10052;</span>
          <h1 className="text-lg font-bold tracking-tight">겨울수련회 설문조사</h1>
          <span className="text-2xl">&#10052;</span>
          <div className="absolute right-0">
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="max-w-lg mx-auto p-4 pt-6">{children}</main>
    </div>
  );
}
