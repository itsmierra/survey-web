import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavWrapper />
      <main className="max-w-6xl mx-auto p-4 md:p-6">{children}</main>
    </div>
  );
}

async function AdminNavWrapper() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return <AdminNav userEmail={user.email || ""} />;
}
