import Storefront from "./storefront";
import { getCatalog } from "@/lib/catalog-store";
import { reconcileOrders } from "@/lib/payments";
export const dynamic="force-dynamic";
export default async function HomePage(){await reconcileOrders();const catalog=await getCatalog();return <Storefront initialBeats={catalog.beats} initialFeaturedId={catalog.featuredId}/>;}
