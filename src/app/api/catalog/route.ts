import { getCatalog } from "@/lib/catalog-store";
import { reconcileOrders } from "@/lib/payments";
import { json,errorResponse } from "@/lib/checkout";
export async function GET() {try{await reconcileOrders();return json(await getCatalog());}catch(e){return errorResponse(e);}}
