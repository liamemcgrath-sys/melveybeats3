import { identity,isAdmin } from "@/lib/auth-server";
import Studio from "./studio";
import StudioLogin from "./studio-login";
export const dynamic="force-dynamic";
export default async function StudioPage(){let allowed=false;try{allowed=await isAdmin(await identity());}catch{}return allowed?<Studio/>:<StudioLogin/>;}
