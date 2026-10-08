import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: row, error } = await supabase
    .from("run_exports")
    .select("filename, content")
    .eq("id", id)
    .single();

  if (error || !row) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const contentType = row.filename.endsWith(".tsv")
    ? "text/tab-separated-values"
    : "text/csv";

  return new NextResponse(row.content, {
    headers: {
      "Content-Type": `${contentType}; charset=utf-8`,
      "Content-Disposition": `attachment; filename="${row.filename}"`,
    },
  });
}
