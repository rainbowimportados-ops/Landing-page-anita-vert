/** Existing capture paths. This catalog does not create or duplicate forms. */
export const existingFlows = [
  {id:'appointment',name:'Avaliações e novos pacientes',channels:'Site e cartão',types:['appointment','contact'],href:'/cartao/#contato',editor:'links',editorLabel:'Editar atendimento',fields:'Nome, WhatsApp, interesse, unidade, profissão e Instagram.'},
  {id:'patient',name:'Já sou paciente',channels:'Site e cartão',types:['patient'],href:'/cartao/#contato',editor:'links',editorLabel:'Editar atendimento',fields:'Nome, WhatsApp, situação do paciente, atendimento e unidade.'},
  {id:'formation',name:'Cursos e formações',channels:'Site e cartão',types:['formation'],href:'/cartao/#formacoes',editor:'formacoes',editorLabel:'Editar cursos',fields:'Curso, perfil profissional, cidade, experiência anterior e Instagram.'},
  {id:'rental',name:'Locação de consultório',channels:'Site e cartão',types:['rental'],href:'/cartao/#service-actions',editor:'links',editorLabel:'Editar contatos',fields:'Profissão, cidade, finalidade, frequência de uso e Instagram.'},
  {id:'close_friends',name:'Close Friends',channels:'Cartão',types:['close_friends'],href:'/cartao/#service-actions',editor:'links',editorLabel:'Editar contatos',fields:'Perfil, cidade, assunto de interesse e Instagram.'},
];
const labels={perfil:'Perfil profissional',cidade:'Cidade',profissao:'Profissão',ja_fez_curso:'Já fez curso',interesse:'Interesse',finalidade:'Finalidade da locação',frequencia:'Frequência de uso',situacao:'Situação do paciente',unidade:'Unidade',periodo_graduacao:'Período da graduação',mensagem:'Mensagem',email:'E-mail',instagram:'Instagram'};
const values={pontual:'Uso pontual',semanal:'Semanalmente',mensal:'Mensalmente',atual:'Já é paciente',novo:'Novo paciente',dentista:'Dentista',estudante:'Estudante',saude:'Profissional da saúde',yes:'Sim',no:'Não'};
function display(value){if(typeof value==='boolean')return value?'Sim':'Não';if(typeof value==='object')return JSON.stringify(value);return values[value]||String(value);}
export function contactResponses(lead={}) {
  const answers=lead.answers&&typeof lead.answers==='object'&&!Array.isArray(lead.answers)?lead.answers:{};
  const rows=Object.entries(answers).filter(([,v])=>v!==null&&v!==undefined&&v!=='').map(([key,value])=>({label:labels[key]||key.replace(/_/g,' '),value:display(value)}));
  for(const [key,label] of [['course_title','Curso de interesse'],['has_previous_course','Já fez curso'],['is_dentist','É dentista'],['age_range','Faixa etária'],['gender','Gênero']]){
    const value=lead[key];if(value!==null&&value!==undefined&&value!==''&&!rows.some(r=>r.label===label))rows.push({label,value:display(value)});
  }
  return rows;
}
export function flowCount(flow,leads){return leads.filter(l=>flow.types.includes(l.lead_type)).length;}
