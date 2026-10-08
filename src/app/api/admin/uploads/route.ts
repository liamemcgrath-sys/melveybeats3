import { requireAdministrator } from "@/lib/auth-server";
import { database } from "@/lib/catalog-store";
import { detectUpload } from "@/lib/admin-validation";
import { checkOrigin,readJson,json,errorResponse,CheckoutError } from "@/lib/checkout";
const formats:Record<string,{mime:string;ext:string}>={mp3:{mime:"audio/mpeg",ext:"mp3"},wav:{mime:"audio/wav",ext:"wav"},ogg:{mime:"audio/ogg",ext:"ogg"},png:{mime:"image/png",ext:"png"},jpg:{mime:"image/jpeg",ext:"jpg"},jpeg:{mime:"image/jpeg",ext:"jpg"},webp:{mime:"image/webp",ext:"webp"}};
export async function POST(request:Request){try{
  checkOrigin(request);const admin=await requireAdministrator(request),body=await readJson(request),db=database();
  if(typeof body.complete==="string"){
    const {data:asset,error}=await db.from("melvey_media").select("*").eq("key",body.complete).eq("owner_id",admin.id).maybeSingle();if(error||!asset)throw new CheckoutError("Upload not found.",404);
    const {data:link,error:linkError}=await db.storage.from("melvey-store").createSignedUrl(asset.key,60);if(linkError||!link)throw new CheckoutError("Upload has not arrived yet.");
    const response=await fetch(link.signedUrl,{headers:{Range:"bytes=0-255"},cache:"no-store",signal:AbortSignal.timeout(15000)});if(!response.ok)throw new CheckoutError("Could not validate this upload.");
    const actualSize=Number(response.headers.get("content-range")?.split("/").at(-1)||response.headers.get("content-length"));
    if(actualSize!==asset.size)throw new CheckoutError("Uploaded file size does not match.");
    const buffer=new Uint8Array(await response.arrayBuffer());if(buffer.length>41943040)throw new CheckoutError("Upload too large.");const detected=detectUpload(buffer,asset.kind);if(detected.mime!==asset.mime)throw new CheckoutError("Uploaded file type does not match.");
    const {error:saveError}=await db.from("melvey_media").update({verified:true}).eq("key",asset.key);if(saveError)throw new CheckoutError("Could not verify this upload.",503);return json({key:asset.key});
  }
  const kind=String(body.kind),name=String(body.name||"").split(/[\\/]/).at(-1)!.slice(0,150),format=formats[name.split(".").at(-1)!.toLowerCase()],max=(kind==="art"?5:kind==="master"?40:20)*1024*1024;
  if(!["preview","master","art"].includes(kind)||!format||(kind==="art")!==format.mime.startsWith("image/"))throw new CheckoutError("Choose an MP3/WAV/OGG audio file or PNG/JPG/WebP artwork.");
  if(typeof body.size!=="number"||!Number.isSafeInteger(body.size)||body.size<1||body.size>max)throw new CheckoutError("This file is empty or too large.",413);
  const key=`${crypto.randomUUID()}.${format.ext}`;
  const {error:insertError}=await db.from("melvey_media").insert({key,owner_id:admin.id,kind,name,mime:format.mime,size:body.size});if(insertError)throw new CheckoutError("Could not prepare upload.",503);
  const {data,error}=await db.storage.from("melvey-store").createSignedUploadUrl(key);if(error||!data)throw new CheckoutError("Could not prepare upload.",503);
  return json({key,url:data.signedUrl,mime:format.mime},201);
}catch(e){return errorResponse(e);}}
