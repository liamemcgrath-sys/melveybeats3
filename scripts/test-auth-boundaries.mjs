import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:4318';
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--port','4318','--hostname','127.0.0.1'],{env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:'https://safblqhrvsyjncugixrk.supabase.co',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'boundary-test-placeholder'},stdio:['ignore','pipe','pipe']});
let output='';server.stdout.on('data',chunk=>output+=chunk);server.stderr.on('data',chunk=>output+=chunk);
try{
 await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('Server did not start: '+output)),15000);const poll=setInterval(()=>{if(output.includes('Ready')){clearInterval(poll);clearTimeout(timeout);resolve();}},50);server.once('exit',code=>{clearInterval(poll);clearTimeout(timeout);reject(new Error('Server exited '+code+': '+output));});});
 let checks=0;
 for(const path of ['/api/add-beat','/api/delete-beat','/api/set-free-beat','/api/admin/catalog','/api/admin/uploads','/api/admin/enroll','/api/checkout','/api/checkout/confirm']){
  const response=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json','Origin':base,'oai-authenticated-user-id':'fake-owner','oai-authenticated-user-email':'fake@example.test'},body:JSON.stringify({password:'ADMIN_BYPASS',isAdmin:true,role:'admin',token:'pretend-secret',name:'Fake'})});assert.equal(response.status,401,path);checks++;}
 const read=await fetch(base+'/api/admin/catalog');assert.equal(read.status,401);checks++;
 const foreign=await fetch(base+'/api/admin/catalog',{method:'POST',headers:{'Origin':'https://evil.example','Content-Type':'application/json'},body:'{}'});assert.equal(foreign.status,403);checks++;
 const missing=await fetch(base+'/auth/callback?next=https://example.com',{redirect:'manual'});assert.equal(missing.status,307);assert.equal(missing.headers.get('location'),base+'/auth/verified?error=invalid');assert.equal(missing.headers.get('referrer-policy'),'no-referrer');assert.match(missing.headers.get('cache-control'),/no-store/);assert.match(missing.headers.get('set-cookie'),/Max-Age=0/);checks++;
 const unrelated=await fetch(base+'/auth/callback?token_hash=fake&type=recovery',{redirect:'manual'});assert.equal(unrelated.headers.get('location'),base+'/auth/verified?error=invalid');checks++;
 const ordinaryPage=await (await fetch(base+'/auth/verified?verified=1')).text();assert.match(ordinaryPage,/Verification link needed/);assert.doesNotMatch(ordinaryPage,/id="verification-title">Email verified/);checks++;
 const confirmedPage=await (await fetch(base+'/auth/verified',{headers:{Cookie:'melvey-email-verified=1'}})).text();assert.match(confirmedPage,/id="verification-title">Email verified/);assert.match(confirmedPage,/Sign in again/);assert.match(confirmedPage,/href="\/\?account=1"/);checks++;
 const failedPage=await (await fetch(base+'/auth/verified?error=invalid',{headers:{Cookie:'melvey-email-verified=1'}})).text();assert.doesNotMatch(failedPage,/id="verification-title">Email verified/);checks++;
 const statusCannotAuthorize=await fetch(base+'/api/admin/catalog',{headers:{Cookie:'melvey-email-verified=1'}});assert.equal(statusCannotAuthorize.status,401);checks++;
 process.stdout.write(`${checks} HTTP authorization and confirmation checks passed. Account gates, confirmation redirects, and sign-in prompts are verified.\n`);
}finally{server.kill('SIGTERM');}
