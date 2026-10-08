import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({request});
  const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => request.cookies.getAll(), setAll: (entries, headers) => {
      entries.forEach(({name,value})=>request.cookies.set(name,value));
      response=NextResponse.next({request});
      entries.forEach(({name,value,options})=>response.cookies.set(name,value,options));
      Object.entries(headers).forEach(([key,value])=>response.headers.set(key,value));
    } },
  });
  await client.auth.getClaims();
  response.headers.set("Cache-Control","private, no-store");
  return response;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|favicon.svg|art/).*)"] };
