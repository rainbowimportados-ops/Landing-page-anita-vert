import test from 'node:test';
import assert from 'node:assert/strict';
import {existingFlows,contactResponses,flowCount} from './continuity-model.js';
test('catalog preserves all five existing capture audiences without duplicating data',()=>{
 assert.deepEqual(existingFlows.map(f=>f.id),['appointment','patient','formation','rental','close_friends']);
 const leads=['appointment','contact','patient','formation','rental','close_friends'].map(lead_type=>({lead_type}));
 assert.equal(existingFlows.reduce((n,f)=>n+flowCount(f,leads),0),leads.length);
});
test('responses preserve false, older course fields and unknown answers',()=>{
 const rows=contactResponses({answers:{cidade:'Franca',ja_fez_curso:false,frequencia:'semanal',campo_antigo:'Preservado',vazio:''},has_previous_course:false,is_dentist:false,course_title:'Resina'});
 assert.equal(rows.find(r=>r.label==='Já fez curso').value,'Não');assert.equal(rows.filter(r=>r.label==='Já fez curso').length,1);
 assert.equal(rows.find(r=>r.label==='campo antigo').value,'Preservado');assert.equal(rows.find(r=>r.label==='Frequência de uso').value,'Semanalmente');assert.equal(rows.find(r=>r.label==='Curso de interesse').value,'Resina');
});
test('missing answers are handled without fabricating patient details',()=>{assert.deepEqual(contactResponses({answers:null}),[]);});
