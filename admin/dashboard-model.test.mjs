import test from 'node:test';
import assert from 'node:assert/strict';
import { dashboardModel, dayNumber, csvCell } from './dashboard-model.js';
const now = Date.parse('2026-10-14T15:00:00-03:00');
const lead = (id, fields = {}) => ({ id, created_at: '2026-10-14T10:00:00-03:00', unit: 'Franca', pipeline_status: 'novo', ...fields });
test('período usa o dia de Brasília, exclui datas futuras e separa o anterior', () => {
  const data = [lead('today'), lead('boundary', {created_at:'2026-10-08T00:00:00-03:00'}), lead('previous', {created_at:'2026-10-08T02:59:59Z'}), lead('future', {created_at:'2026-10-15T10:00:00-03:00'})];
  const result = dashboardModel(data, {period:7, now});
  assert.deepEqual(result.recent.map(l=>l.id), ['today','boundary']);
  assert.deepEqual(result.previous.map(l=>l.id), ['previous']);
  assert.equal(result.buckets.reduce((sum,b)=>sum+b.count,0), 2);
  assert.equal(dayNumber('2026-10-08T02:59:59Z'), dayNumber('2026-10-07T12:00:00-03:00'));
});
test('fila de retornos inclui contatos antigos, filtra unidade e exclui encerrados', () => {
  const data = [lead('old', {created_at:'2026-08-01T12:00:00Z',next_followup_at:'2026-10-01T12:00:00Z'}),lead('closed', {pipeline_status:'concluido',next_followup_at:'2026-10-01T12:00:00Z'}),lead('other', {unit:'Ribeirão Preto',next_followup_at:'2026-10-01T12:00:00Z'})];
  const result=dashboardModel(data,{period:7,unit:'Franca',now});
  assert.deepEqual(result.overdue.map(l=>l.id),['old']);
  assert.equal(result.recent.length,1);
});
test('avaliações futuras ordenadas; cancelados e concluídos fora da fila',()=>{
  const result=dashboardModel([lead('later',{appointment_at:'2026-10-17T12:00:00Z'}),lead('first',{appointment_at:'2026-10-16T12:00:00Z'}),lead('lost',{appointment_at:'2026-10-16T12:00:00Z',pipeline_status:'perdido'})],{now});
  assert.deepEqual(result.appointments.map(l=>l.id),['first','later']);
});
test('90 dias não perdem leads nos limites dos agrupamentos',()=>{
  const data=Array.from({length:90},(_,i)=>lead(String(i),{created_at:new Date(now-i*86400000).toISOString()}));
  const result=dashboardModel(data,{period:90,now});
  assert.equal(result.buckets.length,13);
  assert.equal(result.buckets.reduce((sum,b)=>sum+b.count,0),90);
  assert.equal(result.buckets[12].count,6);
});
test('vazio e valor inválido não produzem resultados artificiais',()=>{
  const result=dashboardModel([],{period:'invalid',now});
  assert.equal(result.period,30);assert.equal(result.recent.length,0);assert.ok(result.buckets.every(b=>b.count===0));
});
test('CSV neutraliza fórmulas e escapa aspas',()=>{
  assert.equal(csvCell('=1+2'),'"\'=1+2"');
  assert.equal(csvCell(' \t@SUM(1)'),'"\' \t@SUM(1)"');
  assert.equal(csvCell('Nome "A"'),'"Nome ""A"""');
});
