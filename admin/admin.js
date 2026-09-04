import { ADMIN_EMAIL, ADMIN_REDIRECT_URL, loadCardContent, supabase } from '../lib/supabase.js';

const loginScreen = document.querySelector('#login-screen');
const passwordSetupScreen = document.querySelector('#password-setup-screen');
const adminApp = document.querySelector('#admin-app');
const loginForm = document.querySelector('#login-form');
const firstAccessButton = document.querySelector('#first-access');
const loginFeedback = document.querySelector('#login-feedback');
const passwordSetupForm = document.querySelector('#password-setup-form');
const passwordSetupFeedback = document.querySelector('#password-setup-feedback');
const contentForm = document.querySelector('#content-form');
const saveButton = document.querySelector('#save');
const saveStatus = document.querySelector('#save-status');
const preview = document.querySelector('#card-preview');

let session = null;
let content = null;
let dirty = false;
let loadingAdmin = false;

const blankItems = {
  units: () => ({ id: crypto.randomUUID(), name: 'Nova unidade', cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', address: '', phone: '', contactUrl: '', contactButtonLabel: '', whatsappMessage: '', collectLead: true, mapsUrl: '', mapsQuery: '', website: '', active: true }),
  links: () => ({ id: crypto.randomUUID(), title: 'Novo link', url: '', preMessage: '', collectLead: true, active: true }),
  campaigns: () => ({ id: crypto.randomUUID(), title: 'Nova campanha', description: '', url: '', buttonLabel: 'Saiba mais', active: true }),
  testimonials: () => ({ id: crypto.randomUUID(), author: 'Paciente', text: '', active: true }),
  portfolio: () => ({ id: crypto.randomUUID(), title: 'Novo resultado', procedure: '', description: '', details: '', mediaUrl: '', fileName: '', posterUrl: '', mediaType: 'image', active: true }),
};

const PORTFOLIO_ACCEPT = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
  'video/mp4',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
  'text/plain',
  'text/csv',
].join(',');

const DOCUMENT_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'txt', 'csv']);

function detectMediaType(file) {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (DOCUMENT_EXTENSIONS.has(extension)) return 'document';
  return '';
}

function mediaPreview(item) {
  const url = escapeHtml(item.mediaUrl || '');
  if (item.mediaType === 'document') {
    return `<a class="document-preview" href="${url || '#'}" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">DOC</span><strong>${escapeHtml(item.fileName || 'Abrir documento')}</strong><small>Visualizar arquivo</small></a>`;
  }
  const fallback = '/assets/video-poster.webp';
  const tag = item.mediaType === 'video' ? 'video' : 'img';
  const attributes = item.mediaType === 'video' ? 'muted controls playsinline' : 'alt="Prévia da mídia"';
  return `<${tag} class="media-thumb" src="${url || fallback}" ${attributes}></${tag}>`;
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

function setStatus(message, state = '') {
  saveStatus.textContent = message;
  saveStatus.dataset.state = state;
}

function setDirty(value = true) {
  dirty = value;
  setStatus(value ? 'Alterações não salvas' : 'Tudo salvo', value ? 'dirty' : 'saved');
  if (value) sendPreview();
}

function showLogin() {
  loginScreen.hidden = false;
  passwordSetupScreen.hidden = true;
  adminApp.hidden = true;
}

function showAdmin() {
  loginScreen.hidden = true;
  passwordSetupScreen.hidden = true;
  adminApp.hidden = false;
}

function showPasswordSetup() {
  loginScreen.hidden = true;
  passwordSetupScreen.hidden = false;
  adminApp.hidden = true;
  document.querySelector('#new-password').focus();
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = loginForm.querySelector('button');
  button.disabled = true;
  loginFeedback.textContent = 'Validando acesso…';
  const { data, error } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: loginForm.querySelector('#password').value,
  });
  if (error) {
    loginFeedback.textContent = 'E-mail ou senha incorretos.';
  } else {
    loginFeedback.textContent = 'Acesso confirmado. Abrindo o painel…';
    await openAdmin(data.session);
  }
  button.disabled = false;
});

firstAccessButton.addEventListener('click', async () => {
  firstAccessButton.disabled = true;
  loginFeedback.textContent = 'Enviando validação por e-mail…';
  const { error } = await supabase.auth.signInWithOtp({
    email: ADMIN_EMAIL,
    options: { shouldCreateUser: false, emailRedirectTo: ADMIN_REDIRECT_URL },
  });
  loginFeedback.textContent = error
    ? `Não foi possível enviar: ${error.message}`
    : 'E-mail enviado. Abra o link para cadastrar sua senha.';
  firstAccessButton.disabled = false;
});

passwordSetupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const password = passwordSetupForm['new-password'].value;
  const confirmation = passwordSetupForm['confirm-password'].value;
  const button = passwordSetupForm.querySelector('button');

  if (password.length < 8) {
    passwordSetupFeedback.textContent = 'A senha precisa ter pelo menos 8 caracteres.';
    return;
  }
  if (password !== confirmation) {
    passwordSetupFeedback.textContent = 'As senhas digitadas não são iguais.';
    return;
  }

  button.disabled = true;
  passwordSetupFeedback.textContent = 'Cadastrando sua senha…';
  const currentMetadata = session?.user?.user_metadata || {};
  const { data, error } = await supabase.auth.updateUser({
    password,
    data: { ...currentMetadata, card_password_configured: true },
  });

  if (error) {
    passwordSetupFeedback.textContent = `Não foi possível cadastrar: ${error.message}`;
    button.disabled = false;
    return;
  }

  session = { ...session, user: data.user };
  passwordSetupForm.reset();
  passwordSetupFeedback.textContent = 'Senha cadastrada com sucesso.';
  button.disabled = false;
  await openAdmin(session, true);
});

document.querySelector('#logout').addEventListener('click', async () => {
  await supabase.auth.signOut();
  session = null;
  showLogin();
});

document.querySelectorAll('.nav-link').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.nav-link, .panel').forEach((element) => element.classList.remove('is-active'));
    button.classList.add('is-active');
    document.querySelector(`[data-panel="${button.dataset.section}"]`).classList.add('is-active');
    if (button.dataset.section === 'links' && content) renderUnitContacts();
  });
});

function fillCompany() {
  contentForm.querySelectorAll('[name^="company."]').forEach((field) => {
    const key = field.name.split('.')[1];
    field.value = content.company?.[key] ?? (key === 'logoAsset' ? '/assets/logo-principal-marrom.jpeg' : '');
  });
  const heroPreview = document.querySelector('#hero-preview');
  if (heroPreview) heroPreview.src = content.company?.heroImage || '/assets/hero.webp';
}

function field(label, key, value, options = {}) {
  const { wide = false, type = 'text', placeholder = '' } = options;
  return `<label class="field${wide ? ' wide' : ''}">${label}<input data-key="${key}" type="${type}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" /></label>`;
}

function toggle(value) {
  return `<label class="toggle"><input data-key="active" type="checkbox" ${value ? 'checked' : ''} /> Mostrar no cartão</label>`;
}

function leadToggle(value) {
  return `<label class="toggle toggle--lead"><input data-key="collectLead" type="checkbox" ${value !== false ? 'checked' : ''} /> Pedir nome e telefone antes de abrir</label>`;
}

function renderUnitContacts() {
  const list = document.querySelector('#unit-contacts-list');
  const units = content.units || [];
  if (!units.length) {
    list.innerHTML = '<div class="empty-state"><strong>Nenhuma unidade cadastrada</strong><p>Cadastre uma unidade primeiro.</p></div>';
    return;
  }
  list.innerHTML = units.map((unit, index) => `
    <article class="repeat-card unit-contact-card" data-type="units" data-index="${index}">
      <div class="repeat-card__top">
        <div><small>Unidade</small><strong>${escapeHtml(unit.name || unit.city || `Unidade ${index + 1}`)}</strong></div>
        <span class="unit-contact-card__badge">Direcionamento separado</span>
      </div>
      <div class="fields">
        ${field('Texto do botão', 'contactButtonLabel', unit.contactButtonLabel || '', { placeholder: `Agendar em ${unit.city || unit.name || 'esta unidade'}` })}
        ${field('WhatsApp desta unidade', 'phone', unit.phone || '', { placeholder: '5516999999999' })}
        ${field('Destino do botão (opcional)', 'contactUrl', unit.contactUrl || '', { wide: true, type: 'url', placeholder: 'Deixe vazio para abrir o WhatsApp acima' })}
        ${field('Mensagem pré-preenchida desta unidade', 'whatsappMessage', unit.whatsappMessage || '', { wide: true, placeholder: 'Olá! Meu nome é {nome} e quero atendimento nesta unidade.' })}
        <div class="field wide">${leadToggle(unit.collectLead)}</div>
      </div>
    </article>
  `).join('');
}

