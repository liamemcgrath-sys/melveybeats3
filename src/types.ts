export type DisplayBeat = {
  id: string;
  title: string;
  price: number;
  audio_url: string;   
  preview_url?: string;
  fullAudioPath: string;   // private full beat path
  created_at?: string;
};
