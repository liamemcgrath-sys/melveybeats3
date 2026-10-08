import { validEnrollmentToken } from "@/lib/enrollment";
import { identity } from "@/lib/auth-server";
import { database } from "@/lib/catalog-store";
import { checkOrigin,readJson,json,errorResponse,CheckoutError } from "@/lib/checkout";
export async function POST(request:Request){try{
  checkOrigin(request);const user=await identity(),body=await readJson(request),expected=process.env.MELVEY_ADMIN_ENROLLMENT_HASH;
  if(!validEnrollmentToken(body.token,expected))throw new CheckoutError("This owner setup link is invalid.",403);
  const {data,error}=await database().rpc("melvey_enroll_owner",{p_owner:user.id});if(error||data!==user.id)throw new CheckoutError("Studio ownership is already assigned to another account.",409);
  return json({ok:true});
}catch(e){return errorResponse(e);}}
