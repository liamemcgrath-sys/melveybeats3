import { stripeClient,verifyAndComplete } from "@/lib/payments";
import { database } from "@/lib/catalog-store";
import { json } from "@/lib/checkout";
import type Stripe from "stripe";
export async function POST(request:Request){
  if(!process.env.STRIPE_WEBHOOK_SECRET)return json({error:"Webhook not configured."},503);
  try{const event=stripeClient().webhooks.constructEvent(await request.text(),request.headers.get("stripe-signature")||"",process.env.STRIPE_WEBHOOK_SECRET);
    if(["checkout.session.completed","checkout.session.async_payment_succeeded"].includes(event.type)){const session=event.data.object as Stripe.Checkout.Session;if(session.metadata?.melvey_order&&session.payment_status==="paid")await verifyAndComplete(session);}
    if(event.type==="checkout.session.expired"){const session=event.data.object as Stripe.Checkout.Session;if(session.metadata?.melvey_order){const {error}=await database().rpc("melvey_cancel_order",{p_order:session.metadata.melvey_order,p_session:session.id});if(error)return json({error:"Retry this event."},503);}}
    return json({received:true});
  }catch{return json({error:"Webhook verification or fulfillment failed."},400);}
}
