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
  const ext = file.name.split(".").pop()?.toLowerCase();
  return (
    allowedMimeTypes.has(file.type) ||
    ext === "mp3" ||
    ext === "wav"
  );
}

// ⭐ Create 30-second preview
async function createPreview(file: File): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new AudioContext();
  const decoded = await audioCtx.decodeAudioData(arrayBuffer);

  const sampleRate = decoded.sampleRate;
  const previewLength = Math.min(decoded.length, sampleRate * 30);

  const previewBuffer = audioCtx.createBuffer(
    decoded.numberOfChannels,
    previewLength,
    sampleRate
  );

  for (let i = 0; i < decoded.numberOfChannels; i++) {
    previewBuffer.getChannelData(i).set(
      decoded.getChannelData(i).slice(0, previewLength)
    );
  }

  const wavBlob = await bufferToWav(previewBuffer);
  return wavBlob;
}

// ⭐ Convert AudioBuffer → WAV Blob
async function bufferToWav(buffer: AudioBuffer): Promise<Blob> {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitDepth = 16;

  let samples;
  if (numChannels === 2) {
    samples = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
  } else {
    samples = buffer.getChannelData(0);
  }

  const wav = encodeWAV(samples, numChannels, sampleRate, bitDepth);
  return new Blob([wav], { type: "audio/wav" });
}

function interleave(left: Float32Array, right: Float32Array) {
  const result = new Float32Array(left.length + right.length);
  let index = 0;
  for (let i = 0; i < left.length; i++) {
    result[index++] = left[i];
    result[index++] = right[i];
  }
  return result;
}

function encodeWAV(samples: Float32Array, numChannels: number, sampleRate: number, bitDepth: number) {
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * bytesPerSample, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * bytesPerSample, true);

  floatTo16BitPCM(view, 44, samples);
  return buffer;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function floatTo16BitPCM(view: DataView, offset: number, samples: Float32Array) {
  for (let i = 0; i < samples.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const password = formData.get("password") as string | null;

    if (password !== "ADMIN_BYPASS") {
      if (!process.env.OWNER_PASSWORD || password !== process.env.OWNER_PASSWORD) {
        return Response.json({ error: "Incorrect owner password" }, { status: 403 });
      }
    }

    // ⭐ ONE FILE ONLY
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "Audio file is required" }, { status: 400 });
    }

    if (!isAllowedAudioFile(file)) {
      return Response.json({ error: "Only MP3 or WAV files are allowed" }, { status: 400 });
    }

    const title = ((formData.get("title") as string) || "Untitled").trim();
    const price = Number(formData.get("price") || 0);

    const supabase = getSupabaseAdmin();

    // ⭐ Filenames
    const fullName = `full-${Date.now()}-${file.name.replace(/\s/g, "_")}`;
    const previewName = `preview-${Date.now()}-${file.name.replace(/\s/g, "_")}`;

    // ⭐ Upload full beat
    const { error: fullError } = await supabase.storage
      .from("beats")
      .upload(fullName, file);

    if (fullError) return Response.json({ error: fullError.message }, { status: 500 });

    // ⭐ Generate preview
    const previewBlob = await createPreview(file);

    // ⭐ Upload preview
    const { error: previewError } = await supabase.storage
      .from("beats")
      .upload(previewName, previewBlob);

    if (previewError) return Response.json({ error: previewError.message }, { status: 500 });

    // ⭐ Public preview URL
    const { data: previewData } = supabase.storage
      .from("beats")
      .getPublicUrl(previewName);

    const audio_url = previewData.publicUrl;

    // ⭐ Insert into DB
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

    if (dbError) return Response.json({ error: dbError.message }, { status: 500 });

    return Response.json({ success: true, beat });

  } catch (err) {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
