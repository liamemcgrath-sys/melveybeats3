import "server-only";
import { database } from "./catalog-store";
import type { Receipt,ReceiptItem } from "./catalog";
import { CheckoutError } from "./checkout";
export type StoredOrder={id:string;owner_id:string;email:string;items:ReceiptItem[];total:number;status:string;stripe_session_id:string|null;created_at:string;mode:"test"|"live"};
export const toReceipt=(row:StoredOrder):Receipt=>({id:`MV-${row.id.slice(0,8).toUpperCase()}`,token:row.id,email:row.email,items:row.items,total:row.total,createdAt:row.created_at,mode:row.mode});
export async function findOrder(owner:string,token:string){const {data,error}=await database().from("melvey_orders").select("*").eq("owner_id",owner).eq("id",token).eq("status","paid").maybeSingle();if(error)throw new CheckoutError("Could not load this order.",503);return data?toReceipt(data):null;}
export async function listOrders(owner:string){const {data,error}=await database().from("melvey_orders").select("*").eq("owner_id",owner).eq("status","paid").order("created_at",{ascending:false});if(error)throw new CheckoutError("Could not load your library.",503);return (data||[]).map(toReceipt);}
