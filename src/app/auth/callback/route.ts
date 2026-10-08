import { NextResponse } from "next/server";
import { serverAuth } from "@/lib/auth-server";
import { siteOrigin } from "@/lib/checkout";
export async function GET(request:Request) {
  const url=new URL(request.url),code=url.searchParams.get("code");
  if(code){const client=await serverAuth();const {error}=await client.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL("/?account=1",siteOrigin(request)));}
  return NextResponse.redirect(new URL("/?account=1&auth_error=1",siteOrigin(request)));
}
