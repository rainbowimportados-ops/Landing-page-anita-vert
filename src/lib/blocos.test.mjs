import test from 'node:test';
import assert from 'node:assert/strict';
import { BLOCOS, normalizarBlocos } from './blocos.ts';
test('legacy content keeps all blocks and their original order',()=>{
 assert.deepEqual(normalizarBlocos(null), BLOCOS.map(([id])=>({id,visivel:true})));
});
test('draft order and hidden state survive normalization without duplicate or unknown blocks',()=>{
 const result=normalizarBlocos([{id:'sobre',visivel:false},{id:'banner',visivel:true},{id:'sobre'},null,{id:'unknown'},{id:'unidades',visivel:false}]);
 assert.equal(result.length,BLOCOS.length);assert.deepEqual(result[0],{id:'sobre',visivel:false});assert.equal(result[1].id,'banner');assert.equal(result.find(b=>b.id==='unidades').visivel,true);
});