function renderList(type) {
  const list = document.querySelector(`#${type}-list`);
  const items = content[type] || [];
  if (!items.length) {
    list.replaceChildren(document.querySelector('#empty-template').content.cloneNode(true));
    return;
  }

  list.innerHTML = items.map((item, index) => {
    const title = item.name || item.title || item.author || `Item ${index + 1}`;
    let fields = '';
    if (type === 'units') fields = [
      field('Nome da unidade', 'name', item.name),
      `<label class="field">CEP<input data-key="cep" value="${escapeHtml(item.cep || '')}" inputmode="numeric" maxlength="9" placeholder="00000-000" /><small class="cep-status" aria-live="polite"></small></label>`,
      field('Rua', 'street', item.street || ''), field('Número', 'number', item.number || ''),
      field('Complemento', 'complement', item.complement || ''), field('Bairro', 'neighborhood', item.neighborhood || ''),
      field('Cidade', 'city', item.city), field('Estado', 'state', item.state || '', { placeholder: 'SP' }),
      field('Endereço exibido no cartão', 'address', item.address, { wide: true }), field('WhatsApp', 'phone', item.phone),
      field('Mensagem pré-preenchida do WhatsApp', 'whatsappMessage', item.whatsappMessage || '', { wide: true, placeholder: 'Olá! Meu nome é {nome}…' }),
      field('Busca do mapa', 'mapsQuery', item.mapsQuery), field('Link do Google', 'mapsUrl', item.mapsUrl, { type: 'url' }),
      field('Site da unidade', 'website', item.website, { type: 'url' }),
      `<div class="field wide">${leadToggle(item.collectLead)}</div>`,
    ].join('');
    if (type === 'links') fields = field('Texto do botão', 'title', item.title) + field('Link', 'url', item.url, { type: 'url' }) + field('Mensagem pré-preenchida (para link do WhatsApp)', 'preMessage', item.preMessage || '', { wide: true, placeholder: 'Olá! Meu nome é {nome}…' }) + `<div class="field wide">${leadToggle(item.collectLead)}</div>`;
    if (type === 'campaigns') fields = field('Título', 'title', item.title) + field('Texto', 'description', item.description, { wide: true }) + field('Texto do botão', 'buttonLabel', item.buttonLabel) + field('Link', 'url', item.url, { type: 'url' });
    if (type === 'testimonials') fields = field('Nome', 'author', item.author) + field('Depoimento', 'text', item.text, { wide: true });
    if (type === 'portfolio') fields = field('Título do resultado', 'title', item.title) + field('Procedimento ou trabalho', 'procedure', item.procedure || '') + field('Descrição do resultado', 'description', item.description || '', { wide: true, placeholder: 'Conte o que foi realizado e o objetivo do caso.' }) + field('Informações complementares', 'details', item.details || '', { wide: true, placeholder: 'Ex.: planejamento individualizado, período ou técnica.' }) + field('URL da mídia ou documento', 'mediaUrl', item.mediaUrl, { wide: true, type: 'url' }) + `<label class="field">Tipo<select data-key="mediaType"><option value="image" ${item.mediaType === 'image' || !item.mediaType ? 'selected' : ''}>Imagem</option><option value="video" ${item.mediaType === 'video' ? 'selected' : ''}>Vídeo</option><option value="document" ${item.mediaType === 'document' ? 'selected' : ''}>Documento</option></select></label>` + field('Capa do vídeo', 'posterUrl', item.posterUrl || '', { type: 'url' });

    const media = type === 'portfolio'
      ? `<div class="media-preview">${mediaPreview(item)}<span>${item.mediaType === 'document' ? 'Documento anexado' : 'Prévia da mídia'}</span><label class="upload">Anexar ou trocar arquivo<input type="file" data-upload accept="${PORTFOLIO_ACCEPT}" /></label></div>`
      : '';

    return `<article class="repeat-card" data-type="${type}" data-index="${index}">${media}<div><div class="repeat-card__top"><strong>${escapeHtml(title)}</strong><button class="remove" type="button" data-remove>Remover</button></div><div class="fields">${fields}<div class="field wide">${toggle(item.active !== false)}</div></div></div></article>`;
  }).join('');
}

function renderAll() {
  fillCompany();
  ['units', 'links', 'campaigns', 'testimonials', 'portfolio'].forEach(renderList);
  renderUnitContacts();
  sendPreview();
}

document.querySelectorAll('[data-add]').forEach((button) => {
  button.addEventListener('click', () => {
    const type = button.dataset.add;
    content[type] ||= [];
    content[type].push(blankItems[type]());
    renderList(type);
    setDirty();
  });
});

