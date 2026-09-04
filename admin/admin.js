import { ADMIN_EMAIL, loadCardContent, supabase } from '../lib/supabase.js';

const loginScreen = document.querySelector('#login-screen');
const adminApp = document.querySelector('#admin-app');
const loginForm = document.querySelector('#login-form');
const loginFeedback = document.querySelector('#login-feedback');
const contentForm = document.querySelector('#content-form');
const saveButton = document.querySelector('#save');
const saveStatus = document.querySelector('#save-status');
const preview = document.querySelector('#card-preview');

let session = null;
let content = null;
let dirty = false;
let loadingAdmin = false;

const blankItems = {
  units: () => ({ id: crypto.randomUUID(), name: 'Nova unidade', city: '', address: '', phone: '', mapsUrl: '', mapsQuery: '', website: '', active: true }),
  links: () => ({ id: crypto.randomUUID(), title: 'Novo link', url: '', active: true }),
  campaigns: () => ({ id: crypto.randomUUID(), title: 'Nova campanha', description: '', url: '', buttonLabel: 'Saiba mais', active: true }),
  testimonials: () => ({ id: crypto.randomUUID(), author: 'Paciente', text: '', active: true }),
  portfolio: () => ({ id: crypto.randomUUID(), title: 'Novo resultado', mediaUrl: '', posterUrl: '', mediaType: 'image', active: true }),
};

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
  adminApp.hidden = true;
}

function showAdmin() {
  loginScreen.hidden = true;
  adminApp.hidden = false;
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = loginForm.querySelector('button');
  button.disabled = true;
  loginFeedback.textContent = 'Enviando link seguro…';
  const { data, error } = await supabase.auth.signInWithOtp({
    email: ADMIN_EMAIL,
    options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/admin/` },
  });
  if (error) {
    loginFeedback.textContent = `Não foi possível acessar: ${error.message}`;
  } else if (data.session) {
    loginFeedback.textContent = 'Acesso confirmado. Abrindo o painel…';
    await openAdmin(data.session);
  } else {
    loginFeedback.textContent = 'Link enviado. Verifique a caixa de entrada e o spam.';
  }
  button.disabled = false;
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
  });
});

function fillCompany() {
  contentForm.querySelectorAll('[name^="company."]').forEach((field) => {
    const key = field.name.split('.')[1];
    field.value = content.company?.[key] ?? '';
  });
}

function field(label, key, value, options = {}) {
  const { wide = false, type = 'text', placeholder = '' } = options;
  return `<label class="field${wide ? ' wide' : ''}">${label}<input data-key="${key}" type="${type}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" /></label>`;
}

function toggle(value) {
  return `<label class="toggle"><input data-key="active" type="checkbox" ${value ? 'checked' : ''} /> Mostrar no cartão</label>`;
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
      field('Nome da unidade', 'name', item.name), field('Cidade', 'city', item.city),
      field('Endereço completo', 'address', item.address, { wide: true }), field('WhatsApp', 'phone', item.phone),
      field('Busca do mapa', 'mapsQuery', item.mapsQuery), field('Link do Google', 'mapsUrl', item.mapsUrl, { type: 'url' }),
      field('Site da unidade', 'website', item.website, { type: 'url' }),
    ].join('');
    if (type === 'links') fields = field('Título', 'title', item.title) + field('Link', 'url', item.url, { type: 'url' });
    if (type === 'campaigns') fields = field('Título', 'title', item.title) + field('Texto', 'description', item.description, { wide: true }) + field('Texto do botão', 'buttonLabel', item.buttonLabel) + field('Link', 'url', item.url, { type: 'url' });
    if (type === 'testimonials') fields = field('Nome', 'author', item.author) + field('Depoimento', 'text', item.text, { wide: true });
    if (type === 'portfolio') fields = field('Título', 'title', item.title) + field('URL da mídia', 'mediaUrl', item.mediaUrl, { wide: true, type: 'url' }) + `<label class="field">Tipo<select data-key="mediaType"><option value="image" ${item.mediaType !== 'video' ? 'selected' : ''}>Imagem</option><option value="video" ${item.mediaType === 'video' ? 'selected' : ''}>Vídeo</option></select></label>` + field('Capa do vídeo', 'posterUrl', item.posterUrl || '', { type: 'url' });

    const media = type === 'portfolio'
      ? `<div><${item.mediaType === 'video' ? 'video' : 'img'} class="media-thumb" src="${escapeHtml(item.mediaUrl || '/assets/video-poster.webp')}" ${item.mediaType === 'video' ? 'muted playsinline' : 'alt="Prévia da mídia"'}></${item.mediaType === 'video' ? 'video' : 'img'}><label class="upload">Enviar mídia<input type="file" data-upload accept="image/jpeg,image/png,image/webp,video/mp4" /></label></div>`
      : '';

    return `<article class="repeat-card" data-type="${type}" data-index="${index}">${media}<div><div class="repeat-card__top"><strong>${escapeHtml(title)}</strong><button class="remove" type="button" data-remove>Remover</button></div><div class="fields">${fields}<div class="field wide">${toggle(item.active !== false)}</div></div></div></article>`;
  }).join('');
}

function renderAll() {
  fillCompany();
  ['units', 'links', 'campaigns', 'testimonials', 'portfolio'].forEach(renderList);
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
    content.company[companyName.split('.')[1]] = event.target.value;
    setDirty();
    return;
  }
  const card = event.target.closest('.repeat-card');
  if (!card || !event.target.dataset.key) return;
  const item = content[card.dataset.type][Number(card.dataset.index)];
  item[event.target.dataset.key] = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
  const heading = card.querySelector('.repeat-card__top strong');
  heading.textContent = item.name || item.title || item.author || 'Item';
  setDirty();
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
  if (!event.target.matches('[data-upload]') || !event.target.files?.[0]) return;
  const file = event.target.files[0];
  const card = event.target.closest('.repeat-card');
  const item = content.portfolio[Number(card.dataset.index)];
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
  item.mediaType = file.type.startsWith('video/') ? 'video' : 'image';
  renderList('portfolio');
  setDirty();
});

function sendPreview() {
  if (!content || !preview.contentWindow) return;
  preview.contentWindow.postMessage({ type: 'vert-card-preview', content }, window.location.origin);
}

async function loadMetrics() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.from('link_clicks').select('botao').gte('created_at', since);
  if (error) return;
  const views = data.filter((row) => row.botao === 'visualizacao_pagina').length;
  const clicks = data.length - views;
  const whatsapp = data.filter((row) => row.botao.startsWith('whatsapp')).length;
  document.querySelector('#metric-views').textContent = views.toLocaleString('pt-BR');
  document.querySelector('#metric-clicks').textContent = clicks.toLocaleString('pt-BR');
  document.querySelector('#metric-whatsapp').textContent = whatsapp.toLocaleString('pt-BR');
}

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

async function openAdmin(nextSession) {
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
  showAdmin();
  void loadMetrics();
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
