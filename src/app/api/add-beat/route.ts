import { getSupabaseAdmin } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const formData = await req.formData();

  const password = formData.get("password") as string | null;
  if (!process.env.OWNER_PASSWORD || password !== process.env.OWNER_PASSWORD) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
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

  const allowed = ["audio/mpeg", "audio/mp3", "audio/wav"];
  if (!allowed.includes(file.type)) {
    return Response.json(
      { error: "Only MP3 or WAV files allowed" },
      { status: 400 },
    );
  }

  const fileName = `${Date.now()}-${file.name.replace(/\s/g, "_")}`;
  const supabase = getSupabaseAdmin();

  const { error: uploadError } = await supabase.storage
    .from("beats")
    .upload(fileName, file, {
      contentType: file.type,
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
}

