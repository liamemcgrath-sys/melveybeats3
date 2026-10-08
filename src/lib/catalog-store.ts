import "server-only";
import { getSupabaseAdmin } from "./supabaseServer";
import { CheckoutError } from "./checkout";
import type { Beat, Genre } from "./catalog";

export const database = getSupabaseAdmin;
type BeatRow={id:string;title:string;genre:Genre;bpm:number;musical_key:string;tags:string[];price:number;exclusive_price:number;duration:number;preview_key:string;download_key:string;artwork_key:string|null;archived:boolean;sold:boolean};
export const rowBeat=(row:BeatRow):Beat=>({id:row.id,title:row.title,genre:row.genre,bpm:row.bpm,key:row.musical_key,tags:row.tags,price:row.price,exclusive:row.exclusive_price,duration:row.duration,previewKey:row.preview_key,downloadKey:row.download_key,artworkKey:row.artwork_key,archived:row.archived,sold:row.sold,isDemo:false});
export async function getCatalog(includeArchived=false) {
  const db=database();
  let query=db.from("melvey_catalog").select("*").order("created_at",{ascending:false});
  if(!includeArchived)query=query.eq("archived",false).eq("sold",false);
  const [{data,error},{data:meta},{data:holds}]=await Promise.all([query,db.from("melvey_settings").select("featured_id").eq("id","main").maybeSingle(),db.from("melvey_holds").select("beat_id").eq("license","exclusive")]);
  if(error)throw new CheckoutError("The catalog is temporarily unavailable.",503);
  const reserved=new Set((holds||[]).map(h=>h.beat_id));
  const catalog=(data||[]).map(rowBeat).filter(b=>includeArchived||!reserved.has(b.id));
  const available=catalog.filter(b=>!b.archived&&!b.sold&&!reserved.has(b.id));
  return {beats:catalog,featuredId:available.some(b=>b.id===meta?.featured_id)?meta!.featured_id:available[0]?.id??null};
}
