import { identity } from "@/lib/auth-server";
import { stripeClient,verifyAndComplete } from "@/lib/payments";
import { readJson,checkOrigin,json,errorResponse,CheckoutError } from "@/lib/checkout";
export async function POST(request:Request){try{checkOrigin(request);const user=await identity(),body=await readJson(request);if(typeof body.sessionId!=="string"||!/^cs_(test_|live_)?[A-Za-z0-9]+$/.test(body.sessionId))throw new CheckoutError("Invalid checkout session.");const session=await stripeClient().checkout.sessions.retrieve(body.sessionId);return json({order:await verifyAndComplete(session,user.id)});}catch(e){return errorResponse(e);}}
