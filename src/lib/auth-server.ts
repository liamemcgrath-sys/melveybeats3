import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { CheckoutError } from "./checkout";
import { getSupabaseAdmin } from "./supabaseServer";

export async function serverAuth() {
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => jar.getAll(), setAll: entries => {
      try { entries.forEach(({name,value,options}) => jar.set(name,value,options)); }
      catch { /* The session proxy writes refreshed cookies for Server Components. */ }
    } } },
  );
}

export async function identity() {
  const auth = await serverAuth();
  const { data: { user }, error } = await auth.auth.getUser();
  if (error || !user?.email) throw new CheckoutError("Log in to continue.", 401);
  return { id: user.id, email: user.email, name: String(user.user_metadata?.name || user.email), verified: Boolean(user.email_confirmed_at) };
}

export async function isAdmin(user: {id:string;email?:string;verified?:boolean}) {
  const client=getSupabaseAdmin();
  const {data,error}=await client.from("melvey_settings").select("admin_owner_id,admin_owner_email").eq("id","main").maybeSingle();
  if(error||!data)return false;
  if(data.admin_owner_email){
    if(!user.verified||user.email?.toLowerCase()!==data.admin_owner_email.toLowerCase())return false;
    const result=await client.rpc("melvey_enroll_owner",{p_owner:user.id});
    return !result.error&&result.data===user.id;
  }
  return !error && Boolean(data?.admin_owner_id) && data!.admin_owner_id===user.id;
}

export async function requireAdministrator(_request?: Request) {
  const user = await identity();
  if (!await isAdmin(user)) throw new CheckoutError("Administrator access required.",403);
  return user;
}
