export const DASHBOARD_STAGES = [['novo', 'Novo'], ['em_contato', 'Em contato'], ['agendado', 'Avaliação agendada'], ['concluido', 'Convertido'], ['perdido', 'Perdido']];
const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' });
export function dayNumber(value) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return NaN;
  const parts = Object.fromEntries(dayFormatter.formatToParts(new Date(timestamp)).map(p => [p.type, p.value]));
  return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)) / 86400000;
}
export function dashboardModel(leads, { period = 30, unit = '', now = Date.now() } = {}) {
  period = [7, 30, 90].includes(Number(period)) ? Number(period) : 30;
  const today = dayNumber(now), firstDay = today - period + 1;
  const scoped = leads.filter(l => !unit || (l.unit || '') === unit);
  const recent = scoped.filter(l => dayNumber(l.created_at) >= firstDay && new Date(l.created_at).getTime() <= now);
  const previous = scoped.filter(l => dayNumber(l.created_at) >= firstDay - period && dayNumber(l.created_at) < firstDay);
  const open = scoped.filter(l => !['concluido', 'perdido'].includes(l.pipeline_status));
  const overdue = open.filter(l => l.next_followup_at && new Date(l.next_followup_at).getTime() <= now).sort((a, b) => new Date(a.next_followup_at) - new Date(b.next_followup_at));
  const appointments = open.filter(l => l.appointment_at && new Date(l.appointment_at).getTime() >= now).sort((a, b) => new Date(a.appointment_at) - new Date(b.appointment_at));
  const newLeads = open.filter(l => !l.pipeline_status || l.pipeline_status === 'novo').sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const bucketSize = period === 90 ? 7 : 1;
  const buckets = Array.from({ length: Math.ceil(period / bucketSize) }, (_, i) => ({ start: firstDay + i * bucketSize, end: Math.min(today, firstDay + (i + 1) * bucketSize - 1), count: 0 }));
  recent.forEach(l => { const bucket = buckets[Math.floor((dayNumber(l.created_at) - firstDay) / bucketSize)]; if (bucket) bucket.count++; });
  const stages = DASHBOARD_STAGES.map(([id, label]) => ({ id, label, count: recent.filter(l => (l.pipeline_status || 'novo') === id).length }));
  return { period, recent, previous, scoped, overdue, appointments, newLeads, buckets, stages, today, firstDay };
}
export function csvCell(value) {
  const text = String(value ?? '');
  return '"' + (/^[\s]*[=+@-]/.test(text) ? "'" + text : text).replaceAll('"', '""') + '"';
}
