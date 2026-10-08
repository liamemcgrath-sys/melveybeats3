export const PREVIEW_SECONDS=30;

// Produce a real 16-bit PCM WAV. Reading only the first thirty seconds keeps
// the purchased master out of the publicly accessible preview asset.
export function encodeWavPreview(channels:readonly Float32Array[],sampleRate:number):ArrayBuffer {
  if(!Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>192000||channels.length<1||channels.length>2)throw new Error("This WAV format is not supported. Use mono or stereo audio.");
  const frames=sampleRate*PREVIEW_SECONDS;
  if(channels.some(channel=>channel.length<frames))throw new Error("The full WAV must be at least 30 seconds long.");
  const dataSize=frames*channels.length*2,buffer=new ArrayBuffer(44+dataSize),view=new DataView(buffer);
  const text=(offset:number,value:string)=>{for(let i=0;i<value.length;i++)view.setUint8(offset+i,value.charCodeAt(i));};
  text(0,"RIFF");view.setUint32(4,36+dataSize,true);text(8,"WAVE");text(12,"fmt ");view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,channels.length,true);view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*channels.length*2,true);view.setUint16(32,channels.length*2,true);view.setUint16(34,16,true);text(36,"data");view.setUint32(40,dataSize,true);
  const fadeFrames=Math.round(sampleRate*.12);
  for(let frame=0;frame<frames;frame++)for(let channel=0;channel<channels.length;channel++){
    const fade=frame>=frames-fadeFrames?(frames-1-frame)/(fadeFrames-1):1;
    const raw=channels[channel][frame],sample=Number.isFinite(raw)?Math.max(-1,Math.min(1,raw))*fade:0;
    view.setInt16(44+(frame*channels.length+channel)*2,Math.round(sample*(sample<0?32768:32767)),true);
  }
  return buffer;
}

export async function previewFromMaster(file:File):Promise<File>{
  if(!/\.wav$/i.test(file.name))throw new Error("Upload the full WAV file to create its preview.");
  if(file.size>40*1024*1024)throw new Error("The full WAV must be under 40 MB.");
  const bytes=await file.arrayBuffer(),header=new DataView(bytes);
  if(bytes.byteLength<44||header.getUint32(0,false)!==0x52494646||header.getUint32(8,false)!==0x57415645)throw new Error("This file is not a readable WAV. Export it as a standard WAV and retry.");
  const context=new AudioContext({sampleRate:44100});
  try {
    const decoded=await context.decodeAudioData(bytes);
    const channels=Array.from({length:decoded.numberOfChannels},(_,i)=>decoded.getChannelData(i));
    return new File([encodeWavPreview(channels,decoded.sampleRate)],file.name.replace(/\.wav$/i,"-preview.wav"),{type:"audio/wav"});
  } finally {await context.close();}
}
