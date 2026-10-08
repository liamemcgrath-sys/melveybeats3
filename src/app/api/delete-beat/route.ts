import { requireAdministrator } from "@/lib/auth-server";
import { checkOrigin,json,errorResponse } from "@/lib/checkout";
async function retired(request:Request){try{checkOrigin(request);await requireAdministrator(request);return json({error:"Use the administrator studio for catalog changes."},410);}catch(e){return errorResponse(e);}}
export const POST=retired;
export const DELETE=retired;
