export const runtime = "nodejs";
export const preferredRegion = "iad1";
export const dynamic = "force-dynamic";
export const maxBodySize = "200mb";
export const maxDuration = 300;

import { getSupabaseAdmin } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    // Password check
    const password = formData.get("password") as string | null;

    if (password !== "ADMIN_BYPASS") {
      if (!process.env.OWNER_PASSWORD || password !== process.env.OWNER_PASSWORD) {
        return Response.json({ error: "Incorrect owner password" }, { status: 403 });
      }
    }

    // Files
    const preview = formData.get("preview") as File | null;
    const full = formData.get("full") as File | null;
    const title = (formData.get("title") as string | null) || "Free Beat";

    if (!preview || !full) {
      return Response.json({ error: "Missing preview or full file" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Upload preview.mp3
    const { error: previewError } = await supabase.storage
      .from("free-beat")
      .upload("preview.mp3", preview, { upsert: true });

    if (previewError) {
      return Response.json({ error: previewError.message }, { status: 500 });
    }

    // Upload full.mp3
    const { error: fullError } = await supabase.storage
      .from("free-beat")
      .upload("full.mp3", full, { upsert: true });

    if (fullError) {
      return Response.json({ error: fullError.message }, { status: 500 });
    }

    // Upload metadata
    const meta = { title };
    const { error: metaError } = await supabase.storage
      .from("free-beat")
      .upload(
        "meta.json",
        new Blob([JSON.stringify(meta)], { type: "application/json" }),
        { upsert: true }
      );

    if (metaError) {
      return Response.json({ error: metaError.message }, { status: 500 });
    }

    return Response.json({ success: true });

  } catch (err) {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
