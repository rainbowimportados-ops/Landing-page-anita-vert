const stages = [
  ['novo', 'Novo'], ['em_contato', 'Em contato'], ['agendado', 'Avaliação agendada'],
  ['concluido', 'Convertido'], ['perdido', 'Perdido'],
];
const stageName = Object.fromEntries(stages);
const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const dateOnly = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' });
const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
const safe = (value = '') => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const phone = (value) => String(value || '').replace(/\D/g, '');
const date = (value) => value ? dateTime.format(new Date(value)) : 'Não definido';
const origin = (lead) => {
  const raw = String(lead.source_origin || '');
  if (!raw) return 'Direto/antigo';
  return raw.replace(/^(landing|digital_card):/, '').replace(/^source=/, '').split(';')[0] || 'Direto/antigo';
};
const interest = (lead) => lead.course_title || lead.answers?.interesse || lead.button || 'Contato';
const empty = (title, text = '') => `<div class="ops-empty"><strong>${safe(title)}</strong><p>${safe(text)}</p></div>`;
const csv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export function initOperations({ supabase, refresh, activatePanel, getSession }) {
  let leads = [];
  let campaigns = [];
  let selectedId = null;
  let tab = 'dados';
  let agendaDate = new Date();

  function setLeads(value) {
    leads = value || [];
    renderAll();
  }
  function renderAll() {
    renderDashboard(); renderPipeline(); renderEvaluations(); renderPatients(); renderAgenda();
    renderCampaigns(); renderOrigins(); renderReports(); renderTeam();
    if (selectedId && document.querySelector('#ops-lead-detail').open) renderDetail();
  }
  function activate(section) {
    if (section === 'campanhas-crm') void loadCampaigns();
    if (section === 'equipe') renderTeam();
    if (section === 'pipeline') renderPipeline();
    if (section === 'relatorios') renderReports();
  }
  async function updateLead(id, changes) {
    const { data, error } = await supabase.from('digital_card_leads')
      .update({ ...changes, updated_at: new Date().toISOString() }).eq('id', id).select('id').single();
    if (error || !data) throw new Error(error?.message || 'Não foi possível salvar este lead.');
    leads = leads.map((lead) => lead.id === id ? { ...lead, ...changes } : lead);
    renderAll();
    void refresh();
  }
  function renderDashboard() {
    const since = Date.now() - 30 * 86400000;
    const recent = leads.filter((lead) => new Date(lead.created_at).getTime() >= since);
    const scheduled = leads.filter((lead) => lead.appointment_at && new Date(lead.appointment_at).getTime() >= since);
    const converted = recent.filter((lead) => lead.pipeline_status === 'concluido');
    const followups = leads.filter((lead) => lead.next_followup_at && new Date(lead.next_followup_at) <= new Date() && !['concluido','perdido'].includes(lead.pipeline_status));
    const top = recent.slice(0, 5).map((lead) => `<button type="button" class="ops-recent" data-open-lead="${safe(lead.id)}"><span class="ops-avatar">${safe(lead.name?.[0] || '?')}</span><span><strong>${safe(lead.name)}</strong><small>${safe(interest(lead))} · ${safe(lead.unit || 'Sem unidade')}</small></span><em>${safe(stageName[lead.pipeline_status || 'novo'])}</em></button>`).join('');
    document.querySelector('#ops-dashboard').innerHTML = `<div class="ops-stat-grid">
      <button type="button" data-go="contatos"><span>Novos leads</span><strong>${recent.length}</strong><small>Enviados nos últimos 30 dias</small></button>
      <button type="button" data-go="pipeline"><span>Em atendimento</span><strong>${leads.filter((l) => l.pipeline_status === 'em_contato').length}</strong><small>Conversas em andamento</small></button>
      <button type="button" data-go="agenda"><span>Avaliações agendadas</span><strong>${scheduled.length}</strong><small>Com data registrada</small></button>
      <button type="button" data-go="relatorios"><span>Convertidos</span><strong>${converted.length}</strong><small>Leads novos no período</small></button>
    </div><div class="ops-dashboard-grid"><div class="ops-surface"><div class="ops-section-head"><h3>Últimos leads</h3><button type="button" data-go="contatos">Ver todos →</button></div>${top || empty('Nenhum lead recente')}</div><div class="ops-surface"><div class="ops-section-head"><h3>Próximos passos</h3></div><p class="ops-large-count">${followups.length}</p><p class="ops-muted">${followups.length === 1 ? 'retorno vencido' : 'retornos vencidos'}</p><button type="button" class="ops-link-button" data-go="contatos" data-followups>Ver retornos →</button></div></div>`;
  }
  function filteredPipeline() {
    const term = document.querySelector('#pipeline-search').value.trim().toLowerCase();
    const unit = document.querySelector('#pipeline-unit').value;
    return leads.filter((lead) => (unit === 'all' || lead.unit === unit) && (!term || [lead.name, lead.phone, interest(lead)].join(' ').toLowerCase().includes(term)));
  }
  function renderPipeline() {
    const filtered = filteredPipeline();
    document.querySelector('#pipeline-board').innerHTML = stages.map(([status, label]) => {
      const items = filtered.filter((lead) => (lead.pipeline_status || 'novo') === status);
      return `<div class="pipeline-column" data-drop-stage="${status}"><div class="pipeline-column__head"><h3>${label}</h3><span>${items.length}</span></div><div class="pipeline-column__cards">${items.map((lead) => `<button type="button" draggable="true" class="pipeline-card" data-open-lead="${safe(lead.id)}" data-drag-lead="${safe(lead.id)}"><span class="ops-avatar">${safe(lead.name?.[0] || '?')}</span><strong>${safe(lead.name)}</strong><small>${safe(interest(lead))} · ${safe(lead.unit || 'Sem unidade')}</small><time>${safe(date(lead.created_at))}</time></button>`).join('') || '<p class="pipeline-empty">Solte um lead aqui</p>'}</div></div>`;
    }).join('');
  }
  function renderEvaluations() {
    const scheduled = leads.filter((l) => l.appointment_at && !['perdido'].includes(l.pipeline_status)).sort((a,b) => new Date(a.appointment_at) - new Date(b.appointment_at));
    document.querySelector('#evaluations-list').innerHTML = scheduled.length ? scheduled.map((lead) => `<button type="button" class="ops-list-row" data-open-lead="${safe(lead.id)}"><span><strong>${safe(lead.name)}</strong><small>${safe(interest(lead))} · ${safe(lead.unit || 'Unidade a definir')}</small></span><span>${safe(date(lead.appointment_at))}</span><em>${safe(stageName[lead.pipeline_status || 'novo'])}</em></button>`).join('') : empty('Nenhuma avaliação agendada', 'Abra a ficha de um lead e registre o horário combinado.');
  }
  function renderPatients() {
    const patientLeads = leads.filter((l) => ['appointment','patient','contact'].includes(l.lead_type));
    document.querySelector('#patients-list').innerHTML = patientLeads.length ? patientLeads.map((lead) => `<button type="button" class="ops-list-row" data-open-lead="${safe(lead.id)}"><span><strong>${safe(lead.name)}</strong><small>${safe(interest(lead))} · ${safe(lead.unit || 'Sem unidade')} · ${safe(origin(lead))}</small></span><em>${safe(stageName[lead.pipeline_status || 'novo'])}</em></button>`).join('') : empty('Nenhum contato de paciente ainda');
  }
  function renderAgenda() {
    const year = agendaDate.getFullYear(), month = agendaDate.getMonth();
    document.querySelector('#agenda-month').textContent = monthName.format(agendaDate);
    const start = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const scheduled = leads.filter((l) => l.appointment_at && new Date(l.appointment_at).getMonth() === month && new Date(l.appointment_at).getFullYear() === year);
    const cells = Array.from({ length: start }, () => '<span class="agenda-day is-blank"></span>');
    for (let day = 1; day <= days; day++) {
      const items = scheduled.filter((l) => new Date(l.appointment_at).getDate() === day);
      cells.push(`<div class="agenda-day${items.length ? ' has-items' : ''}"><strong>${day}</strong>${items.slice(0, 3).map((l) => `<button type="button" data-open-lead="${safe(l.id)}" title="${safe(l.name)}">${safe(new Date(l.appointment_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}))} ${safe(l.name)}</button>`).join('')}${items.length > 3 ? `<small>+${items.length - 3}</small>` : ''}</div>`);
    }
    document.querySelector('#agenda-calendar').innerHTML = '<div class="agenda-weekdays"><span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span></div><div class="agenda-grid">' + cells.join('') + '</div>';
    document.querySelector('#agenda-list').innerHTML = scheduled.length ? scheduled.sort((a,b) => new Date(a.appointment_at) - new Date(b.appointment_at)).map((l) => `<button type="button" class="ops-list-row" data-open-lead="${safe(l.id)}"><span><strong>${safe(l.name)}</strong><small>${safe(l.unit || 'Unidade a definir')} · ${safe(interest(l))}</small></span><span>${safe(date(l.appointment_at))}</span></button>`).join('') : empty('Sem avaliações neste mês');
  }
  async function loadCampaigns() {
    const { data, error } = await supabase.from('site_campaigns').select('id,name,slug,destination,status,created_at').order('created_at',{ascending:false});
    if (error) { document.querySelector('#campaign-list').innerHTML = empty('Não foi possível carregar campanhas', error.message); return; }
    campaigns = data || []; renderCampaigns();
  }
  function campaignLink(c) {
    const path = c.destination === 'digital_card' ? '/cartao/' : '/';
    return `${window.location.origin}${path}?utm_source=${encodeURIComponent(c.slug)}&utm_medium=campaign&utm_campaign=${encodeURIComponent(c.slug)}`;
  }
  function renderCampaigns() {
    document.querySelector('#campaign-list').innerHTML = campaigns.length ? campaigns.map((c) => {
      const count = leads.filter((l) => origin(l) === c.slug).length;
      return `<article class="ops-list-row ops-campaign"><span><strong>${safe(c.name)}</strong><small>${safe(c.destination === 'digital_card' ? 'Cartão' : 'Site')} · ${safe(c.slug)}</small><a href="${safe(campaignLink(c))}" target="_blank" rel="noopener">${safe(campaignLink(c))}</a></span><span><strong>${count}</strong><small>leads</small></span><em class="ops-pill">${c.status === 'active' ? 'Ativa' : 'Pausada'}</em><div><button type="button" data-copy-campaign="${safe(c.id)}">Copiar link</button><button type="button" data-toggle-campaign="${safe(c.id)}">${c.status === 'active' ? 'Marcar pausada' : 'Marcar ativa'}</button></div></article>`;
    }).join('') : empty('Nenhuma campanha cadastrada', 'Crie um link de campanha para medir os leads enviados.');
  }
  function renderOrigins() {
    const counts = new Map();
    leads.forEach((lead) => counts.set(origin(lead), (counts.get(origin(lead)) || 0) + 1));
    document.querySelector('#origins-list').innerHTML = [...counts].sort((a,b)=>b[1]-a[1]).map(([name,count])=>`<div class="ops-list-row"><span><strong>${safe(name)}</strong><small>${safe(Math.round(count / Math.max(leads.length, 1) * 100))}% dos contatos</small></span><strong>${count} leads</strong></div>`).join('') || empty('Nenhuma origem registrada');
  }
  function reportLeads() {
    const value = document.querySelector('#report-period').value;
    if (value === 'all') return leads;
    const since = Date.now() - Number(value) * 86400000;
    return leads.filter((l) => new Date(l.created_at).getTime() >= since);
  }
  function renderReports() {
    const data = reportLeads();
    const categories = [['Paciente', ['appointment','patient','contact']],['Cursos',['formation']],['Locação',['rental']],['Close Friends',['close_friends']]];
    const byStage = stages.map(([status,label])=>`<div class="ops-report-row"><span>${label}</span><strong>${data.filter(l=>(l.pipeline_status||'novo')===status).length}</strong></div>`).join('');
    document.querySelector('#reports-content').innerHTML = `<div class="ops-stat-grid"><div><span>Leads recebidos</span><strong>${data.length}</strong></div><div><span>Em contato</span><strong>${data.filter(l=>l.pipeline_status==='em_contato').length}</strong></div><div><span>Avaliações com data</span><strong>${data.filter(l=>l.appointment_at).length}</strong></div><div><span>Convertidos</span><strong>${data.filter(l=>l.pipeline_status==='concluido').length}</strong></div></div><div class="ops-dashboard-grid"><div class="ops-surface"><h3>Etapas</h3>${byStage}</div><div class="ops-surface"><h3>Interesses</h3>${categories.map(([label,types])=>`<div class="ops-report-row"><span>${label}</span><strong>${data.filter(l=>types.includes(l.lead_type)).length}</strong></div>`).join('')}</div></div><p class="ops-muted">Conversão = lead marcado como concluído neste painel. Não representa faturamento ou consulta clínica realizada.</p>`;
  }
  function renderTeam() {
    document.querySelector('#team-list').innerHTML = `<div class="ops-list-row"><span><strong>${safe(getSession()?.user?.email || 'Conta da diretoria')}</strong><small>Conta autenticada · acesso administrativo</small></span><span class="ops-pill">Diretoria</span></div><p class="ops-muted">O acesso ao conteúdo e aos dados dos leads é controlado no banco pela lista de administradores autorizados. Convites de equipe não estão habilitados nesta versão.</p>`;
  }
  async function openDetail(id) {
    selectedId = id; tab = 'dados';
    document.querySelector('#ops-lead-detail').showModal();
    renderDetail();
  }
  async function renderDetail() {
    const lead = leads.find((l) => l.id === selectedId);
    if (!lead) return;
    document.querySelector('#ops-detail-title').textContent = lead.name;
    document.querySelector('#ops-detail-subtitle').textContent = `${interest(lead)} · ${lead.unit || 'Sem unidade'} · recebido em ${date(lead.created_at)}`;
    document.querySelector('#ops-detail-actions').innerHTML = `<a href="https://wa.me/${phone(lead.phone)}" target="_blank" rel="noopener noreferrer">WhatsApp ↗</a><a href="tel:${phone(lead.phone)}">Ligar</a><button type="button" data-detail-tab="dados" data-focus-appointment>Agendar</button>`;
    document.querySelectorAll('.ops-tabs button').forEach((b)=>b.classList.toggle('is-active',b.dataset.detailTab===tab));
    const body = document.querySelector('#ops-detail-body');
    if (tab === 'dados') {
      const localTime = lead.appointment_at ? new Date(new Date(lead.appointment_at).getTime()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16) : '';
      body.innerHTML = `<div class="ops-data-grid"><div><small>Telefone</small><strong>${safe(lead.phone)}</strong></div><div><small>Interesse</small><strong>${safe(interest(lead))}</strong></div><div><small>Unidade</small><strong>${safe(lead.unit || 'A definir')}</strong></div><div><small>Origem</small><strong>${safe(origin(lead))}</strong></div><div><small>Profissão</small><strong>${safe(lead.profession || 'Não informada')}</strong></div><div><small>Instagram</small><strong>${safe(lead.instagram_handle || 'Não informado')}</strong></div></div><form id="ops-detail-form"><div class="ops-form-grid"><label>Etapa<select name="pipeline_status">${stages.map(([v,l])=>`<option value="${v}"${(lead.pipeline_status||'novo')===v?' selected':''}>${l}</option>`).join('')}</select></label><label>Próximo retorno<input type="datetime-local" name="next_followup_at" value="${lead.next_followup_at ? new Date(new Date(lead.next_followup_at).getTime()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16) : ''}" /></label><label>Data da avaliação<input id="ops-appointment-input" type="datetime-local" name="appointment_at" value="${localTime}" /></label><label>Responsável<input name="assigned_to" maxlength="100" value="${safe(lead.assigned_to||'')}" placeholder="Nome da equipe" /></label></div><p class="ops-feedback" id="ops-detail-feedback" role="status"></p><button class="button" type="submit">Salvar atendimento</button></form>`;
    } else if (tab === 'notas') {
      body.innerHTML = `<form id="ops-note-form"><label class="ops-note-label">Notas internas<textarea name="internal_notes" rows="6" maxlength="2000" placeholder="Registre o que foi combinado e o próximo passo">${safe(lead.internal_notes||'')}</textarea></label><p class="ops-feedback" id="ops-note-feedback" role="status"></p><button type="submit" class="button">Salvar nota</button></form>`;
    } else if (tab === 'historico') {
      body.innerHTML = empty('Carregando histórico…');
      const { data,error } = await supabase.from('site_lead_activity').select('kind,detail,created_at').eq('lead_id',selectedId).order('created_at',{ascending:false}).limit(100);
      if (selectedId !== lead.id || tab !== 'historico') return;
      body.innerHTML = error ? empty('Não foi possível carregar',error.message) : (data?.length ? data.map((item)=>`<div class="ops-timeline"><time>${safe(date(item.created_at))}</time><strong>${safe(({created:'Contato recebido',stage:'Etapa alterada',appointment:'Avaliação atualizada',note:'Nota registrada'})[item.kind]||item.kind)}</strong><p>${safe(item.kind==='stage' ? stageName[item.detail]||item.detail : item.detail||'')}</p></div>`).join('') : empty('Nenhuma atualização registrada ainda'));
    } else if (tab === 'tarefas') {
      body.innerHTML = empty('Carregando tarefas…');
      const { data,error } = await supabase.from('site_lead_tasks').select('id,title,due_at,completed_at,created_at').eq('lead_id',selectedId).order('created_at',{ascending:false});
      if (selectedId !== lead.id || tab !== 'tarefas') return;
      body.innerHTML = `<form id="ops-task-form" class="ops-task-form"><input name="title" required minlength="2" maxlength="180" placeholder="Nova tarefa, ex.: confirmar horário" aria-label="Nova tarefa" /><input name="due_at" type="datetime-local" aria-label="Prazo" /><button type="submit" class="button">Adicionar</button></form>${error ? empty('Não foi possível carregar',error.message) : (data?.length ? data.map((item)=>`<div class="ops-task"><label><input type="checkbox" data-task-toggle="${safe(item.id)}" ${item.completed_at?'checked':''} /><span>${safe(item.title)}</span></label><small>${item.due_at ? safe(date(item.due_at)) : 'Sem prazo'}</small><button type="button" data-task-delete="${safe(item.id)}" aria-label="Excluir tarefa">×</button></div>`).join('') : empty('Nenhuma tarefa cadastrada'))}`;
    }
  }
  document.querySelectorAll('[data-close-dialog]').forEach((button)=>button.addEventListener('click',()=>document.getElementById(button.dataset.closeDialog).close()));
  document.querySelectorAll('[data-new-lead]').forEach((button)=>button.addEventListener('click',()=>document.querySelector('#ops-new-lead').showModal()));
  document.querySelector('#new-campaign').addEventListener('click',()=>document.querySelector('#ops-campaign-dialog').showModal());
  document.querySelector('#ops-campaign-form [name="name"]').addEventListener('input',(event)=>{
    const slug=document.querySelector('#ops-campaign-form [name="slug"]');
    if(slug.dataset.edited==='true')return;
    slug.value=event.target.value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60);
  });
  document.querySelector('#ops-campaign-form [name="slug"]').addEventListener('input',(event)=>{event.target.dataset.edited='true';});
  document.querySelector('#pipeline-search').addEventListener('input',renderPipeline);
  document.querySelector('#pipeline-unit').addEventListener('change',renderPipeline);
  document.querySelector('#report-period').addEventListener('change',renderReports);
  document.querySelector('#agenda-prev').addEventListener('click',()=>{ agendaDate=new Date(agendaDate.getFullYear(),agendaDate.getMonth()-1,1);renderAgenda(); });
  document.querySelector('#agenda-next').addEventListener('click',()=>{ agendaDate=new Date(agendaDate.getFullYear(),agendaDate.getMonth()+1,1);renderAgenda(); });
  document.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-open-lead],[data-go],[data-detail-tab],[data-copy-campaign],[data-toggle-campaign],[data-task-delete]');
    if (!target) return;
    if (target.dataset.openLead) { await openDetail(target.dataset.openLead); if (target.dataset.focusAppointment) document.querySelector('#ops-appointment-input')?.focus(); return; }
    if (target.dataset.go) { activatePanel(target.dataset.go,true); if (target.hasAttribute('data-followups')) { document.querySelector('#lead-stage-filter').value='followup'; document.querySelector('#lead-stage-filter').dispatchEvent(new Event('change')); } return; }
    if (target.dataset.detailTab) { tab=target.dataset.detailTab; renderDetail(); if (target.hasAttribute('data-focus-appointment')) document.querySelector('#ops-appointment-input')?.focus(); return; }
    if (target.dataset.copyCampaign) { const c=campaigns.find(x=>x.id===target.dataset.copyCampaign); if(c) { try { await navigator.clipboard.writeText(campaignLink(c)); target.textContent='Copiado'; } catch { window.prompt('Copie o link:',campaignLink(c)); } } return; }
    if (target.dataset.toggleCampaign) { const c=campaigns.find(x=>x.id===target.dataset.toggleCampaign); if(!c)return; const {error}=await supabase.from('site_campaigns').update({status:c.status==='active'?'paused':'active',updated_at:new Date().toISOString()}).eq('id',c.id); if(error)window.alert(error.message);else void loadCampaigns(); return; }
    if (target.dataset.taskDelete) { const {error}=await supabase.from('site_lead_tasks').delete().eq('id',target.dataset.taskDelete); if(error)window.alert(error.message);else renderDetail(); }
  });
  document.querySelector('#pipeline-board').addEventListener('dragstart',(event)=>{const id=event.target.closest('[data-drag-lead]')?.dataset.dragLead;if(id)event.dataTransfer.setData('text/plain',id);});
  document.querySelector('#pipeline-board').addEventListener('dragover',(event)=>{if(event.target.closest('[data-drop-stage]'))event.preventDefault();});
  document.querySelector('#pipeline-board').addEventListener('drop',async(event)=>{const stage=event.target.closest('[data-drop-stage]')?.dataset.dropStage,id=event.dataTransfer.getData('text/plain');if(!stage||!id||!stageName[stage])return;event.preventDefault();try{await updateLead(id,{pipeline_status:stage});}catch(e){window.alert(e.message);}});
  document.querySelector('#ops-lead-detail').addEventListener('submit',async(event)=>{
    event.preventDefault();const form=event.target, data=new FormData(form);let changes;
    if(form.id==='ops-detail-form')changes={pipeline_status:data.get('pipeline_status'),next_followup_at:data.get('next_followup_at')?new Date(data.get('next_followup_at')).toISOString():null,appointment_at:data.get('appointment_at')?new Date(data.get('appointment_at')).toISOString():null,assigned_to:String(data.get('assigned_to')||'').trim()||null};
    else if(form.id==='ops-note-form')changes={internal_notes:String(data.get('internal_notes')||'').trim()||null};
    else if(form.id==='ops-task-form'){const title=String(data.get('title')||'').trim();const {error}=await supabase.from('site_lead_tasks').insert({lead_id:selectedId,title,due_at:data.get('due_at')?new Date(data.get('due_at')).toISOString():null});if(error)window.alert(error.message);else renderDetail();return;}
    else return;
    const button=form.querySelector('button[type="submit"]');button.disabled=true;
    try{await updateLead(selectedId,changes);renderDetail();}catch(e){const feedback=form.querySelector('.ops-feedback');if(feedback)feedback.textContent=e.message;}finally{button.disabled=false;}
  });
  document.querySelector('#ops-lead-detail').addEventListener('change',async(event)=>{const id=event.target.dataset.taskToggle;if(!id)return;const {error}=await supabase.from('site_lead_tasks').update({completed_at:event.target.checked?new Date().toISOString():null}).eq('id',id);if(error){window.alert(error.message);event.target.checked=!event.target.checked;}});
  document.querySelector('#ops-new-lead-form [name="lead_type"]').addEventListener('change',(event)=>{
    const profession=document.querySelector('#ops-new-lead-form [name="profession"]');
    const rental=event.target.value==='rental';
    profession.required=rental;
    profession.querySelector('option[value="Estudante"]').disabled=rental;
    if(rental && profession.value==='Estudante')profession.value='';
  });
  document.querySelector('#ops-new-lead-form').addEventListener('submit',async(event)=>{
    event.preventDefault();const form=event.target,data=new FormData(form),feedback=document.querySelector('#ops-new-lead-feedback');
    const digits=phone(data.get('phone'));if(digits.length<10||digits.length>13){feedback.textContent='Informe um telefone válido com DDD.';return;}
    const kind=String(data.get('lead_type'));
    const profession=String(data.get('profession')||'');
    if(kind==='rental' && !['Dentista','Profissional da saúde'].includes(profession)){feedback.textContent='A locação é exclusiva para dentistas e profissionais da saúde.';return;}
    const payload={nome:String(data.get('name')).trim(),telefone:digits,intencao:({appointment:'avaliacao',formation:'curso',rental:'locacao',close_friends:'close_friends'})[kind],tipo_painel:kind,superficie:'digital_card',unidade:data.get('unit')==='Ribeirão Preto'?'ribeirao-preto':data.get('unit')==='Franca'?'franca':null,profissao:profession||null,respostas:kind==='rental'?{perfil:profession}:{},rotulo:'Cadastro manual',referrer:'painel',consentimento:data.get('consent')==='on'};
    const button=form.querySelector('button[type="submit"]');button.disabled=true;feedback.textContent='Salvando…';
    const {data:result,error}=await supabase.rpc('site_capturar_lead',{p:payload});
    button.disabled=false;if(error||!result?.ok){feedback.textContent=error?.message||`Não foi possível salvar: ${result?.erro||'verifique os dados'}.`;return;}
    form.reset();form.elements.profession.required=false;form.elements.profession.querySelector('option[value="Estudante"]').disabled=false;
    feedback.textContent='';document.querySelector('#ops-new-lead').close();await refresh();activatePanel('pipeline',true);
  });
  document.querySelector('#ops-campaign-form').addEventListener('submit',async(event)=>{
    event.preventDefault();const form=event.target,data=new FormData(form),feedback=document.querySelector('#ops-campaign-feedback');
    const button=form.querySelector('button[type="submit"]');button.disabled=true;feedback.textContent='Salvando…';
    const {error}=await supabase.from('site_campaigns').insert({name:String(data.get('name')).trim(),slug:String(data.get('slug')).trim().toLowerCase(),destination:data.get('destination')});
    button.disabled=false;if(error){feedback.textContent=error.message;return;}form.reset();form.elements.slug.dataset.edited='false';feedback.textContent='';document.querySelector('#ops-campaign-dialog').close();void loadCampaigns();
  });
  document.querySelector('#report-export').addEventListener('click',()=>{
    const data=reportLeads(),header=['Nome','Telefone','Interesse','Unidade','Origem','Etapa','Recebido em','Avaliação','Responsável'];
    const rows=data.map(l=>[l.name,l.phone,interest(l),l.unit,origin(l),stageName[l.pipeline_status||'novo'],l.created_at,l.appointment_at,l.assigned_to]);
    const url=URL.createObjectURL(new Blob(['\uFEFF'+[header,...rows].map(row=>row.map(csv).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`relatorio-vert-${new Date().toISOString().slice(0,10)}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  renderAll();
  return { setLeads, activate, loadCampaigns, renderAll };
}
