import "server-only";
import Stripe from "stripe";
import { database } from "./catalog-store";
import { toReceipt,type StoredOrder } from "./order-store";
import { CheckoutError } from "./checkout";
export function stripeClient(){if(!process.env.STRIPE_SECRET_KEY)throw new CheckoutError("Checkout is temporarily unavailable.",503);return new Stripe(process.env.STRIPE_SECRET_KEY);}
export async function verifyAndComplete(session:Stripe.Checkout.Session,owner?:string){
  const orderId=session.metadata?.melvey_order;
  if(!orderId)throw new CheckoutError("This is not a Melvey account order.",400);
  const {data:order,error}=await database().from("melvey_orders").select("*").eq("id",orderId).maybeSingle();
  if(error||!order||(owner&&order.owner_id!==owner))throw new CheckoutError("Order not found.",404);
  if(order.stripe_session_id!==session.id||session.metadata?.melvey_owner!==order.owner_id||session.currency!=="usd"||session.amount_total!==order.total)throw new CheckoutError("Payment details do not match this order.",409);
  if(session.payment_status!=="paid")throw new CheckoutError("Your payment is not complete yet.",409);
  const {data,error:saveError}=await database().rpc("melvey_complete_order",{p_order:order.id,p_session:session.id,p_mode:session.livemode?"live":"test"});
  if(saveError)throw new CheckoutError("Your payment was verified, but your library is still updating. Please retry.",503);
  return toReceipt(data as StoredOrder);
}
// Release inventory only after Stripe confirms expiry, never just on a timer.
export async function reconcileOrders(){
  const {data,error}=await database().from("melvey_orders").select("id,stripe_session_id").eq("status","pending").not("stripe_session_id","is",null).order("created_at").limit(30);
  if(error)throw new CheckoutError("The store is temporarily unavailable.",503);
  if(!data?.length)return;
  const stripe=stripeClient();
  for(const row of data){try{const session=await stripe.checkout.sessions.retrieve(row.stripe_session_id);if(session.payment_status==="paid")await verifyAndComplete(session);else if(session.status==="expired"){const {error:cancelError}=await database().rpc("melvey_cancel_order",{p_order:row.id,p_session:session.id});if(cancelError)throw cancelError;}}catch{ /* Keep the hold when payment cannot be verified. */ }}
}
