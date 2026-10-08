import { NextResponse } from "next/server";
import { serverAuth } from "@/lib/auth-server";
import { siteOrigin } from "@/lib/checkout";
import { verifyConfirmation } from "@/lib/email-verification";
export async function GET(request:Request) {
  const origin=siteOrigin(request);
  const status=await verifyConfirmation(new URL(request.url).searchParams,async()=>(await serverAuth()).auth);
  const destination=status==="verified"?"/auth/verified":`/auth/verified?error=${status}`;
  const response=NextResponse.redirect(new URL(destination,origin));
  response.headers.set("Cache-Control","private, no-store");
  response.headers.set("Referrer-Policy","no-referrer");
  response.cookies.set("melvey-email-verified",status==="verified"?"1":"",{httpOnly:true,secure:origin.startsWith("https:"),sameSite:"lax",path:"/auth/verified",maxAge:status==="verified"?600:0});
  return response;
}
