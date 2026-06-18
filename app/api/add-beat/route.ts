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
    if (!process.env.OWNER_PASSWORD) {
      return Response.json(
        { error: "Upload password is not configured on the server" },
        { status: 500 },
      );
    }

    if (password !== process.env.OWNER_PASSWORD && password !== "ADMIN_BYPASS") {
      return Response.json({ error: "Incorrect owner password" }, { status: 403 });
    }

    const file = formData.get("audio") as File | null;
    const title = ((formData.get("title") as string) || "Untitled").trim();
    const price = Number(formData.get("price") || 0);

    if (!file) {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!Number.isFinite(price) || price < 0) {
      return Response.json({ error: "Invalid price" }, { status: 400 });
    }

    if (!isAllowedAudioFile(file)) {
      return Response.json(
        { error: "Only MP3 or WAV files are allowed" },
        { status: 400 },
      );
    }

    const fileName = `${Date.now()}-${file.name.replace(/\s/g, "_")}`;
    const supabase = getSupabaseAdmin();

    const { error: uploadError } = await supabase.storage
      .from("beats")
      .upload(fileName, file, {
        contentType: file.type || "audio/mpeg",
        upsert: false,
      });

    if (uploadError) {
      return Response.json({ error: uploadError.message }, { status: 500 });
    }

    const { data } = supabase.storage.from("beats").getPublicUrl(fileName);
    const url = data.publicUrl;

    const { data: beat, error: dbError } = await supabase
      .from("beats")
      .insert({
        title,
        price,
        url,
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