contentForm.addEventListener('input', (event) => {
  const companyName = event.target.name;
  if (companyName?.startsWith('company.')) {
    const key = companyName.split('.')[1];
    content.company[key] = event.target.value;
    if (key === 'heroImage') document.querySelector('#hero-preview').src = event.target.value || '/assets/hero.webp';
    setDirty();
    return;
  }
  const card = event.target.closest('.repeat-card');
  if (!card || !event.target.dataset.key) return;
  const item = content[card.dataset.type][Number(card.dataset.index)];
  item[event.target.dataset.key] = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
  if (card.dataset.type === 'units' && ['street', 'number', 'complement', 'neighborhood', 'city', 'state'].includes(event.target.dataset.key)) syncUnitAddress(item, card);
  const heading = card.querySelector('.repeat-card__top strong');
  heading.textContent = item.name || item.title || item.author || 'Item';
  setDirty();
});

function syncUnitAddress(item, card) {
  const locality = [item.city, item.state].filter(Boolean).join(' - ');
  item.address = [item.street, item.number, item.complement, item.neighborhood, locality].filter(Boolean).join(', ');
  const addressField = card?.querySelector('[data-key="address"]');
  if (addressField) addressField.value = item.address;
}

contentForm.addEventListener('focusout', async (event) => {
  if (event.target.dataset.key !== 'cep') return;
  const card = event.target.closest('.repeat-card');
  const item = content.units[Number(card.dataset.index)];
  const status = event.target.parentElement.querySelector('.cep-status');
  const digits = event.target.value.replace(/\D/g, '');
  if (digits.length !== 8) {
    status.textContent = digits ? 'Digite os 8 números do CEP.' : '';
    status.dataset.state = 'error';
    return;
  }
  event.target.value = `${digits.slice(0, 5)}-${digits.slice(5)}`;
  item.cep = event.target.value;
  status.textContent = 'Pesquisando endereço…';
  status.dataset.state = '';
  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    const data = await response.json();
    if (!response.ok || data.erro) throw new Error('CEP não encontrado');
    Object.assign(item, { street: data.logradouro || '', neighborhood: data.bairro || '', city: data.localidade || '', state: data.uf || '' });
    syncUnitAddress(item);
    renderList('units');
    const refreshed = document.querySelector(`#units-list .repeat-card[data-index="${card.dataset.index}"]`);
    const refreshedStatus = refreshed?.querySelector('.cep-status');
    if (refreshedStatus) { refreshedStatus.textContent = 'Endereço encontrado. Complete o número.'; refreshedStatus.dataset.state = 'success'; }
    setDirty();
  } catch {
    status.textContent = 'CEP não encontrado. Confira e tente novamente.';
    status.dataset.state = 'error';
  }
});

contentForm.addEventListener('click', (event) => {
  const removeButton = event.target.closest('[data-remove]');
  if (!removeButton) return;
  const card = removeButton.closest('.repeat-card');
  content[card.dataset.type].splice(Number(card.dataset.index), 1);
  renderList(card.dataset.type);
  setDirty();
});

contentForm.addEventListener('change', async (event) => {
  if (event.target.matches('[data-company-upload]') && event.target.files?.[0]) {
    const file = event.target.files[0];
    const extension = file.name.split('.').pop().toLowerCase();
    const path = `identity-${Date.now()}-${crypto.randomUUID()}.${extension}`;
    event.target.disabled = true;
    setStatus('Enviando foto principal…');
    const { error } = await supabase.storage.from('digital-card-media').upload(path, file, { cacheControl: '3600', upsert: false });
    event.target.disabled = false;
    if (error) {
      setStatus(`Falha no envio: ${error.message}`, 'error');
      return;
    }
    const { data } = supabase.storage.from('digital-card-media').getPublicUrl(path);
    content.company.heroImage = data.publicUrl;
    const input = contentForm.querySelector('[name="company.heroImage"]');
    input.value = data.publicUrl;
    document.querySelector('#hero-preview').src = data.publicUrl;
    setDirty();
    return;
  }
  if (!event.target.matches('[data-upload]') || !event.target.files?.[0]) return;
  const file = event.target.files[0];
  const card = event.target.closest('.repeat-card');
  const item = content.portfolio[Number(card.dataset.index)];
  const mediaType = detectMediaType(file);
  if (!mediaType) {
    setStatus('Formato não aceito. Selecione uma imagem, MP4 ou documento compatível.', 'error');
    event.target.value = '';
    return;
  }
  if (file.size > 20 * 1024 * 1024) {
    setStatus('O arquivo ultrapassa o limite de 20 MB.', 'error');
    event.target.value = '';
    return;
  }
  const extension = file.name.split('.').pop().toLowerCase();
  const path = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
  event.target.disabled = true;
  setStatus('Enviando mídia…');
  const { error } = await supabase.storage.from('digital-card-media').upload(path, file, { cacheControl: '3600', upsert: false });
  event.target.disabled = false;
  if (error) {
    setStatus(`Falha no envio: ${error.message}`, 'error');
    return;
  }
  const { data } = supabase.storage.from('digital-card-media').getPublicUrl(path);
  item.mediaUrl = data.publicUrl;
  item.mediaType = mediaType;
  item.fileName = file.name;
  renderList('portfolio');
  setDirty();
});

