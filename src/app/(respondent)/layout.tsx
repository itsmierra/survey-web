export default function RespondentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3">
        <h1 className="text-lg font-semibold text-center">겨울수련회 설문조사</h1>
      </header>
      <main className="max-w-lg mx-auto p-4">{children}</main>
    </div>
  );
}
