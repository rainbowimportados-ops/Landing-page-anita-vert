import { test } from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import vm from 'node:vm';
const source=stripTypeScriptTypes(readFileSync(new URL('../supabase/functions/site-admin-users/index.ts',import.meta.url),'utf8').replace(/^import .*\n/,''));
async function run({email='diretoria@institutovert.com.br',member=true,existing=null,inviteError=null,grantError=null,body={action:'invite',email:'new@example.com'},bearer=true}={}){
 let handler,invites=0,grants=0;
 const client={auth:{getUser:async()=>({data:{user:{id:'director',email}}}),admin:{inviteUserByEmail:async()=>{invites++;return {error:inviteError};}}},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:member?{user_id:'director'}:null})})})}),rpc:async(name)=>name==='site_admin_account'?{data:existing}:(grants++,{error:grantError})};
 vm.runInNewContext(source,{createClient:()=>client,Response,Deno:{env:{get:()=>''},serve:fn=>handler=fn}});
 const response=await handler(new Request('https://test.invalid',{method:'POST',headers:bearer?{Authorization:'Bearer test'}:{},body:JSON.stringify(body)}));
 return {status:response.status,data:await response.json(),invites,grants};
}
test('unauthenticated request cannot invite',async()=>{const r=await run({bearer:false});assert.equal(r.status,401);assert.equal(r.invites+r.grants,0);});
test('non-director and revoked director cannot invite',async()=>{for(const opts of [{email:'other@example.com'},{member:false}]){const r=await run(opts);assert.equal(r.status,403);assert.equal(r.invites+r.grants,0);}});
test('invalid email cannot mutate users',async()=>{const r=await run({body:{action:'invite',email:'invalid'}});assert.equal(r.status,400);assert.equal(r.invites+r.grants,0);});
test('confirmed account is authorized without sending mail',async()=>{const r=await run({existing:{confirmed:true}});assert.equal(r.status,200);assert.equal(r.invites,0);assert.equal(r.grants,1);assert.equal(r.data.invited,false);});
test('new account is invited then authorized',async()=>{const r=await run();assert.equal(r.status,200);assert.equal(r.invites,1);assert.equal(r.grants,1);assert.equal(r.data.invited,true);});
test('failed invitation never grants access',async()=>{const r=await run({inviteError:{status:429}});assert.equal(r.status,429);assert.equal(r.grants,0);});
test('partial failure is reported instead of success',async()=>{const r=await run({grantError:{message:'denied'}});assert.equal(r.status,409);assert.match(r.data.error,/autorização falhou/);});