function sendPreview() {
  if (!content || !preview.contentWindow) return;
  preview.contentWindow.postMessage({ type: 'vert-card-preview', content }, window.location.origin);
}

async function loadMetrics() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.from('digital_card_clicks').select('botao').gte('created_at', since);
  if (error) return;
  const views = data.filter((row) => row.botao === 'visualizacao_pagina').length;
  const clicks = data.length - views;
  const whatsapp = data.filter((row) => row.botao.startsWith('whatsapp')).length;
  document.querySelector('#metric-views').textContent = views.toLocaleString('pt-BR');
  document.querySelector('#metric-clicks').textContent = clicks.toLocaleString('pt-BR');
  document.querySelector('#metric-whatsapp').textContent = whatsapp.toLocaleString('pt-BR');
}

async function loadLeads() {
  const list = document.querySelector('#leads-list');
  list.innerHTML = '<div class="empty-state"><strong>Carregando contatos…</strong></div>';
  const { data, error } = await supabase.from('digital_card_leads').select('name,phone,profession,button,unit,created_at').order('created_at', { ascending: false }).limit(200);
  if (error) {
    list.innerHTML = `<div class="empty-state"><strong>Não foi possível carregar</strong><p>${escapeHtml(error.message)}</p></div>`;
    return;
  }
  document.querySelector('#metric-leads').textContent = data.length.toLocaleString('pt-BR');
  if (!data.length) {
    list.innerHTML = '<div class="empty-state"><strong>Nenhum contato recebido ainda</strong><p>Os novos contatos aparecerão aqui.</p></div>';
    return;
  }
  list.innerHTML = data.map((lead) => {
    const digits = String(lead.phone).replace(/\D/g, '');
    const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(lead.created_at));
    return `<article class="lead-card"><div><small>${escapeHtml(date)}</small><strong>${escapeHtml(lead.name)}</strong><span>${escapeHtml(lead.profession || 'Profissão não informada')}</span></div><div><small>${escapeHtml(lead.button)}${lead.unit ? ` · ${escapeHtml(lead.unit)}` : ''}</small><a href="https://wa.me/${digits}" target="_blank" rel="noopener noreferrer">${escapeHtml(lead.phone)} <span>→</span></a></div></article>`;
  }).join('');
}

document.querySelector('#refresh-leads').addEventListener('click', () => void loadLeads());

preview.addEventListener('load', sendPreview);

saveButton.addEventListener('click', async () => {
  if (!session || !content) return;
  saveButton.classList.add('is-saving');
  setStatus('Salvando…');
  const { error } = await supabase.from('digital_card_content').upsert({
    slug: 'instituto-vert', content, updated_at: new Date().toISOString(), updated_by: session.user.id,
  }, { onConflict: 'slug' });
  saveButton.classList.remove('is-saving');
  if (error) {
    setStatus(`Não foi possível salvar: ${error.message}`, 'error');
    return;
  }
  dirty = false;
  setStatus('Publicado agora', 'saved');
});

window.addEventListener('beforeunload', (event) => {
  if (!dirty) return;
  event.preventDefault();
});

async function openAdmin(nextSession, passwordJustConfigured = false) {
  if (loadingAdmin) return;
  loadingAdmin = true;
  session = nextSession;
  if (session.user.email?.toLowerCase() !== ADMIN_EMAIL) {
    await supabase.auth.signOut();
    loginFeedback.textContent = 'Este e-mail não possui autorização.';
    showLogin();
    loadingAdmin = false;
    return;
  }
  if (!passwordJustConfigured && session.user.user_metadata?.card_password_configured !== true) {
    showPasswordSetup();
    loadingAdmin = false;
    return;
  }
  showAdmin();
  void loadMetrics();
  void loadLeads();
  setStatus('Carregando…');
  try {
    const data = await loadCardContent();
    content = data.content;
    renderAll();
    setDirty(false);
  } catch (error) {
    setStatus(`Erro ao carregar: ${error.message}`, 'error');
  }
  loadingAdmin = false;
}

async function start() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return showLogin();
  await openAdmin(data.session);
}

supabase.auth.onAuthStateChange((_event, nextSession) => {
  session = nextSession;
  if (nextSession && adminApp.hidden) setTimeout(() => void openAdmin(nextSession), 0);
});

start();
