import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=(await readFile(new URL('./workspace.js',import.meta.url),'utf8'))
 .replace("import './workspace.css';",'')
 .replace("import qrcode from './vendor/qrcode.js';",'const qrcode=()=>{};')
 .replace("'./continuity-model.js'",JSON.stringify(new URL('./continuity-model.js',import.meta.url).href))
 .replace("'./dashboard-model.js'",JSON.stringify(new URL('./dashboard-model.js',import.meta.url).href));
const {initWorkspace}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
function setup({files=[],links=[],error=null}={}){
 const elements=new Map(),events={},calls=[];
 const el=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',dataset:{activeSection:'midia'},addEventListener(type,fn){this[type]=fn;},showModal(){this.open=true;},close(){this.open=false;}});return elements.get(id);};
 globalThis.document={querySelector:el,getElementById:el,addEventListener(type,fn){events[type]=fn;}};
 globalThis.location={origin:'https://institutovert.app'};
 const supabase={storage:{from(){return {async list(folder,options){calls.push({folder,...options});return {data:files,error};},getPublicUrl(path){return {data:{publicUrl:'https://media.example/'+path}};}};}},from(){return {select(){return this;},order(){return this;},async range(){return {data:links,error};}};}};
 const app=initWorkspace({supabase,getLeads:()=>[],getSession:()=>null,activatePanel(){},refresh(){}});
 const click=action=>events.click({target:{closest:()=>({dataset:{ws:action,id:''}})}});
 return {app,el,events,calls,click};
}
test('media pagination reaches files beyond first page and resets on search',async()=>{
 const s=setup({files:Array.from({length:60},(_,i)=>({id:String(i),name:`foto-${i}.jpg`}))});
 await s.app.activate('midia');assert.equal(s.calls[0].offset,0);assert.match(s.el('ws-midia').innerHTML,/Próxima página/);
 await s.click('media-next');assert.equal(s.calls[1].offset,60);
 await s.events.change({target:{hasAttribute:()=>true,value:'foto-59'}});
 assert.equal(s.calls[2].offset,0);assert.equal(s.calls[2].search,'foto-59');
});
test('media errors show recovery rather than an empty library',async()=>{
 const s=setup({error:{message:'Conexão interrompida'}});await s.app.activate('midia');
 assert.match(s.el('ws-midia').innerHTML,/Conexão interrompida/);assert.match(s.el('ws-midia').innerHTML,/Tentar novamente/);
});
test('tracking links escape labels and expose edit without changing old URL',async()=>{
 const s=setup({links:[{id:'one',name:'<script>alert(1)</script>',path:'/',source:'instagram',medium:'social',campaign:'outubro',content:''}]});
 await s.app.activate('links-qr');const html=s.el('ws-links-qr').innerHTML;
 assert.ok(!html.includes('<script>'));assert.match(html,/data-ws="edit-link"/);assert.match(html,/utm_campaign=outubro/);
 await s.events.click({target:{closest:()=>({dataset:{ws:'edit-link',id:'one'}})}});
 assert.match(s.el('#ws-fields').innerHTML,/value="outubro"/);assert.match(s.el('#ws-fields').innerHTML,/já compartilhados/);
});
