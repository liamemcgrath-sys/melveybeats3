import { identity } from "@/lib/auth-server";
import { findOrder } from "@/lib/order-store";
import { json,errorResponse,CheckoutError,validToken } from "@/lib/checkout";
export async function GET(_request:Request,context:{params:Promise<{token:string}>}){try{const user=await identity(),{token}=await context.params;if(!validToken(token))throw new CheckoutError("Order not found.",404);const order=await findOrder(user.id,token);if(!order)throw new CheckoutError("Order not found.",404);return json({order});}catch(e){return errorResponse(e);}}
