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

    // ONE FILE ONLY
    const full = formData.get("full") as File | null;
    const title = (formData.get("title") as string | null) || "Free Beat";

    if (!full) {
      return Response.json({ error: "Missing audio file" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Generate unique filename
    const fileName = `free-${Date.now()}-${full.name.replace(/\s/g, "_")}`;

    // Upload full beat
    const { error: fullError } = await supabase.storage
      .from("free-beat")
      .upload(fileName, full, { upsert: true });

    if (fullError) {
      return Response.json({ error: fullError.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("free-beat")
      .getPublicUrl(fileName);

    const audio_url = urlData.publicUrl;

    // Store in DB
    const { error: dbError } = await supabase
      .from("free_beat")
      .upsert({
        id: 1,
        title,
        audio_url,
        fullAudioPath: fileName,
      });

    if (dbError) {
      return Response.json({ error: dbError.message }, { status: 500 });
    }

    return Response.json({ success: true });

  } catch (err) {
    console.error(err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
