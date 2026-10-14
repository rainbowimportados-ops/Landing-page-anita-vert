import { dashboardModel, DASHBOARD_STAGES, csvCell } from './dashboard-model.js';
import './dashboard.css';

const safe = (value = '') => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const names = Object.fromEntries(DASHBOARD_STAGES);
const number = value => value.toLocaleString('pt-BR');
const dateTime = value => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
const dayLabel = day => new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit' }).format(new Date(day * 86400000));
const source = l => String(l.utm_source || l.source_origin || 'Direto / não informado').replace(/^(landing|digital_card):/, '').replace(/^source=/, '').split(';')[0];
const interest = l => l.course_title || l.answers?.interesse || l.button || 'Contato';
const empty = text => `<p class="dash-empty">${safe(text)}</p>`;
const icon = path => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const icons = { add: icon('<path d="M12 5v14M5 12h14"/>'), refresh: icon('<path d="M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-1l2 6M4 12l2 6a7 7 0 0 0 12-1"/>'), download: icon('<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>') };

export function createDashboard({ getLeads, refresh, hasError }) {
  const root = document.querySelector('#ops-dashboard');
  const state = { unit: '', queue: 'overdue', queueLimit: 5, search: '', stage: '', page: 0, busy: false, updated: null };
  let model;
  function render() {
    if (hasError()) return;
    model = dashboardModel(getLeads(), { period: document.querySelector('#overview-period')?.value, unit: state.unit });
    const { recent, previous, overdue, appointments, newLeads, stages, buckets } = model;
    const units = [...new Set(getLeads().map(l => l.unit).filter(Boolean))].sort();
    const converted = stages.find(s => s.id === 'concluido').count;
    const ratio = recent.length ? `${(converted / recent.length * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : '—';
    const change = previous.length ? `${recent.length >= previous.length ? '+' : ''}${Math.round((recent.length - previous.length) / previous.length * 100)}% vs. período anterior` : 'Sem base no período anterior';
    const max = Math.max(1, ...buckets.map(b => b.count));
    const sources = new Map();
    recent.forEach(l => sources.set(source(l), (sources.get(source(l)) || 0) + 1));
    const sourceRows = [...sources].sort((a, b) => b[1] - a[1]);
    const topSources = sourceRows.slice(0, 4);
    if (sourceRows.length > 4) topSources.push(['Outras origens', sourceRows.slice(4).reduce((sum, row) => sum + row[1], 0)]);
    root.innerHTML = `
      <div class="dash-toolbar"><label>Unidade<select id="dashboard-unit"><option value="">Todas as unidades</option>${units.map(u => `<option${u === state.unit ? ' selected' : ''}>${safe(u)}</option>`).join('')}</select></label><div class="dash-toolbar-actions"><button type="button" class="button button--ghost" data-dashboard-action="refresh"${state.busy ? ' disabled' : ''}>${icons.refresh}${state.busy ? 'Atualizando…' : 'Atualizar'}</button><button type="button" class="button" data-dashboard-action="new">${icons.add}Novo lead</button></div></div>
      <div class="dash-context"><span>${dayLabel(model.firstDay)} a ${dayLabel(model.today)} · ${safe(state.unit || 'Todas as unidades')}</span><span id="dashboard-feedback" role="status">${state.updated ? `Atualizado às ${new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(state.updated)}` : 'Dados dos contatos cadastrados'}</span></div>
      <div class="dash-metrics" aria-label="Indicadores do período">
        <article><span>Leads recebidos</span><strong>${number(recent.length)}</strong><small>${change}</small></article>
        <article><span>Com avaliação marcada</span><strong>${number(recent.filter(l => l.appointment_at && l.pipeline_status !== 'perdido').length)}</strong><small>Dos leads recebidos no período</small></article>
        <article><span>Convertidos</span><strong>${number(converted)}</strong><small>Marcados como convertidos no CRM</small></article>
        <article><span>Taxa de conversão</span><strong>${ratio}</strong><small>Convertidos ÷ leads do período</small></article>
      </div>
      <div class="dash-work-grid"><section class="dash-section dash-priorities"><div class="dash-section-head"><div><h3>O que precisa de atenção</h3><p>Fila atual da unidade, independente do período.</p></div></div>
        <div class="dash-tabs" role="group" aria-label="Filtrar prioridades"><button type="button" data-queue="overdue" aria-pressed="${state.queue === 'overdue'}">Retornos vencidos <b>${overdue.length}</b></button><button type="button" data-queue="new" aria-pressed="${state.queue === 'new'}">Novos <b>${newLeads.length}</b></button><button type="button" data-queue="appointments" aria-pressed="${state.queue === 'appointments'}">Próximas avaliações <b>${appointments.length}</b></button></div><div id="dashboard-queue" tabindex="-1" aria-label="Fila de atendimento"></div>
      </section><section class="dash-section"><div class="dash-section-head"><div><h3>Distribuição por etapa</h3><p>Leads recebidos no período selecionado.</p></div><button type="button" class="dash-text-button" data-go="pipeline">Abrir pipeline</button></div><div class="dash-stage-list">${stages.map(s => `<button type="button" data-dashboard-stage="${s.id}" aria-label="Filtrar ${safe(s.label)}: ${s.count} leads"><span>${safe(s.label)}</span><strong>${s.count}</strong><i style="--bar:${recent.length ? Math.round(s.count / recent.length * 100) : 0}%"></i></button>`).join('')}</div></section></div>
      <div class="dash-analysis-grid"><section class="dash-section"><div class="dash-section-head"><div><h3>Evolução dos contatos</h3><p>${model.period === 90 ? 'Agrupados em intervalos de até 7 dias' : 'Recebidos por dia'} · horário de Brasília</p></div></div><div class="dash-chart" role="img" aria-label="${recent.length} leads no período. Valores disponíveis na tabela abaixo."><div class="dash-chart-axis"><span>${max}</span><span>0</span></div><div class="dash-chart-bars">${buckets.map((b, i) => `<div title="${dayLabel(b.start)}${b.end !== b.start ? ' a ' + dayLabel(b.end) : ''}: ${b.count} leads"><span style="height:${b.count / max * 100}%"></span><small>${i === 0 || i === buckets.length - 1 || i % Math.ceil(buckets.length / 5) === 0 ? dayLabel(b.start) : ''}</small></div>`).join('')}</div></div><details class="dash-chart-data"><summary>Ver valores do gráfico</summary><table><caption>Contatos recebidos</caption><thead><tr><th>Data</th><th>Leads</th></tr></thead><tbody>${buckets.map(b => `<tr><td>${dayLabel(b.start)}${b.end !== b.start ? ' a ' + dayLabel(b.end) : ''}</td><td>${b.count}</td></tr>`).join('')}</tbody></table></details></section>
      <section class="dash-section"><div class="dash-section-head"><div><h3>De onde chegam</h3><p>Origem registrada na captação.</p></div><button type="button" class="dash-text-button" data-go="origens">Ver origens</button></div><div class="dash-source-list">${topSources.map(([name, count]) => `<div><span>${safe(name)}</span><strong>${count} <small>· ${Math.round(count / recent.length * 100)}%</small></strong><i style="--bar:${count / recent.length * 100}%"></i></div>`).join('') || empty('Sem origens no período selecionado.')}</div></section></div>
      <section class="dash-section dash-contacts"><div class="dash-section-head"><div><h3>Contatos do período</h3><p>Abra uma ficha para atender, agendar ou registrar um retorno.</p></div><button type="button" class="button button--ghost" data-dashboard-action="export">${icons.download}Exportar CSV</button></div><div class="dash-contact-filters"><label>Buscar contato<input id="dashboard-search" type="search" placeholder="Nome, telefone ou interesse" value="${safe(state.search)}" autocomplete="off" /></label><label>Etapa<select id="dashboard-stage"><option value="">Todas as etapas</option>${DASHBOARD_STAGES.map(([id, label]) => `<option value="${id}"${id === state.stage ? ' selected' : ''}>${label}</option>`).join('')}</select></label></div><div id="dashboard-contacts"></div></section>
      <nav class="dash-shortcuts" aria-label="Gerenciar conteúdo"><strong>Site e conteúdo</strong><button type="button" data-go="site">Editar site</button><button type="button" data-go="casos">Antes e depois</button><button type="button" data-go="campanhas-crm">Campanhas</button><button type="button" data-go="relatorios">Relatórios</button></nav>
      <p class="dash-footnote">Conversão indica a etapa registrada no CRM; não representa faturamento. O comparativo usa os ${model.period} dias completos anteriores. Hoje é atualizado ao longo do dia.</p>`;
    renderQueue(); renderContacts();
  }
  function renderQueue() {
    const rows = state.queue === 'overdue' ? model.overdue : state.queue === 'new' ? model.newLeads : model.appointments;
    const dateKey = state.queue === 'overdue' ? 'next_followup_at' : state.queue === 'new' ? 'created_at' : 'appointment_at';
    root.querySelector('#dashboard-queue').innerHTML = rows.slice(0, state.queueLimit).map(l => `<button type="button" class="dash-queue-row" data-open-lead="${safe(l.id)}"><span class="dash-avatar">${safe((l.name || '?')[0])}</span><span><strong>${safe(l.name || 'Sem nome')}</strong><small>${safe(l.unit || 'Unidade a definir')} · ${safe(l.assigned_to || 'Sem responsável')}</small></span><time>${safe(dateTime(l[dateKey]))}</time></button>`).join('') || empty(state.queue === 'overdue' ? 'Nenhum retorno vencido. Mantenha o próximo contato registrado nas fichas.' : state.queue === 'new' ? 'Nenhum lead aguardando o primeiro atendimento.' : 'Nenhuma avaliação futura registrada.');
    if (rows.length > state.queueLimit) root.querySelector('#dashboard-queue').insertAdjacentHTML('beforeend', `<p class="dash-queue-more">Mostrando ${state.queueLimit} de ${rows.length}. <button type="button" class="dash-text-button" data-dashboard-action="more-queue">Mostrar mais 5</button></p>`);
  }
  function filtered() {
    const term = state.search.trim().toLocaleLowerCase('pt-BR');
    return model.recent.filter(l => (!state.stage || (l.pipeline_status || 'novo') === state.stage) && (!term || [l.name, l.phone, interest(l)].join(' ').toLocaleLowerCase('pt-BR').includes(term))).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  function renderContacts() {
    const rows = filtered();
    state.page = Math.min(state.page, Math.max(0, Math.ceil(rows.length / 8) - 1));
    root.querySelector('#dashboard-contacts').innerHTML = `<div class="dash-table-scroll"><table class="dash-table"><thead><tr><th>Contato</th><th>Interesse / unidade</th><th>Origem</th><th>Etapa</th><th>Recebido</th></tr></thead><tbody>${rows.slice(state.page * 8, state.page * 8 + 8).map(l => `<tr><td><button type="button" data-open-lead="${safe(l.id)}"><strong>${safe(l.name || 'Sem nome')}</strong><small>${safe(l.phone || 'Sem telefone')}</small></button></td><td>${safe(interest(l))}<small>${safe(l.unit || 'A definir')}</small></td><td>${safe(source(l))}</td><td><span class="dash-stage">${safe(names[l.pipeline_status || 'novo'] || 'Não definida')}</span></td><td>${safe(dateTime(l.created_at))}</td></tr>`).join('')}</tbody></table></div>${rows.length ? '' : empty('Nenhum contato corresponde aos filtros. Altere a busca, a etapa, a unidade ou o período.')}<div class="dash-pagination" tabindex="-1" aria-label="Paginação dos contatos"><span role="status">${rows.length ? state.page * 8 + 1 : 0}–${Math.min(rows.length, state.page * 8 + 8)} de ${rows.length} contatos</span><div><button type="button" data-dashboard-action="prev"${state.page === 0 ? ' disabled' : ''}>Anterior</button><button type="button" data-dashboard-action="next"${(state.page + 1) * 8 >= rows.length ? ' disabled' : ''}>Próxima</button></div></div>`;
  }
  root.addEventListener('input', event => { if (event.target.id === 'dashboard-search') { state.search = event.target.value; state.page = 0; renderContacts(); } });
  root.addEventListener('change', event => {
    if (event.target.id === 'dashboard-unit') { state.unit = event.target.value; state.page = 0; state.queueLimit = 5; render(); root.querySelector("#dashboard-unit").focus(); }
    if (event.target.id === 'dashboard-stage') { state.stage = event.target.value; state.page = 0; renderContacts(); }
  });
  root.addEventListener('click', async event => {
    const target = event.target.closest('button');
    if (!target) return;
    if (target.dataset.queue) { state.queue = target.dataset.queue; state.queueLimit = 5; root.querySelectorAll('[data-queue]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.queue === state.queue))); renderQueue(); }
    if (target.dataset.dashboardStage) { state.stage = target.dataset.dashboardStage; state.page = 0; root.querySelector('#dashboard-stage').value = state.stage; renderContacts(); root.querySelector('#dashboard-stage').focus(); }
    const action = target.dataset.dashboardAction;
    if (action === 'more-queue') { state.queueLimit += 5; renderQueue(); root.querySelector('[data-dashboard-action="more-queue"]')?.focus(); if (!root.querySelector('[data-dashboard-action="more-queue"]')) root.querySelector('#dashboard-queue').focus(); }
    if (action === 'new') document.querySelector('#ops-new-lead').showModal();
    if (action === 'prev' || action === 'next') { state.page += action === 'prev' ? -1 : 1; renderContacts(); const nextFocus = root.querySelector(`[data-dashboard-action="${action}"]:not(:disabled)`) || root.querySelector('.dash-pagination button:not(:disabled)') || root.querySelector('.dash-pagination'); nextFocus.focus(); }
    if (action === 'refresh') {
      if (state.busy) return;
      state.busy = true; state.updated = null; render();
      try { await refresh(); if (!hasError()) state.updated = new Date(); }
      catch { root.querySelector('#dashboard-feedback').textContent = 'Falha ao atualizar. Tente novamente.'; }
      finally { state.busy = false; if (!hasError()) { target.disabled = false; const button = root.querySelector('[data-dashboard-action="refresh"]'); if (button) { button.disabled = false; button.innerHTML = icons.refresh + 'Atualizar'; } if (state.updated) root.querySelector('#dashboard-feedback').textContent = 'Dados atualizados agora'; } root.querySelector('[data-dashboard-action="refresh"]')?.focus(); }
    }
    if (action === 'export') {
      const rows = filtered();
      const headers = ['Nome', 'Telefone', 'Interesse', 'Unidade', 'Origem', 'Etapa', 'Recebido em', 'Responsável'];
      const content = [headers, ...rows.map(l => [l.name, l.phone, interest(l), l.unit, source(l), names[l.pipeline_status || 'novo'], l.created_at, l.assigned_to])].map(row => row.map(csvCell).join(';')).join('\r\n');
      const url = URL.createObjectURL(new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a'); a.href = url; a.download = `contatos-vert-${model.period}-dias.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      root.querySelector('#dashboard-feedback').textContent = `${rows.length} contatos exportados com os filtros atuais.`;
    }
  });
  return { render };
}
