import { getSupabaseAdmin } from "@/lib/supabaseServer";

export const runtime = "nodejs";

const allowedMimeTypes = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
]);

function isAllowedAudioFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return (
    allowedMimeTypes.has(file.type) ||
    extension === "mp3" ||
    extension === "wav"
  );
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const password = formData.get("password") as string | null;

    // ⭐ ADMIN BYPASS
    if (password !== "ADMIN_BYPASS") {
      if (!process.env.OWNER_PASSWORD || password !== process.env.OWNER_PASSWORD) {
        return Response.json(
          { error: "Incorrect owner password" },
          { status: 403 }
        );
      }
    }

    // ⭐ FILES (must match your UploadBeatButton names)
    const previewFile = formData.get("preview") as File | null;
    const fullFile = formData.get("full") as File | null;

    // ⭐ FIXED VALIDATION
    if (!previewFile) {
      return Response.json(
        { error: "Preview file is required" },
        { status: 400 }
      );
    }

    if (!fullFile) {
      return Response.json(
        { error: "Full beat file is required" },
        { status: 400 }
      );
    }

    if (!isAllowedAudioFile(previewFile) || !isAllowedAudioFile(fullFile)) {
      return Response.json(
        { error: "Only MP3 or WAV files are allowed" },
        { status: 400 }
      );
    }

    const title = ((formData.get("title") as string) || "Untitled").trim();
    const price = Number(formData.get("price") || 0);

    if (!Number.isFinite(price) || price < 0) {
      return Response.json({ error: "Invalid price" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // ⭐ Unique filenames
    const previewName = `preview-${Date.now()}-${previewFile.name.replace(/\s/g, "_")}`;
    const fullName = `full-${Date.now()}-${fullFile.name.replace(/\s/g, "_")}`;

    // ⭐ Upload preview
    const { error: previewError } = await supabase.storage
      .from("beats")
      .upload(previewName, previewFile, {
        contentType: previewFile.type || "audio/mpeg",
        upsert: false,
      });

    if (previewError) {
      return Response.json({ error: previewError.message }, { status: 500 });
    }

    // ⭐ Upload full beat
    const { error: fullError } = await supabase.storage
      .from("beats")
      .upload(fullName, fullFile, {
        contentType: fullFile.type || "audio/mpeg",
        upsert: false,
      });

    if (fullError) {
      return Response.json({ error: fullError.message }, { status: 500 });
    }

    // ⭐ Public preview URL
    const { data: previewData } = supabase.storage
      .from("beats")
      .getPublicUrl(previewName);

    const audio_url = previewData.publicUrl;

    // ⭐ Full beat path (private)
    const fullAudioPath = fullName;

    // ⭐ Insert into DB
    const { data: beat, error: dbError } = await supabase
      .from("beats")
      .insert({
        title,
        price,
        audio_url,
        fullAudioPath,
      })
      .select()
      .single();

    if (dbError) {
      return Response.json({ error: dbError.message }, { status: 500 });
    }

    return Response.json({ success: true, beat });

  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload failed on the server";

    return Response.json({ error: message }, { status: 500 });
  }
}
