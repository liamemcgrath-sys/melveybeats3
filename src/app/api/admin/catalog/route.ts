import { requireAdministrator } from "@/lib/auth-server";
import { database,getCatalog } from "@/lib/catalog-store";
import { validateBeat } from "@/lib/admin-validation";
import { checkOrigin,readJson,json,errorResponse,CheckoutError } from "@/lib/checkout";
import type { Beat } from "@/lib/catalog";
async function assets(owner:string,beat:Omit<Beat,"id">){
  if(!beat.previewKey||!beat.downloadKey)throw new CheckoutError("Attach both preview audio and a purchased master file.");
  for(const [kind,key] of [["preview",beat.previewKey],["master",beat.downloadKey],["art",beat.artworkKey]]){if(!key)continue;const {data,error}=await database().from("melvey_media").select("key").eq("key",key).eq("owner_id",owner).eq("kind",kind).eq("verified",true).maybeSingle();if(error||!data)throw new CheckoutError("A selected file is not a verified upload for this beat.");}
}
const values=(b:Omit<Beat,"id">)=>({title:b.title,genre:b.genre,bpm:b.bpm,musical_key:b.key,tags:b.tags,price:b.price,exclusive_price:b.exclusive,duration:b.duration,preview_key:b.previewKey,download_key:b.downloadKey,artwork_key:b.artworkKey});
export async function GET(request:Request){try{await requireAdministrator(request);const [catalog,orders,accounts]=await Promise.all([getCatalog(true),database().from("melvey_orders").select("id",{count:"exact",head:true}).eq("status","paid"),database().from("melvey_profiles").select("owner_id",{count:"exact",head:true})]);if(orders.error||accounts.error)throw new CheckoutError("Could not load studio statistics.",503);return json({...catalog,stats:{orders:orders.count??0,accounts:accounts.count??0}});}catch(e){return errorResponse(e);}}
export async function POST(request:Request){try{checkOrigin(request);const admin=await requireAdministrator(request),body=await readJson(request);if(body.ownsRights!==true)throw new CheckoutError("Confirm that you own the rights to this beat.");const beat=validateBeat(body);await assets(admin.id,beat);const {data,error}=await database().from("melvey_catalog").insert(values(beat)).select("id").single();if(error)throw new CheckoutError("Could not publish your beat.",503);return json({id:data.id},201);}catch(e){return errorResponse(e);}}
export async function PATCH(request:Request){try{checkOrigin(request);const admin=await requireAdministrator(request),body=await readJson(request),catalog=await getCatalog(true),current=catalog.beats.find(b=>b.id===body.id);if(!current)throw new CheckoutError("Beat not found.",404);let error;
  if(body.action==="feature"){if(current.archived||current.sold)throw new CheckoutError("Choose an available beat.");({error}=await database().from("melvey_settings").update({featured_id:current.id}).eq("id","main"));}
  else if(body.action==="restore"){if(current.sold)throw new CheckoutError("An exclusive sale cannot be restored.");({error}=await database().from("melvey_catalog").update({archived:false}).eq("id",current.id));}
  else if(body.action){throw new CheckoutError("Unsupported studio action.");}
  else {const beat=validateBeat({...current,...body});await assets(admin.id,beat);({error}=await database().from("melvey_catalog").update(values(beat)).eq("id",current.id));}
  if(error)throw new CheckoutError("Could not update this beat.",503);return json({ok:true});
}catch(e){return errorResponse(e);}}
export async function DELETE(request:Request){try{checkOrigin(request);await requireAdministrator(request);const body=await readJson(request);const {data,error}=await database().from("melvey_catalog").update({archived:true}).eq("id",typeof body.id==="string"?body.id:"").select("id").maybeSingle();if(error)throw new CheckoutError("Could not remove this beat.",503);if(!data)throw new CheckoutError("Beat not found.",404);return json({ok:true});}catch(e){return errorResponse(e);}}
