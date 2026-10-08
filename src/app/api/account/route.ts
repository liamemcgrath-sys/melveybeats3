import { identity,isAdmin } from "@/lib/auth-server";
import { findProfile,saveProfile } from "@/lib/account-store";
import { listOrders } from "@/lib/order-store";
import { json,errorResponse,readJson,checkOrigin,CheckoutError } from "@/lib/checkout";
export async function GET() {try{const user=await identity();return json({identity:{id:user.id,email:user.email,name:user.name},profile:await findProfile(user.id),orders:await listOrders(user.id),isAdmin:await isAdmin(user)});}catch(e){return errorResponse(e);}}
export async function POST(request:Request) {try{checkOrigin(request);const user=await identity(),body=await readJson(request);if(body.acceptedTerms!==true)throw new CheckoutError("Please accept the account terms.");await saveProfile(user,typeof body.name==="string"?body.name:"");return json({ok:true});}catch(e){return errorResponse(e);}}
