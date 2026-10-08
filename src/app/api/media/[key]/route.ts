import { database } from "@/lib/catalog-store";
import { identity,isAdmin } from "@/lib/auth-server";
import { json,errorResponse,CheckoutError } from "@/lib/checkout";
async function media(request:Request,context:{params:Promise<{key:string}>}){try{
  const {key}=await context.params;if(!/^[a-f0-9-]{36}\.(mp3|wav|ogg|png|jpg|webp)$/.test(key))throw new CheckoutError("File not found.",404);
  const db=database(),{data:asset,error}=await db.from("melvey_media").select("kind,name,verified").eq("key",key).maybeSingle();if(error||!asset?.verified)throw new CheckoutError("File not found.",404);
  if(asset.kind==="master"){
    const user=await identity();if(!await isAdmin(user)){const {data:order,error:orderError}=await db.from("melvey_orders").select("id").eq("owner_id",user.id).eq("status","paid").contains("items",[{downloadKey:key}]).limit(1);if(orderError||!order?.length)throw new CheckoutError("This download is restricted to its buyer.",403);}
  }
  const {data:link,error:linkError}=await db.storage.from("melvey-store").createSignedUrl(key,60,new URL(request.url).searchParams.has("download")?{download:asset.name}:undefined);if(linkError||!link)throw new CheckoutError("File unavailable.",404);
  return new Response(null,{status:307,headers:{Location:link.signedUrl,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
}catch(e){return errorResponse(e);}}
export const GET=media;
export const HEAD=media;
