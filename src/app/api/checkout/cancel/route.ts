import { identity } from "@/lib/auth-server";
import { database } from "@/lib/catalog-store";
import { stripeClient,verifyAndComplete } from "@/lib/payments";
import { checkOrigin,readJson,json,errorResponse,CheckoutError,validToken } from "@/lib/checkout";
export async function POST(request:Request){try{
  checkOrigin(request);const user=await identity(),body=await readJson(request);if(typeof body.order!=="string"||!validToken(body.order))throw new CheckoutError("Invalid order.");
  const {data:order,error}=await database().from("melvey_orders").select("*").eq("id",body.order).eq("owner_id",user.id).maybeSingle();if(error||!order?.stripe_session_id)throw new CheckoutError("Checkout not found.",404);
  const stripe=stripeClient();let session=await stripe.checkout.sessions.retrieve(order.stripe_session_id);
  if(session.payment_status==="paid")return json({order:await verifyAndComplete(session,user.id)});
  if(session.status==="open")session=await stripe.checkout.sessions.expire(session.id);
  if(session.status!=="expired")throw new CheckoutError("This checkout cannot be cancelled yet.",409);
  const {error:cancelError}=await database().rpc("melvey_cancel_order",{p_order:order.id,p_session:session.id});if(cancelError)throw new CheckoutError("Could not release your checkout. Please retry.",503);
  return json({ok:true});
}catch(e){return errorResponse(e);}}
