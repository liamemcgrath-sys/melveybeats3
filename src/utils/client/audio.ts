"use client";
const lamejs = require("lamejs");

// Generate a small MP3 preview (30 seconds, ~200–500 KB)
export async function generatePreview(file: File): Promise<File> {
  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new AudioContext();
  const decoded = await audioCtx.decodeAudioData(arrayBuffer);

  const sampleRate = decoded.sampleRate;
  const channels = decoded.numberOfChannels;

  // Limit preview to 30 seconds
  const previewSamples = Math.min(decoded.length, sampleRate * 30);

  // Extract first 30 seconds from each channel
  const channelData: Float32Array[] = [];
  for (let ch = 0; ch < channels; ch++) {
    channelData.push(decoded.getChannelData(ch).slice(0, previewSamples));
  }

  // Convert Float32 → Int16
  const samples = new Int16Array(previewSamples * channels);
  let idx = 0;

  for (let i = 0; i < previewSamples; i++) {
    for (let ch = 0; ch < channels; ch++) {
      const s = Math.max(-1, Math.min(1, channelData[ch][i]));
      samples[idx++] = s * 32767;
    }
  }

  // Encode MP3 (96 kbps)
  const mp3Encoder = new lamejs.Mp3Encoder(channels, sampleRate, 96);
  const mp3Chunks: Uint8Array[] = [];

  const chunk = mp3Encoder.encodeBuffer(samples);
  if (chunk.length > 0) mp3Chunks.push(chunk);

  const end = mp3Encoder.flush();
  if (end.length > 0) mp3Chunks.push(end);

  const mp3Blob = new Blob(mp3Chunks, { type: "audio/mpeg" });

  return new File([mp3Blob], "preview.mp3", { type: "audio/mpeg" });
}
