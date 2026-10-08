"use client";
import { useEffect,useState } from "react";
import { Wordmark } from "../components/brand";
import AuthForm from "../auth-form";
import { browserAuth } from "@/lib/auth-client";
export default function StudioLogin(){
  const [token,setToken]=useState(""),[error,setError]=useState("");
  useEffect(()=>{const params=new URLSearchParams(window.location.hash.slice(1));const secret=params.get("setup")||sessionStorage.getItem("melvey.ownerSetup")||"";if(secret){setToken(secret);sessionStorage.setItem("melvey.ownerSetup",secret);window.history.replaceState(null,"",window.location.pathname+window.location.search);}},[]);
  async function finish(){if(token){const response=await fetch("/api/admin/enroll",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token})}),result=await response.json();if(!response.ok){setError(result.error||"Could not finish owner setup.");return;}sessionStorage.removeItem("melvey.ownerSetup");}window.location.reload();}
  return <main className="studio-gate"><a href="/"><Wordmark/></a><div className="studio-gate-card"><p className="eyebrow muted">MELVEY STUDIO</p><h1>Administrator sign-in</h1><p>Log in with the store owner’s verified Melvey account. Other accounts cannot change the catalog.</p><AuthForm onUpdated={finish}/>{token?<button className="secondary-button wide" onClick={()=>void finish()}>Finish owner setup</button>:null}{error?<p className="checkout-error" role="alert">{error}</p>:null}<button className="text-button wide" onClick={async()=>{await browserAuth().auth.signOut();window.location.reload();}}>Switch account</button><a className="text-button wide" href="/">Back to the store</a></div></main>;}
