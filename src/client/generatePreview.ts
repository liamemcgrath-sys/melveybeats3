export async function generatePreview(file: File): Promise<Blob> {
  // ✅ Prevent server‑side rendering crash
  if (typeof window === "undefined") {
    return new Blob();
  }

  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const duration = Math.min(30, audioBuffer.duration);

  const offline = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.sampleRate * duration,
    audioBuffer.sampleRate
  );

  const source = offline.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offline.destination);
  source.start(0);

  const rendered = await offline.startRendering();

  const dest = audioContext.createMediaStreamDestination();
  const node = audioContext.createBufferSource();
  node.buffer = rendered;
  node.connect(dest);
  node.start();

  const recorder = new MediaRecorder(dest.stream, {
    mimeType: "audio/webm;codecs=opus",
  });

  const chunks: BlobPart[] = [];

  return new Promise((resolve) => {
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => resolve(new Blob(chunks, { type: "audio/webm" }));

    recorder.start();
    setTimeout(() => recorder.stop(), duration * 1000);
  });
}
