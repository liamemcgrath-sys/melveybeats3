import { requireProfile } from "@/lib/account-store";
import { database } from "@/lib/catalog-store";
import { stripeClient,reconcileOrders } from "@/lib/payments";
import { checkOrigin,siteOrigin,validateCheckout,readJson,json,errorResponse,CheckoutError } from "@/lib/checkout";
import type { StoredOrder } from "@/lib/order-store";
export const runtime="nodejs";
export async function POST(request:Request){
  try{
    checkOrigin(request);const user=await requireProfile();const input=validateCheckout({...await readJson(request),email:user.email});
    const stripe=stripeClient();await reconcileOrders();
    const {data,error}=await database().rpc("melvey_reserve_order",{p_owner:user.id,p_email:user.email,p_key:input.idempotencyKey,p_items:input.items});
    if(error)throw new CheckoutError("A beat in your cart is unavailable or reserved. Please update your cart.",409);
    const order=data as StoredOrder;
    if(order.status!=="pending")throw new CheckoutError("This checkout is complete or cancelled. Start a new checkout.",409);
    if(order.stripe_session_id){const previous=await stripe.checkout.sessions.retrieve(order.stripe_session_id);if(previous.status==="open"&&previous.url)return json({url:previous.url});throw new CheckoutError("This checkout is no longer open. Please start again.",409);}
    const base=siteOrigin(request);
    const session=await stripe.checkout.sessions.create({mode:"payment",payment_method_types:["card"],customer_email:order.email,
      line_items:order.items.map(item=>({quantity:1,price_data:{currency:"usd",unit_amount:item.price,product_data:{name:`${item.title} · ${item.license==='exclusive'?'Exclusive':'Standard'} license`}}})),
      success_url:`${base}/success?session_id={CHECKOUT_SESSION_ID}`,cancel_url:`${base}/cancel?order=${order.id}`,
      metadata:{melvey_order:order.id,melvey_owner:user.id,license_version:"melvey-v1"},expires_at:Math.floor(Date.parse(order.created_at)/1000)+3600,
    },{idempotencyKey:`melvey-${order.id}`});
    const {error:saveError}=await database().from("melvey_orders").update({stripe_session_id:session.id,mode:session.livemode?"live":"test"}).eq("id",order.id).eq("status","pending");
    if(saveError)throw new CheckoutError("Could not save checkout. Retry with the same cart.",503);
    return json({url:session.url,mode:session.livemode?"live":"test"});
  }catch(error){return errorResponse(error);}
}
