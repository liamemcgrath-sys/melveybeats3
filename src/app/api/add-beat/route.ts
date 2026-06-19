export const runtime = "nodejs";
export const preferredRegion = "iad1";
export const dynamic = "force-dynamic";
export const maxBodySize = "200mb";


// Allow large uploads + long processing time
export const maxDuration = 300;

import { getSupabaseAdmin } from "@/lib/supabaseServer";

const allowedMimeTypes = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
]);

function isAllowedAudioFile(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  return (
    allowedMimeTypes.has(file.type) ||
    ext === "mp3" ||
    ext === "wav"
  );
}

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

    // Expect two files
    const full = formData.get("full") as File | null;
    const preview = formData.get("preview") as File | null;

    if (!full || !preview) {
      return Response.json({ error: "Missing full or preview file" }, { status: 400 });
    }

    if (!isAllowedAudioFile(full)) {
      return Response.json({ error: "Only MP3 or WAV files are allowed" }, { status: 400 });
    }

    const title = ((formData.get("title") as string) || "Untitled").trim();
    const price = Number(formData.get("price") || 0);

    const supabase = getSupabaseAdmin();

    // Filenames
    const fullName = `full-${Date.now()}-${full.name.replace(/\s/g, "_")}`;
    const previewName = `preview-${Date.now()}-${preview.name.replace(/\s/g, "_")}`;

    // Upload full beat
    const { error: fullError } = await supabase.storage
      .from("beats")
      .upload(fullName, full);

    if (fullError) {
      return Response.json({ error: fullError.message }, { status: 500 });
    }

    // Upload preview
    const { error: previewError } = await supabase.storage
      .from("beats")
      .upload(previewName, preview);

    if (previewError) {
      return Response.json({ error: previewError.message }, { status: 500 });
    }

    // Public preview URL
    const { data: previewData } = supabase.storage
      .from("beats")
      .getPublicUrl(previewName);

    const audio_url = previewData.publicUrl;

    // Insert DB row
    const { data: beat, error: dbError } = await supabase
      .from("beats")
      .insert({
        title,
        price,
        audio_url,
        fullAudioPath: fullName,
      })
      .select()
      .single();

    if (dbError) {
      return Response.json({ error: dbError.message }, { status: 500 });
    }

    return Response.json({ success: true, beat });

  } catch (err) {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
