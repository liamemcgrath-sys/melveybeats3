export async function generatePreview(file: File): Promise<File> {
  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new AudioContext();
  const decoded = await audioCtx.decodeAudioData(arrayBuffer);

  const duration = Math.min(decoded.duration, 30); // 30 sec preview
  const sampleRate = decoded.sampleRate;

  const previewBuffer = audioCtx.createBuffer(
    decoded.numberOfChannels,
    duration * sampleRate,
    sampleRate
  );

  for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
    previewBuffer.getChannelData(ch).set(
      decoded.getChannelData(ch).slice(0, duration * sampleRate)
    );
  }

  const wavBlob = await bufferToWav(previewBuffer);
  return new File([wavBlob], "preview.wav", { type: "audio/wav" });
}

function bufferToWav(buffer: AudioBuffer): Promise<Blob> {
  return new Promise((resolve) => {
    const worker = new Worker(
      URL.createObjectURL(
        new Blob(
          [
            `
            self.onmessage = function(e) {
              const { buffer } = e.data;
              const numChannels = buffer.numberOfChannels;
              const sampleRate = buffer.sampleRate;
              const length = buffer.length;

              const wavBuffer = new ArrayBuffer(44 + length * numChannels * 2);
              const view = new DataView(wavBuffer);

              function writeString(view, offset, string) {
                for (let i = 0; i < string.length; i++) {
                  view.setUint8(offset + i, string.charCodeAt(i));
                }
              }

              writeString(view, 0, "RIFF");
              view.setUint32(4, 36 + length * numChannels * 2, true);
              writeString(view, 8, "WAVE");
              writeString(view, 12, "fmt ");
              view.setUint32(16, 16, true);
              view.setUint16(20, 1, true);
              view.setUint16(22, numChannels, true);
              view.setUint32(24, sampleRate, true);
              view.setUint32(28, sampleRate * numChannels * 2, true);
              view.setUint16(32, numChannels * 2, true);
              view.setUint16(34, 16, true);
              writeString(view, 36, "data");
              view.setUint32(40, length * numChannels * 2, true);

              let offset = 44;
              for (let ch = 0; ch < numChannels; ch++) {
                const channelData = buffer.getChannelData(ch);
                for (let i = 0; i < channelData.length; i++) {
                  const sample = Math.max(-1, Math.min(1, channelData[i]));
                  view.setInt16(offset, sample * 0x7fff, true);
                  offset += 2;
                }
              }

              self.postMessage(new Blob([view]), []);
            };
          `,
          ],
          { type: "application/javascript" }
        )
      )
    );

    worker.onmessage = (e) => resolve(e.data);
    worker.postMessage({ buffer });
  });
}
