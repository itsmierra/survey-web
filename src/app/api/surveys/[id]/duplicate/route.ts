import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: original } = await supabase
    .from("surveys")
    .select("*, questions(*)")
    .eq("id", id)
    .single();

  if (!original) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: newSurvey, error: surveyError } = await supabase
    .from("surveys")
    .insert({
      title: `${original.title} (복사)`,
      description: original.description,
      status: "draft",
    })
    .select()
    .single();

  if (surveyError) return NextResponse.json({ error: surveyError.message }, { status: 400 });

  if (original.questions && original.questions.length > 0) {
    const newQuestions = original.questions.map(
      (q: { type: string; title: string; description: string; options: unknown; required: boolean; order_index: number; condition: unknown }) => ({
        survey_id: newSurvey.id,
        type: q.type,
        title: q.title,
        description: q.description,
        options: q.options,
        required: q.required,
        order_index: q.order_index,
        condition: q.condition,
      })
    );

    await supabase.from("questions").insert(newQuestions);
  }

  return NextResponse.json(newSurvey);
}
