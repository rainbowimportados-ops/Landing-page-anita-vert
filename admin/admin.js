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

const DEFAULT_IDENTITY_ASSETS = {
  heroImage: new URL('../assets/hero.webp', import.meta.url).href,
  logoPrimaryDark: new URL('../assets/logo-principal-marrom.jpeg', import.meta.url).href,
  logoPrimaryLight: new URL('../assets/logo-principal-clara.jpeg', import.meta.url).href,
  logoHorizontal: new URL('../assets/logo-secundaria-marrom.jpeg', import.meta.url).href,
};

const IDENTITY_PREVIEW_IDS = {
  heroImage: 'hero-preview',
  logoPrimaryDark: 'logo-primary-dark-preview',
  logoPrimaryLight: 'logo-primary-light-preview',
  logoHorizontal: 'logo-horizontal-preview',
};

let session = null;
let content = null;
let dirty = false;
let loadingAdmin = false;
let contactLeads = [];
let formationLeads = [];
let visitorJourneys = [];
let selectedLeadIds = new Set();
let leadDialogMode = 'edit';

const blankItems = {
  units: () => ({ id: crypto.randomUUID(), name: 'Nova unidade', cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', address: '', phone: '', contactUrl: '', contactButtonLabel: '', whatsappMessage: '', collectLead: true, mapsUrl: '', mapsQuery: '', website: '', active: true }),
  links: () => ({ id: crypto.randomUUID(), title: 'Novo link', url: '', preMessage: '', collectLead: true, active: true }),
  formations: () => ({ id: crypto.randomUUID(), category: 'course', title: 'Nova formação', eyebrow: 'Para dentistas e estudantes', description: '', format: 'Presencial', schedule: '', location: '', whatsappPhone: '', buttonLabel: 'Quero informações', whatsappMessage: '', active: true }),
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

async function canDecodeImage(file) {
  const objectUrl = URL.createObjectURL(file);
  try {
    await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = resolve;
      image.onerror = () => reject(new Error('A imagem não pôde ser decodificada'));
      image.src = objectUrl;
    });
    return true;
  } catch {
    return false;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
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

function isCloseFriendsFormation(item = {}) {
  return item.category === 'close_friends' || /close\s*friends/i.test(item.title || '');
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

const sectionDetails = {
  'visao-geral': { title: 'Visão geral', context: 'Desempenho do cartão' },
  empresa: { title: 'Dados da empresa', context: 'Configuração do cartão' },
  unidades: { title: 'Unidades', context: 'Configuração do atendimento' },
  links: { title: 'WhatsApp e contatos', context: 'Configuração do atendimento' },
  formacoes: { title: 'Formações e cursos', context: 'Conteúdo do cartão' },
  contatos: { title: 'Contatos recebidos', context: 'Dados e relacionamento' },
  campanhas: { title: 'Campanhas e promoções', context: 'Conteúdo do cartão' },
  depoimentos: { title: 'Depoimentos', context: 'Conteúdo do cartão' },
  resultados: { title: 'Resultados e trabalhos', context: 'Conteúdo do cartão' },
};

function activatePanel(section, shouldScroll = false) {
  const button = document.querySelector(`.nav-link[data-section="${section}"]`);
  const panel = document.querySelector(`[data-panel="${section}"]`);
  if (!button || !panel) return;
  document.querySelectorAll('.nav-link, .panel').forEach((element) => element.classList.remove('is-active'));
  button.classList.add('is-active');
  panel.classList.add('is-active');
  adminApp.dataset.activeSection = section;
  if (section === 'links' && content) renderUnitContacts();
  const details = sectionDetails[section];
  const title = document.querySelector('#workspace-title');
  const context = document.querySelector('#workspace-context');
  const mobileNav = document.querySelector('#mobile-section-nav');
  if (title && details) title.textContent = details.title;
  if (context && details) context.textContent = details.context;
  if (mobileNav) mobileNav.value = section;
  if (shouldScroll) window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.nav-link').forEach((button) => {
  button.addEventListener('click', () => activatePanel(button.dataset.section));
});

document.querySelector('#mobile-section-nav')?.addEventListener('change', (event) => {
  activatePanel(event.target.value, true);
});

document.querySelectorAll('[data-jump-panel]').forEach((button) => {
  button.addEventListener('click', () => activatePanel(button.dataset.jumpPanel, true));
});

function fillCompany() {
  contentForm.querySelectorAll('[name^="company."]').forEach((field) => {
    const key = field.name.split('.')[1];
    field.value = content.company?.[key] ?? (key === 'logoVariant' ? 'primaryDark' : key === 'whatsappMode' ? 'shared' : '');
  });
  const previews = {
    'hero-preview': content.company?.heroImage || DEFAULT_IDENTITY_ASSETS.heroImage,
    'logo-primary-dark-preview': content.company?.logoPrimaryDark || DEFAULT_IDENTITY_ASSETS.logoPrimaryDark,
    'logo-primary-light-preview': content.company?.logoPrimaryLight || DEFAULT_IDENTITY_ASSETS.logoPrimaryLight,
    'logo-horizontal-preview': content.company?.logoHorizontal || DEFAULT_IDENTITY_ASSETS.logoHorizontal,
  };
  Object.entries(previews).forEach(([id, source]) => {
    const image = document.getElementById(id);
    if (image) image.src = source;
  });
}

function fillFormationSettings() {
  contentForm.querySelectorAll('[name^="formationSettings."]').forEach((field) => {
    const key = field.name.split('.')[1];
    field.value = content.formationSettings?.[key] ?? '';
  });
}

function field(label, key, value, options = {}) {
  const { wide = false, type = 'text', placeholder = '' } = options;
  return `<label class="field${wide ? ' wide' : ''}">${label}<input data-key="${key}" type="${type}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" /></label>`;
}

function textareaField(label, key, value, options = {}) {
  const { wide = false, placeholder = '', rows = 3 } = options;
  return `<label class="field${wide ? ' wide' : ''}">${label}<textarea data-key="${key}" rows="${rows}" placeholder="${escapeHtml(placeholder)}">${escapeHtml(value)}</textarea></label>`;
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
    if (type === 'formations') fields = [
      field('Nome da formação', 'title', item.title),
      field('Selo acima do título', 'eyebrow', item.eyebrow || '', { placeholder: 'Curso presencial' }),
      textareaField('Descrição', 'description', item.description || '', { wide: true, placeholder: 'Apresente os objetivos e diferenciais desta formação.' }),
      field('Formato', 'format', item.format || '', { placeholder: 'Presencial, online ou imersão' }),
      field('Data ou disponibilidade', 'schedule', item.schedule || '', { placeholder: 'Próxima turma em breve' }),
      field('Cidade ou local', 'location', item.location || '', { placeholder: 'Franca - SP' }),
      field('WhatsApp específico', 'whatsappPhone', item.whatsappPhone || '', { placeholder: 'Deixe vazio para usar o padrão' }),
      field('Texto do botão', 'buttonLabel', item.buttonLabel || '', { placeholder: 'Quero saber mais' }),
      textareaField('Mensagem enviada ao WhatsApp', 'whatsappMessage', item.whatsappMessage || '', { wide: true, rows: 4, placeholder: 'Olá! Meu nome é {nome}. Quero informações sobre {curso}. Sou {perfil}. {curso_anterior}' }),
    ].join('');
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
  fillFormationSettings();
  ['units', 'links', 'formations', 'campaigns', 'testimonials', 'portfolio'].forEach(renderList);
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
    const previewId = IDENTITY_PREVIEW_IDS[key];
    if (previewId) document.getElementById(previewId).src = event.target.value || DEFAULT_IDENTITY_ASSETS[key];
    setDirty();
    return;
  }
  if (companyName?.startsWith('formationSettings.')) {
    const key = companyName.split('.')[1];
    content.formationSettings ||= {};
    content.formationSettings[key] = event.target.value;
    setDirty();
    return;
  }
  const card = event.target.closest('.repeat-card');
  if (!card) return;
  if (!event.target.dataset.key) return;
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
  if (event.target.matches('[data-identity-upload]') && event.target.files?.[0]) {
    const file = event.target.files[0];
    const key = event.target.dataset.identityUpload;
    if (!file.type.startsWith('image/') || file.size > 20 * 1024 * 1024) {
      setStatus(file.size > 20 * 1024 * 1024 ? 'A imagem ultrapassa o limite de 20 MB.' : 'Selecione um arquivo de imagem compatível.', 'error');
      event.target.value = '';
      return;
    }
    setStatus('Validando a imagem…');
    if (!await canDecodeImage(file)) {
      setStatus('Esta imagem parece estar danificada ou não é compatível com o navegador.', 'error');
      event.target.value = '';
      return;
    }
    const extension = file.name.split('.').pop().toLowerCase();
    const path = `identity-${key}-${Date.now()}-${crypto.randomUUID()}.${extension}`;
    event.target.disabled = true;
    setStatus('Enviando imagem da identidade…');
    const { error } = await supabase.storage.from('digital-card-media').upload(path, file, { cacheControl: '3600', upsert: false });
    event.target.disabled = false;
    if (error) {
      setStatus(`Falha no envio: ${error.message}`, 'error');
      return;
    }
    const { data } = supabase.storage.from('digital-card-media').getPublicUrl(path);
    content.company[key] = data.publicUrl;
    const input = contentForm.querySelector(`[name="company.${key}"]`);
    if (input) input.value = data.publicUrl;
    const image = document.getElementById(event.target.dataset.preview);
    if (image) image.src = data.publicUrl;
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
  const [clickResult, leadResult] = await Promise.all([
    supabase.from('digital_card_clicks').select('botao,visitor_id,instagram_handle').gte('created_at', since),
    supabase.from('digital_card_leads').select('visitor_id,instagram_handle').gte('created_at', since),
  ]);
  if (clickResult.error || leadResult.error) return;
  const data = clickResult.data || [];
  const views = data.filter((row) => row.botao === 'visualizacao_pagina').length;
  const interactions = data.filter((row) => !['visualizacao_pagina', 'consentimento_autorizado', 'preferencias_privacidade'].includes(row.botao));
  const clicks = interactions.length;
  const whatsapp = data.filter((row) => row.botao.startsWith('whatsapp')).length;
  const visitors = new Set(data.map((row) => row.visitor_id).filter(Boolean)).size;
  const instagramProfiles = [...data, ...(leadResult.data || [])].filter((row) => row.instagram_handle).map((row) => row.visitor_id || row.instagram_handle);
  const instagram = new Set(instagramProfiles).size;
  document.querySelector('#metric-views').textContent = views.toLocaleString('pt-BR');
  document.querySelector('#metric-clicks').textContent = clicks.toLocaleString('pt-BR');
  document.querySelector('#metric-whatsapp').textContent = whatsapp.toLocaleString('pt-BR');
  document.querySelector('#metric-visitors').textContent = visitors.toLocaleString('pt-BR');
  document.querySelector('#metric-instagram').textContent = instagram.toLocaleString('pt-BR');
}

async function loadLeads() {
  const list = document.querySelector('#leads-list');
  const formationList = document.querySelector('#formation-leads-list');
  const journeyList = document.querySelector('#journey-list');
  list.innerHTML = '<div class="empty-state"><strong>Carregando contatos…</strong></div>';
  if (journeyList) journeyList.innerHTML = '<div class="empty-state"><strong>Carregando acessos…</strong></div>';
  if (formationList) formationList.innerHTML = '<div class="empty-state"><strong>Carregando interessados…</strong></div>';
  const [leadResult, clickResult] = await Promise.all([
    supabase.from('digital_card_leads').select('id,name,phone,profession,button,unit,destination,created_at,lead_type,is_dentist,has_previous_course,course_title,marked,tags,updated_at,visitor_id,instagram_handle,source_origin').order('created_at', { ascending: false }).limit(500),
    supabase.from('digital_card_clicks').select('visitor_id,botao,unidade,origem,dispositivo,instagram_handle,created_at').not('visitor_id', 'is', null).order('created_at', { ascending: false }).limit(5000),
  ]);
  if (leadResult.error || clickResult.error) {
    const message = leadResult.error?.message || clickResult.error?.message || 'Erro desconhecido';
    list.innerHTML = `<div class="empty-state"><strong>Não foi possível carregar</strong><p>${escapeHtml(message)}</p></div>`;
    if (journeyList) journeyList.innerHTML = list.innerHTML;
    if (formationList) formationList.innerHTML = list.innerHTML;
    return;
  }
  const data = leadResult.data || [];
  document.querySelector('#metric-leads').textContent = data.length.toLocaleString('pt-BR');
  contactLeads = data.filter((lead) => lead.lead_type !== 'formation');
  formationLeads = data.filter((lead) => lead.lead_type === 'formation');
  visitorJourneys = aggregateVisitorJourneys(clickResult.data || [], data);
  selectedLeadIds = new Set([...selectedLeadIds].filter((id) => contactLeads.some((lead) => lead.id === id)));
  renderVisitorJourneys();
  renderContactList();
  if (formationList) formationList.innerHTML = formationLeads.length
    ? formationLeads.map(renderFormationLeadCard).join('')
    : '<div class="empty-state"><strong>Nenhum interessado ainda</strong><p>Os leads dos cursos aparecerão aqui com suas respostas.</p></div>';
}

function aggregateVisitorJourneys(clicks, leads) {
  const leadByVisitor = new Map();
  leads.forEach((lead) => {
    if (lead.visitor_id && !leadByVisitor.has(lead.visitor_id)) leadByVisitor.set(lead.visitor_id, lead);
  });
  const grouped = new Map();
  clicks.forEach((click) => {
    const id = click.visitor_id;
    if (!id) return;
    const current = grouped.get(id) || { visitorId:id, views:0, clicks:0, buttons:new Set(), origin:'direto', device:'', instagram:'', firstAt:click.created_at, lastAt:click.created_at };
    if (click.botao === 'visualizacao_pagina') current.views += 1;
    else if (!['consentimento_autorizado', 'preferencias_privacidade'].includes(click.botao)) { current.clicks += 1; current.buttons.add(click.botao); }
    current.origin = click.origem || current.origin;
    current.device = click.dispositivo || current.device;
    current.instagram = click.instagram_handle || current.instagram;
    if (new Date(click.created_at) < new Date(current.firstAt)) current.firstAt = click.created_at;
    if (new Date(click.created_at) > new Date(current.lastAt)) current.lastAt = click.created_at;
    grouped.set(id, current);
  });
  return [...grouped.values()].map((journey) => {
    const lead = leadByVisitor.get(journey.visitorId) || null;
    const instagram = lead?.instagram_handle || journey.instagram || '';
    const stage = instagram ? 'instagram' : lead ? 'identified' : journey.clicks > 0 ? 'clicked' : 'viewed';
    return { ...journey, buttons:[...journey.buttons], lead, instagram, stage };
  }).sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
}

function filteredVisitorJourneys() {
  const search = document.querySelector('#journey-search').value.trim().toLocaleLowerCase('pt-BR');
  const filter = document.querySelector('#journey-filter').value;
  return visitorJourneys.filter((journey) => {
    const searchable = [journey.lead?.name, journey.lead?.phone, journey.instagram, journey.origin, journey.device, ...journey.buttons].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR');
    return (filter === 'all' || journey.stage === filter) && (!search || searchable.includes(search));
  });
}

function renderVisitorJourneys() {
  const list = document.querySelector('#journey-list');
  if (!list) return;
  const journeys = filteredVisitorJourneys();
  const journeySummary = {
    total: visitorJourneys.length,
    viewed: visitorJourneys.filter((journey) => journey.stage === 'viewed').length,
    clicked: visitorJourneys.filter((journey) => journey.clicks > 0).length,
    identified: visitorJourneys.filter((journey) => journey.lead || journey.instagram).length,
  };
  Object.entries(journeySummary).forEach(([key, value]) => {
    const metric = document.querySelector(`#journey-summary-${key}`);
    if (metric) metric.textContent = value.toLocaleString('pt-BR');
  });
  document.querySelector('#journey-count').textContent = `${journeys.length} ${journeys.length === 1 ? 'visitante' : 'visitantes'}`;
  if (!journeys.length) {
    list.innerHTML = '<div class="empty-state"><strong>Nenhum acesso encontrado</strong><p>Ajuste a busca ou a etapa selecionada.</p></div>';
    return;
  }
  list.innerHTML = journeys.map(renderVisitorJourney).join('');
}

function renderVisitorJourney(journey) {
  const lead = journey.lead;
  const name = lead?.name || journey.instagram || `Visitante ${journey.visitorId.slice(0, 6).toUpperCase()}`;
  const stageLabels = { viewed:'Somente visualizou', clicked:'Clicou', identified:'Contato enviado', instagram:'Instagram informado' };
  const stageClass = journey.stage === 'instagram' ? ' journey-status--instagram' : journey.stage === 'identified' ? ' journey-status--identified' : '';
  const instagramUser = String(journey.instagram || '').replace(/^@/, '');
  const instagramLink = instagramUser ? `<a href="https://www.instagram.com/${encodeURIComponent(instagramUser)}" target="_blank" rel="noopener noreferrer">${escapeHtml(journey.instagram)}</a>` : '';
  const phoneDigits = String(lead?.phone || '').replace(/\D/g, '');
  const phoneLink = phoneDigits ? `<a href="https://wa.me/${phoneDigits}" target="_blank" rel="noopener noreferrer">${escapeHtml(lead.phone)}</a>` : '';
  const date = new Intl.DateTimeFormat('pt-BR', { dateStyle:'short', timeStyle:'short' }).format(new Date(journey.lastAt));
  const buttonLabels = {
    whatsapp: 'WhatsApp',
    whatsapp_fixo: 'WhatsApp fixo',
    instagram_clinica: 'Instagram da clínica',
    instagram_anita: 'Instagram da Dra. Anita',
    localizacoes: 'Localizações',
    salvar_contato: 'Salvar contato',
  };
  const interactions = journey.buttons.map((button) => buttonLabels[button] || String(button).replaceAll('_', ' ')).join(', ') || 'Nenhum botão acessado';
  return `<article class="journey-row">
    <div class="journey-row__identity"><strong>${escapeHtml(name)}</strong><span class="journey-status${stageClass}">${stageLabels[journey.stage]}</span>${instagramLink}${phoneLink}</div>
    <div class="journey-row__activity"><span class="journey-row__numbers"><b>${journey.views}</b> ${journey.views === 1 ? 'visualização' : 'visualizações'} <i aria-hidden="true"></i> <b>${journey.clicks}</b> ${journey.clicks === 1 ? 'clique' : 'cliques'}</span><small>${escapeHtml(journey.origin)} · ${escapeHtml(journey.device || 'dispositivo não informado')}</small><small>${escapeHtml(interactions)}</small></div>
    <time datetime="${escapeHtml(journey.lastAt)}">Último acesso<br>${escapeHtml(date)}</time>
  </article>`;
}

function filteredContactLeads() {
  const search = document.querySelector('#lead-search').value.trim().toLocaleLowerCase('pt-BR');
  const filter = document.querySelector('#lead-filter').value;
  return contactLeads.filter((lead) => {
    const matchesFilter = filter === 'all' || (filter === 'marked' ? lead.marked : !lead.marked);
    const searchable = [lead.name, lead.phone, lead.instagram_handle, lead.profession, lead.button, lead.unit, lead.source_origin, ...(lead.tags || [])].join(' ').toLocaleLowerCase('pt-BR');
    return matchesFilter && (!search || searchable.includes(search));
  });
}

function renderContactList() {
  const list = document.querySelector('#leads-list');
  const leads = filteredContactLeads();
  if (!leads.length) {
    list.innerHTML = contactLeads.length
      ? '<div class="empty-state"><strong>Nenhum contato encontrado</strong><p>Ajuste a busca ou o filtro.</p></div>'
      : '<div class="empty-state"><strong>Nenhum contato recebido ainda</strong><p>Os novos contatos aparecerão aqui.</p></div>';
  } else {
    list.innerHTML = `<div class="lead-list-heading" aria-hidden="true"><span></span><span>Contato</span><span>Origem</span><span>Recebido em</span><span>Ações</span></div>${leads.map(renderLeadRow).join('')}`;
  }
  updateLeadSelectionBar();
}

function renderLeadRow(lead) {
  const digits = String(lead.phone).replace(/\D/g, '');
  const journey = visitorJourneys.find((item) => item.visitorId === lead.visitor_id);
  const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(lead.created_at));
  const tags = (lead.tags || []).map((tag) => `<span class="lead-tag">${escapeHtml(tag)}</span>`).join('');
  return `<article class="lead-row${lead.marked ? ' is-marked' : ''}" data-lead-id="${escapeHtml(lead.id)}">
    <label class="lead-row__select"><input class="lead-select" type="checkbox" ${selectedLeadIds.has(lead.id) ? 'checked' : ''} aria-label="Selecionar ${escapeHtml(lead.name)}" /></label>
    <div class="lead-row__contact" data-label="Contato">
      <strong>${escapeHtml(lead.name)}</strong>
      <span>${escapeHtml(lead.profession || 'Profissão não informada')}</span>
      <a href="https://wa.me/${digits}" target="_blank" rel="noopener noreferrer">${escapeHtml(lead.phone)}</a>
      ${lead.instagram_handle ? `<a href="https://www.instagram.com/${encodeURIComponent(String(lead.instagram_handle).replace(/^@/, ''))}" target="_blank" rel="noopener noreferrer">${escapeHtml(lead.instagram_handle)}</a>` : ''}
      ${tags ? `<div class="lead-tags">${tags}</div>` : ''}
    </div>
    <div class="lead-row__source" data-label="Origem"><span>${escapeHtml(lead.button)}</span><small>${escapeHtml(lead.unit || 'Sem unidade')}</small><small>${escapeHtml(lead.source_origin || 'Origem não identificada')}</small></div>
    <time class="lead-row__date" data-label="Recebido em" datetime="${escapeHtml(lead.created_at)}">${escapeHtml(date)}${journey ? `<br><strong>${journey.clicks} ${journey.clicks === 1 ? 'clique' : 'cliques'}</strong>` : ''}</time>
    <div class="lead-row__actions" data-label="Ações">
      <button type="button" data-lead-action="mark" aria-label="${lead.marked ? 'Desmarcar' : 'Marcar'} ${escapeHtml(lead.name)}" title="${lead.marked ? 'Desmarcar' : 'Marcar'}">${lead.marked ? '★' : '☆'}</button>
      <button type="button" data-lead-action="tag" title="Etiquetar">Etiqueta</button>
      <button type="button" data-lead-action="edit" title="Editar">Editar</button>
      <button type="button" class="is-danger" data-lead-action="delete" title="Excluir">Excluir</button>
    </div>
  </article>`;
}

function renderFormationLeadCard(lead) {
  const digits = String(lead.phone).replace(/\D/g, '');
  const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(lead.created_at));
  const dentist = lead.is_dentist === true ? 'Dentista' : lead.is_dentist === false ? 'Estudante de Odontologia' : 'Perfil não informado';
  const previousCourse = lead.has_previous_course === true ? 'Já fez curso' : lead.has_previous_course === false ? 'Primeiro curso' : 'Curso anterior não informado';
  return `<article class="lead-card lead-card--formation"><div><small>${escapeHtml(date)} · Formação</small><strong>${escapeHtml(lead.name)}</strong><span>${escapeHtml(lead.course_title || lead.button)}</span><ul><li>${escapeHtml(dentist)}</li><li>${escapeHtml(previousCourse)}</li></ul></div><div><small>${escapeHtml(lead.phone)}</small><a href="https://wa.me/${digits}" target="_blank" rel="noopener noreferrer">Chamar no WhatsApp <span>→</span></a></div></article>`;
}

document.querySelector('#refresh-leads').addEventListener('click', () => void loadLeads());
document.querySelector('#refresh-formation-leads').addEventListener('click', () => void loadLeads());
document.querySelector('#lead-search').addEventListener('input', renderContactList);
document.querySelector('#lead-filter').addEventListener('change', renderContactList);
document.querySelector('#journey-search').addEventListener('input', renderVisitorJourneys);
document.querySelector('#journey-filter').addEventListener('change', renderVisitorJourneys);

function updateLeadSelectionBar() {
  const visible = filteredContactLeads();
  const visibleSelected = visible.filter((lead) => selectedLeadIds.has(lead.id)).length;
  const selectAll = document.querySelector('#select-all-leads');
  selectAll.checked = visible.length > 0 && visibleSelected === visible.length;
  selectAll.indeterminate = visibleSelected > 0 && visibleSelected < visible.length;
  document.querySelector('#lead-selection-count').textContent = `${selectedLeadIds.size} ${selectedLeadIds.size === 1 ? 'selecionado' : 'selecionados'}`;
  ['#tag-selected-leads', '#mark-selected-leads', '#delete-selected-leads'].forEach((selector) => {
    document.querySelector(selector).disabled = selectedLeadIds.size === 0;
  });
}

document.querySelector('#select-all-leads').addEventListener('change', (event) => {
  filteredContactLeads().forEach((lead) => event.target.checked ? selectedLeadIds.add(lead.id) : selectedLeadIds.delete(lead.id));
  renderContactList();
});

document.querySelector('#leads-list').addEventListener('change', (event) => {
  if (!event.target.matches('.lead-select')) return;
  const id = event.target.closest('[data-lead-id]')?.dataset.leadId;
  if (!id) return;
  event.target.checked ? selectedLeadIds.add(id) : selectedLeadIds.delete(id);
  updateLeadSelectionBar();
});

document.querySelector('#leads-list').addEventListener('click', (event) => {
  const button = event.target.closest('[data-lead-action]');
  if (!button) return;
  const id = button.closest('[data-lead-id]')?.dataset.leadId;
  const lead = contactLeads.find((item) => item.id === id);
  if (!lead) return;
  if (button.dataset.leadAction === 'mark') void setLeadsMarked([id], !lead.marked);
  if (button.dataset.leadAction === 'tag') openLeadDialog('tag', [id]);
  if (button.dataset.leadAction === 'edit') openLeadDialog('edit', [id]);
  if (button.dataset.leadAction === 'delete') void deleteLeads([id]);
});

async function setLeadsMarked(ids, marked) {
  const { data, error } = await supabase.from('digital_card_leads').update({ marked, updated_at: new Date().toISOString() }).in('id', ids).select('id');
  if (error || data?.length !== ids.length) {
    window.alert(`Não foi possível ${marked ? 'marcar' : 'desmarcar'}: ${error?.message || 'permissão insuficiente.'}`);
    return;
  }
  contactLeads = contactLeads.map((lead) => ids.includes(lead.id) ? { ...lead, marked } : lead);
  renderContactList();
}

async function deleteLeads(ids) {
  const label = ids.length === 1 ? 'este contato' : `estes ${ids.length} contatos`;
  if (!window.confirm(`Excluir ${label}? Esta ação não pode ser desfeita.`)) return;
  const { data, error } = await supabase.from('digital_card_leads').delete().in('id', ids).select('id');
  if (error || data?.length !== ids.length) {
    window.alert(`Não foi possível excluir: ${error?.message || 'permissão insuficiente.'}`);
    return;
  }
  contactLeads = contactLeads.filter((lead) => !ids.includes(lead.id));
  ids.forEach((id) => selectedLeadIds.delete(id));
  document.querySelector('#metric-leads').textContent = (contactLeads.length + formationLeads.length).toLocaleString('pt-BR');
  renderContactList();
}

function normalizedTags(value) {
  return [...new Set(String(value).split(',').map((tag) => tag.trim()).filter(Boolean))].slice(0, 20);
}

function openLeadDialog(mode, ids) {
  const dialog = document.querySelector('#lead-dialog');
  const lead = contactLeads.find((item) => item.id === ids[0]);
  leadDialogMode = mode;
  dialog.dataset.ids = ids.join(',');
  document.querySelector('#lead-dialog-feedback').textContent = '';
  document.querySelector('#lead-dialog-fields').hidden = mode === 'tag';
  document.querySelector('#lead-dialog-mark').hidden = mode === 'tag';
  document.querySelector('#lead-dialog-title').textContent = mode === 'tag' ? `Etiquetar ${ids.length === 1 ? 'contato' : `${ids.length} contatos`}` : 'Editar contato';
  document.querySelector('#lead-edit-name').value = lead?.name || '';
  document.querySelector('#lead-edit-phone').value = lead?.phone || '';
  document.querySelector('#lead-edit-instagram').value = lead?.instagram_handle || '';
  document.querySelector('#lead-edit-profession').value = lead?.profession || '';
  document.querySelector('#lead-edit-tags').value = mode === 'tag' && ids.length > 1 ? '' : (lead?.tags || []).join(', ');
  document.querySelector('#lead-edit-marked').checked = Boolean(lead?.marked);
  dialog.showModal();
  (mode === 'tag' ? document.querySelector('#lead-edit-tags') : document.querySelector('#lead-edit-name')).focus();
}

function closeLeadDialog() {
  document.querySelector('#lead-dialog').close();
}

document.querySelector('#close-lead-dialog').addEventListener('click', closeLeadDialog);
document.querySelector('#cancel-lead-dialog').addEventListener('click', closeLeadDialog);
document.querySelector('#tag-selected-leads').addEventListener('click', () => openLeadDialog('tag', [...selectedLeadIds]));
document.querySelector('#mark-selected-leads').addEventListener('click', () => void setLeadsMarked([...selectedLeadIds], true));
document.querySelector('#delete-selected-leads').addEventListener('click', () => void deleteLeads([...selectedLeadIds]));

document.querySelector('#lead-dialog-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const dialog = document.querySelector('#lead-dialog');
  const ids = dialog.dataset.ids.split(',').filter(Boolean);
  const tags = normalizedTags(document.querySelector('#lead-edit-tags').value);
  const changes = leadDialogMode === 'tag'
    ? { tags, updated_at: new Date().toISOString() }
    : {
        name: document.querySelector('#lead-edit-name').value.trim(),
        phone: document.querySelector('#lead-edit-phone').value.trim(),
        instagram_handle: document.querySelector('#lead-edit-instagram').value.trim() || null,
        profession: document.querySelector('#lead-edit-profession').value.trim() || null,
        tags,
        marked: document.querySelector('#lead-edit-marked').checked,
        updated_at: new Date().toISOString(),
      };
  if (leadDialogMode === 'edit' && (!changes.name || !changes.phone)) return;
  const save = document.querySelector('#save-lead-dialog');
  save.disabled = true;
  document.querySelector('#lead-dialog-feedback').textContent = 'Salvando…';
  const { data, error } = await supabase.from('digital_card_leads').update(changes).in('id', ids).select('id');
  save.disabled = false;
  if (error || data?.length !== ids.length) {
    document.querySelector('#lead-dialog-feedback').textContent = error?.message || 'Não foi possível salvar todas as alterações.';
    return;
  }
  contactLeads = contactLeads.map((lead) => ids.includes(lead.id) ? { ...lead, ...changes } : lead);
  closeLeadDialog();
  renderContactList();
});

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

document.querySelector('#export-leads').addEventListener('click', () => {
  const filtered = filteredContactLeads();
  const rows = selectedLeadIds.size ? contactLeads.filter((lead) => selectedLeadIds.has(lead.id)) : filtered;
  if (!rows.length) {
    window.alert('Não há contatos para exportar.');
    return;
  }
  const header = ['Nome', 'Telefone', 'Instagram', 'Profissão', 'Origem', 'Unidade', 'Origem do acesso', 'Recebido em', 'Marcado', 'Etiquetas'];
  const csvRows = rows.map((lead) => [lead.name, lead.phone, lead.instagram_handle, lead.profession, lead.button, lead.unit, lead.source_origin, lead.created_at, lead.marked ? 'Sim' : 'Não', (lead.tags || []).join('; ')]);
  const csv = '\uFEFF' + [header, ...csvRows].map((row) => row.map(csvCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `contatos-instituto-vert-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  // O Safari do iPhone precisa de tempo para iniciar o download antes da URL temporária ser liberada.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

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
    content.company ||= {};
    content.formationSettings ||= {};
    content.formations = (content.formations || []).filter((item) => !isCloseFriendsFormation(item));
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
