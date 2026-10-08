import { cookies } from "next/headers";
import { Icon,Wordmark } from "@/app/components/brand";

export const metadata={title:"Email verification — Melvey",robots:{index:false,follow:false}};
export default async function VerifiedPage({searchParams}:{searchParams:Promise<{error?:string}>}){
  const params=await searchParams;
  const verified=!params.error&&(await cookies()).get("melvey-email-verified")?.value==="1";
  const title=verified?"Email verified":params.error==="signout_failed"?"One more step":"Verification link needed";
  return <main className="verification-page"><a href="/" aria-label="Melvey home"><Wordmark/></a><section className="verification-card" aria-labelledby="verification-title"><div className="verification-icon"><Icon name={verified?"check":"shield"} size={30}/></div><p className="eyebrow muted">YOUR MELVEY ACCOUNT</p><h1 id="verification-title">{title}</h1><p>{verified?"Your email is confirmed. Sign in again to access your beats, receipts, and downloads.":params.error==="signout_failed"?"We couldn’t finish ending the confirmation session. Please try signing out, then sign in again.":params.error?"This link has expired or has already been used. If you’ve already verified your email, you can sign in. Otherwise, request a new confirmation email.":"Open the verification link in your confirmation email to finish setting up your account."}</p><a className="primary-button wide" href="/?account=1">Sign in again<Icon name="arrow" size={18}/></a><a className="text-button wide" href="/">Back to the store</a></section></main>;
}
