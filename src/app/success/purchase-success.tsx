"use client";
import { useCallback,useEffect,useState } from "react";
import { Wordmark } from "../components/brand";
import AuthForm from "../auth-form";
export default function PurchaseSuccess({sessionId}:{sessionId:string|null}){
  const [error,setError]=useState(""),[login,setLogin]=useState(false),[busy,setBusy]=useState(true),[legacy,setLegacy]=useState(false);
  const confirm=useCallback(async()=>{setBusy(true);setError("");setLogin(false);try{
    if(!sessionId)throw new Error("No checkout session was provided.");
    const response=await fetch("/api/checkout/confirm",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId}),signal:AbortSignal.timeout(20000)}),data=await response.json();
    if(response.status===401){setLogin(true);return;}
    if(response.status===400&&data.error?.includes("not a Melvey account order")){setLegacy(true);return;}
    if(!response.ok||!data.order)throw new Error(data.error||"We couldn't verify your payment yet.");
    try{localStorage.removeItem("melvey.cart.v1");localStorage.setItem("melvey.lastReceipt.v1",data.order.token);}catch{}
    window.location.replace(`/?order=${encodeURIComponent(data.order.token)}`);
  }catch(e){setError(e instanceof Error?e.message:"Could not confirm this payment.");}finally{setBusy(false);}},[sessionId]);
  useEffect(()=>{void confirm();},[confirm]);
  async function legacyDownload(){setBusy(true);try{const response=await fetch(`/api/download-beat?session_id=${encodeURIComponent(sessionId||"")}`),data=await response.json();if(!response.ok||!data.url)throw new Error(data.error||"Download unavailable.");window.location.assign(data.url);}catch(e){setError(e instanceof Error?e.message:"Download unavailable.");}finally{setBusy(false);}}
  return <main className="studio-gate"><a href="/"><Wordmark/></a><div className="studio-gate-card"><p className="eyebrow muted">YOUR MELVEY ORDER</p><h1>{busy?"Verifying your payment…":login?"Log in to your account":legacy?"Your purchase is ready":"Your library is updating"}</h1>{login?<AuthForm onUpdated={confirm}/>:legacy?<button className="primary-button wide" disabled={busy} onClick={()=>void legacyDownload()}>Download your purchased beat</button>:<p>We verify payment with Stripe before adding your audio and license to My beats.</p>}{error?<><p className="checkout-error" role="alert">{error}</p><button className="primary-button wide" disabled={busy} onClick={()=>void confirm()}>Retry verification</button></>:null}<a className="text-button wide" href="/">Back to the store</a></div></main>;
}
