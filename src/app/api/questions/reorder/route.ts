import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orders } = await request.json();

  for (const { id, order_index } of orders) {
    await supabase
      .from("questions")
      .update({ order_index })
      .eq("id", id);
  }

  return NextResponse.json({ success: true });
}
