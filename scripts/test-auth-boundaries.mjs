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
 process.stdout.write(`${checks} HTTP authorization checks passed. Fake role/native headers and legacy bypass passwords are rejected.\n`);
}finally{server.kill('SIGTERM');}
