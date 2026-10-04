import { loadCardContent, supabase, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './lib/supabase.js';

document.getElementById('year').textContent = new Date().getFullYear();

const leadDialog = document.querySelector('#lead-dialog');
const leadForm = document.querySelector('#lead-form');
const leadFeedback = document.querySelector('#lead-feedback');
const contactRouter = document.querySelector('#contact-router');
const contactRouterOptions = document.querySelector('#contact-router-options');
const privacyDialog = document.querySelector('#privacy-dialog');
const privacyForm = document.querySelector('#privacy-form');
const PRIVACY_STORAGE_KEY = 'vert_privacy_choice_v1';
const VISITOR_STORAGE_KEY = 'vert_card_visitor_id';
const INSTAGRAM_STORAGE_KEY = 'vert_card_instagram';
const CONSENT_VERSION = '2026-09-v5';
let trackingConsent = false;
let visitorInstagram = '';
let pendingLead = null;
let currentCompany = {};
let currentUnits = [];
let activeUnitId = '';

const UNIT_PHOTOS = {
  franca: { cover: '/assets/cartao/franca-recepcao.webp', gallery: [] },
  ribeirao: { cover: '/assets/cartao/ribeirao-recepcao.webp', gallery: [
    ['/assets/cartao/ribeirao-consultorio.webp', 'Consultório odontológico'],
    ['/assets/cartao/ribeirao-atendimento.webp', 'Sala de atendimento'],
    ['/assets/cartao/ribeirao-cadeira.webp', 'Cadeira odontológica'],
  ] },
};

function unitPhotos(unit) {
  return /ribeir/i.test(`${unit.city || ''} ${unit.name || ''} ${unit.id || ''}`) ? UNIT_PHOTOS.ribeirao : UNIT_PHOTOS.franca;
}

function activeUnits() { return currentUnits.filter((unit) => unit.active !== false); }

const SERVICE_OPTIONS = [
  { id: 'lentes', label: 'Lentes em resina', message: 'Olá! Sou {nome} e quero saber sobre lentes em resina na unidade {unidade}.', unitChoice: true },
  { id: 'clinico', label: 'Clínico geral', message: 'Olá! Sou {nome} e quero atendimento clínico geral na unidade {unidade}.', unitChoice: true },
  { id: 'curso', label: 'Cursos para dentistas', message: 'Olá! Sou {nome} e quero informações sobre os cursos do Instituto Vert. Sou {perfil}. {curso_anterior}', leadType: 'formation' },
  { id: 'locacao', label: 'Alugar sala em Ribeirão', message: 'Olá! Sou {nome} e quero informações sobre a locação de sala em Ribeirão Preto.', unit: 'Ribeirão Preto', leadType: 'rental' },
  { id: 'close_friends', label: 'Close Friends', message: 'Olá! Sou {nome} e quero saber como entrar no Close Friends do Instituto Vert.', leadType: 'close_friends' },
];

function renderServiceActions(company) {
  const container = document.getElementById('service-actions');
  const number = company.phone || activeUnits()[0]?.phone || '5516999657667';
  container.replaceChildren();
  SERVICE_OPTIONS.forEach((service, index) => {
    const link = document.createElement(service.unitChoice ? 'button' : 'a');
    link.className = 'service-action';
    if (service.unitChoice) {
      link.type = 'button';
      link.dataset.service = service.id;
    } else {
      link.href = whatsappUrl(number, service.message);
      link.target = '_blank'; link.rel = 'noopener noreferrer';
      link.dataset.track = service.id;
      const course = service.leadType === 'formation';
      prepareLeadLink(link, { message: service.message, label: service.label, unit: service.unit || '', leadType: service.leadType || 'contact', courseTitle: course ? 'Cursos para dentistas' : '', serviceId: service.id });
    }
    link.innerHTML = `<span class="service-action__number" aria-hidden="true">0${index + 1}</span><span>${service.label}</span><span class="service-action__arrow" aria-hidden="true">→</span>`;
    container.append(link);
  });
}

const DEFAULT_LOGOS = {
  primaryDark: new URL('./assets/logo-principal-marrom.jpeg', import.meta.url).href,
  primaryLight: new URL('./assets/logo-principal-clara.jpeg', import.meta.url).href,
  horizontal: new URL('./assets/logo-secundaria-marrom.jpeg', import.meta.url).href,
};

function safeUrl(value, fallback = '#') {
  if (!value) return fallback;
  try {
    const url = new URL(value, window.location.origin);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) ? url.href : fallback;
  } catch { return fallback; }
}

function storageGet(key) { try { return window.localStorage.getItem(key) || ''; } catch { return ''; } }
function storageSet(key, value) { try { window.localStorage.setItem(key, value); } catch {} }
function storageRemove(key) { try { window.localStorage.removeItem(key); } catch {} }

function visitorId() {
  let id = storageGet(VISITOR_STORAGE_KEY);
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return id;
  id = crypto.randomUUID();
  storageSet(VISITOR_STORAGE_KEY, id);
  return id;
}

function normalizeInstagramHandle(value) {
  const handle = String(value || '').trim().replace(/^@+/, '').replace(/[^a-zA-Z0-9._]/g, '').slice(0, 30);
  return handle ? `@${handle}` : '';
}

function applyImageSource(image, value, fallback) {
  if (!image) return;
  image.onerror = () => {
    image.onerror = null;
    image.src = fallback;
  };
  image.src = safeUrl(value, fallback);
}

function whatsappUrl(phone, message) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : '#';
}

function personalizeMessage(message, lead = {}) {
  const audience = lead.isDentist === true ? 'Dentista' : lead.isDentist === false ? 'Estudante de Odontologia' : '';
  const courseExperience = lead.hasPreviousCourse === true
    ? 'Já fiz outros cursos.'
    : lead.hasPreviousCourse === false
      ? 'Será o meu primeiro curso.'
      : '';
  return String(message || '')
    .replaceAll('{nome}', lead.name || '')
    .replaceAll('{telefone}', lead.phone || '')
    .replaceAll('{profissao}', lead.profession || '')
    .replaceAll('{curso}', lead.course || '')
    .replaceAll('{dentista}', audience)
    .replaceAll('{perfil}', audience)
    .replaceAll('{curso_anterior}', courseExperience)
    .replaceAll('{cidade}', lead.city || '')
    .replaceAll('{unidade}', lead.unit || '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function applyPreMessage(destination, message, lead = {}) {
  const safe = safeUrl(destination);
  if (!message || safe === '#') return safe;
  try {
    const url = new URL(safe);
    if (url.hostname === 'wa.me' || url.hostname.endsWith('whatsapp.com')) url.searchParams.set('text', personalizeMessage(message, lead));
    return url.href;
  } catch { return safe; }
}

function prepareLeadLink(link, { collectLead = true, message = '', label = 'Contato', unit = '', leadType = 'contact', courseId = '', courseTitle = '', serviceId = '' } = {}) {
  if (!collectLead) return link;
  link.dataset.collectLead = 'true';
  link.dataset.preMessage = message;
  link.dataset.leadLabel = label;
  link.dataset.leadUnit = unit;
  link.dataset.leadType = leadType;
  if (serviceId) link.dataset.serviceId = serviceId;
  if (courseId) link.dataset.courseId = courseId;
  if (courseTitle) link.dataset.courseTitle = courseTitle;
  return link;
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element && value) element.textContent = value;
}

function trackableLink(url, track, unit) {
  const link = document.createElement('a');
  link.href = safeUrl(url); link.target = '_blank'; link.rel = 'noopener noreferrer'; link.dataset.track = track;
  if (unit) link.dataset.unit = unit;
  return link;
}

function renderWhatsApp(units, company) {
  const container = document.querySelector('.whatsapp-actions');
  container.replaceChildren();
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'contact-button contact-button--primary contact-button--router';
  button.dataset.openContactRouter = '';
  button.innerHTML = '<span class="contact-button__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.3-4.7a8.5 8.5 0 1 1 16.2-4.1Z"/><path d="M8.2 7.7c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.5l.8 1.8c.1.3.1.5-.1.7l-.6.8c-.2.2-.1.4 0 .6.5 1 1.3 1.8 2.3 2.3.2.1.4.2.6 0l.8-1c.2-.2.4-.3.7-.2l1.9.9c.3.1.5.3.5.5 0 .3-.1 1.4-.7 2-.6.7-1.5.9-2.4.7-1-.2-2.3-.7-3.9-2.1-1.3-1.2-2.2-2.6-2.5-3.6-.3-.9 0-2.1.9-3.5Z"/></svg></span>';
  const copy = document.createElement('span'); copy.innerHTML = '<small>Atendimento rápido</small>';
  const strong = document.createElement('strong'); strong.textContent = company.contactButtonLabel || 'Falar no WhatsApp'; copy.append(strong); button.append(copy);
  const arrow = document.createElement('span'); arrow.className = 'contact-button__arrow'; arrow.setAttribute('aria-hidden', 'true'); arrow.textContent = '→'; button.append(arrow); container.append(button);
  renderContactRouter(units, company);
}

function renderContactRouter(units, company, service = null) {
  const activeUnits = units.filter((unit) => unit.active !== false);
  const sharedNumber = company.phone || activeUnits[0]?.phone;
  const useSharedNumber = (company.whatsappMode || 'shared') === 'shared';
  contactRouterOptions.replaceChildren();

  activeUnits.forEach((unit) => {
    const unitName = unit.city || unit.name || 'Unidade';
    const message = service?.message || unit.whatsappMessage || company.whatsappMessage || 'Olá! Meu nome é {nome} e quero agendar uma avaliação em {unidade}.';
    const phone = useSharedNumber ? sharedNumber : (unit.phone || sharedNumber);
    const destination = useSharedNumber
      ? whatsappUrl(sharedNumber, personalizeMessage(message, { unit: unitName }))
      : (unit.contactUrl || whatsappUrl(phone, personalizeMessage(message, { unit: unitName })));
    const link = trackableLink(applyPreMessage(destination, message, { unit: unitName }), 'whatsapp_agendar', unit.id);
    link.className = 'contact-router__option';
    link.innerHTML = `<span><small>${service ? escapeText(service.label) : 'Nova consulta'}</small><strong>${escapeText(service ? unitName : (unit.contactButtonLabel || `Consulta em ${unitName}`))}</strong></span><b aria-hidden="true">→</b>`;
    prepareLeadLink(link, { collectLead: unit.collectLead !== false, message, label: `${service?.label || 'Consulta'} — ${unitName}`, unit: unitName, leadType: 'appointment', serviceId: service?.id || '' });
    contactRouterOptions.append(link);
  });

  if (service) return;
  const patientMessage = company.patientMessage || 'Olá! Meu nome é {nome}, já sou paciente do Instituto Vert e preciso de atendimento.';
  const patient = trackableLink(whatsappUrl(sharedNumber, personalizeMessage(patientMessage)), 'whatsapp_paciente');
  patient.className = 'contact-router__option';
  patient.innerHTML = '<span><small>Atendimento</small><strong>Já sou paciente</strong></span><b aria-hidden="true">→</b>';
  prepareLeadLink(patient, { message: patientMessage, label: 'Já sou paciente', leadType: 'patient' });
  contactRouterOptions.append(patient);

  const formationSection = document.querySelector('#formacoes');
  if (formationSection && !formationSection.hidden) {
    const formation = document.createElement('a');
    formation.href = '#formacoes';
    formation.className = 'contact-router__option';
    formation.dataset.contactRouteFormation = '';
    formation.innerHTML = '<span><small>Educação Vert</small><strong>Cursos e formações</strong></span><b aria-hidden="true">↓</b>';
    contactRouterOptions.append(formation);
  }
}

function renderUnits(units) {
  const grid = document.querySelector('.unit-grid'); grid.replaceChildren();
  units.filter((unit) => unit.active !== false).forEach((unit) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'unit-tile'; button.dataset.unitOpen = unit.id;
    const city = unit.city || unit.name || 'Unidade';
    button.innerHTML = `<img src="${unitPhotos(unit).cover}" alt="" loading="lazy" /><span><strong>${escapeText(city)}</strong><small>Ver unidade <span aria-hidden="true">→</span></small></span>`;
    grid.append(button);
  });
}

function showUnit(unit, updateUrl = true) {
  if (!unit) return;
  activeUnitId = unit.id;
  document.body.classList.add('unit-view');
  const city = unit.city || unit.name || 'Unidade';
  const photos = unitPhotos(unit);
  document.querySelector('.profile').hidden = true;
  document.querySelector('.units').hidden = true;
  document.getElementById('card-extras').hidden = true;
  document.getElementById('unit-detail').hidden = false;
  document.getElementById('unit-detail-title').textContent = city;
  const address = document.getElementById('unit-detail-address');
  address.textContent = unit.address || '';
  address.hidden = !unit.address;
  const cover = document.getElementById('unit-detail-image');
  cover.src = photos.cover; cover.alt = `Recepção do Instituto Vert em ${city}`;
  const gallery = document.getElementById('unit-detail-gallery'); gallery.replaceChildren();
  photos.gallery.forEach(([src, alt]) => {
    const image = document.createElement('img'); image.src = src; image.alt = alt; image.loading = 'lazy'; gallery.append(image);
  });
  gallery.hidden = photos.gallery.length === 0;
  const actions = document.getElementById('unit-detail-actions'); actions.replaceChildren();
  const map = trackableLink(unit.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(unit.address || `Instituto Vert ${city}`)}`, 'como_chegar', unit.id);
  map.textContent = 'Como chegar'; actions.append(map);
  const shared = (currentCompany.whatsappMode || 'shared') === 'shared';
  const phone = shared ? currentCompany.phone : (unit.phone || currentCompany.phone);
  const message = unit.whatsappMessage || currentCompany.whatsappMessage || 'Olá! Sou {nome} e quero agendar uma avaliação em {unidade}.';
  ['WhatsApp', 'Agendar'].forEach((label) => {
    const link = trackableLink(unit.contactUrl && !shared ? unit.contactUrl : whatsappUrl(phone, personalizeMessage(message, { unit: city })), label === 'Agendar' ? 'whatsapp_agendar' : 'whatsapp_unidade', unit.id);
    link.textContent = label;
    prepareLeadLink(link, { collectLead: unit.collectLead !== false, message, label: `${label} — ${city}`, unit: city, leadType: 'appointment' });
    actions.append(link);
  });
  const other = activeUnits().find((candidate) => candidate.id !== unit.id);
  const otherButton = document.getElementById('unit-other');
  otherButton.textContent = other?.city || other?.name || '';
  otherButton.dataset.unitOpen = other?.id || '';
  document.querySelector('.unit-detail__other').hidden = !other;
  if (updateUrl) history.pushState({ unitId: unit.id }, '', `#unidade-${encodeURIComponent(unit.id)}`);
  registrarClique('ver_unidade', unit.id);
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function showCard(updateUrl = true) {
  activeUnitId = '';
  document.body.classList.remove('unit-view');
  document.querySelector('.profile').hidden = false;
  document.querySelector('.units').hidden = false;
  document.getElementById('card-extras').hidden = false;
  document.getElementById('unit-detail').hidden = true;
  if (updateUrl) history.replaceState({}, '', '#unidades');
  window.scrollTo({ top: updateUrl ? document.querySelector('.units').offsetTop : 0, behavior: 'instant' });
}

function renderCards(sectionId, listId, items, kind) {
  const active = (items || []).filter((item) => item.active !== false && (item.title || item.text)); const section = document.getElementById(sectionId);
  if (!active.length) { section.hidden = true; return; }
  section.hidden = false; const list = document.getElementById(listId); list.replaceChildren();
  active.forEach((item) => {
    const card = document.createElement('article'); card.className = kind === 'campaign' ? 'campaign-card' : 'testimonial-card';
    if (kind === 'campaign') { const title = document.createElement('h3'); title.textContent = item.title; const copy = document.createElement('p'); copy.textContent = item.description || ''; card.append(title, copy); if (item.url) { const link = trackableLink(item.url, 'campanha'); link.textContent = item.buttonLabel || 'Saiba mais'; card.append(link); } }
    else { const quote = document.createElement('blockquote'); quote.textContent = `“${item.text}”`; const author = document.createElement('cite'); author.textContent = item.author || 'Paciente'; card.append(quote, author); }
    list.append(card);
  });
}

function renderExtraLinks(items) {
  const section = document.querySelector('.dentist-link'); const container = section.querySelector('div:last-child'); const active = (items || []).filter((item) => item.active !== false && item.url);
  if (!active.length) { section.hidden = true; return; } section.hidden = false; container.replaceChildren();
  active.forEach((item) => {
    const link = trackableLink(applyPreMessage(item.url, item.preMessage), item.id || 'link_extra');
    link.textContent = item.title || 'Acessar';
    prepareLeadLink(link, { collectLead: item.collectLead !== false, message: item.preMessage || '', label: item.title || 'Link de contato' });
    const arrow = document.createElement('span'); arrow.textContent = '→'; link.append(arrow); container.append(link);
  });
}

function isCloseFriendsFormation(item = {}) {
  return item.category === 'close_friends' || /close\s*friends/i.test(item.title || '');
}

function renderFormations(items, settings, company) {
  const section = document.querySelector('#formacoes');
  const container = document.querySelector('#formation-list');
  const active = (items || []).filter((item) => item.active !== false && item.title && !isCloseFriendsFormation(item));
  if (!active.length) { section.hidden = true; return; }
  section.hidden = false;
  document.querySelector('#formations-eyebrow').textContent = settings.eyebrow || 'Educação Vert';
  document.querySelector('#formacoes-titulo').textContent = settings.title || 'Formação que transforma técnica em confiança.';
  document.querySelector('#formations-description').textContent = settings.description || 'Cursos e experiências para dentistas e estudantes de Odontologia.';
  container.replaceChildren();
  active.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'formation-card';
    const heading = document.createElement('div');
    const eyebrow = document.createElement('small'); eyebrow.textContent = item.eyebrow || item.format || 'Formação Vert';
    const title = document.createElement('h3'); title.textContent = item.title;
    heading.append(eyebrow, title);
    const description = document.createElement('p'); description.textContent = item.description || 'Conheça esta experiência de formação do Instituto Vert.';
    const meta = document.createElement('div'); meta.className = 'formation-card__meta';
    [item.format, item.schedule, item.location].filter(Boolean).forEach((value) => { const span = document.createElement('span'); span.textContent = value; meta.append(span); });
    const message = item.whatsappMessage || settings.whatsappMessage || 'Olá! Meu nome é {nome}. Quero informações sobre {curso}. Sou {perfil}. {curso_anterior}';
    const formationPhone = (company.whatsappMode || 'shared') === 'shared'
      ? company.phone
      : (item.whatsappPhone || settings.phone || company.phone);
    const destination = whatsappUrl(formationPhone, personalizeMessage(message, { course: item.title }));
    const link = trackableLink(destination, `formacao_${item.id || 'curso'}`);
    link.className = 'formation-card__action';
    link.innerHTML = `<span>${escapeText(item.buttonLabel || settings.buttonLabel || 'Quero saber mais')}</span><b aria-hidden="true">→</b>`;
    prepareLeadLink(link, { message, label: `Formação — ${item.title}`, leadType: 'formation', courseId: item.id || '', courseTitle: item.title });
    card.append(heading, description);
    card.append(meta);
    card.append(link);
    container.append(card);
  });
}

function escapeText(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

function renderContent(content) {
  if (!content) return; const company = content.company || {}; const units = content.units || []; const formationSettings = content.formationSettings || {}; currentCompany = company; currentUnits = units;
  setText('.identity-meta p', company.category); setText('#titulo', company.name); setText('.intro .eyebrow', company.ctaLabel); setText('#cms-headline', company.headline); setText('#cms-description', company.description); setText('.card-footer__base p', company.tagline);
  const logoSources = {
    primaryDark: company.logoPrimaryDark || DEFAULT_LOGOS.primaryDark,
    primaryLight: company.logoPrimaryLight || DEFAULT_LOGOS.primaryLight,
    horizontal: company.logoHorizontal || DEFAULT_LOGOS.horizontal,
  };
  const logo = document.querySelector('.brand img');
  const selectedVariant = company.logoVariant || 'primaryDark';
  const selectedLogo = logoSources[selectedVariant] || logoSources.primaryDark;
  applyImageSource(logo, selectedLogo, DEFAULT_LOGOS.primaryDark);
  const cities = units.filter((unit) => unit.active !== false).map((unit) => unit.city).filter(Boolean); setText('.identity-meta span', company.identityLine || cities.join(' • '));
  renderUnits(units); renderCards('campanhas', 'campaign-list', content.campaigns, 'campaign'); renderCards('depoimentos', 'testimonial-list', content.testimonials, 'testimonial'); renderFormations(content.formations, formationSettings, company); renderExtraLinks(content.links); renderWhatsApp(units, company); renderServiceActions(company);
  const instagram = document.querySelector('.quick-links a[data-track="instagram"]'); if (instagram && company.instagram) { instagram.href = safeUrl(company.instagram); const label = instagram.querySelector('small'); if (label) label.textContent = company.instagramLabel || '@institutovert.br'; }
  const anitaInstagram = document.querySelector('.quick-links a[data-track="instagram_anita"]'); if (anitaInstagram && company.anitaInstagram) { anitaInstagram.href = safeUrl(company.anitaInstagram); const label = anitaInstagram.querySelector('small'); if (label) label.textContent = company.anitaInstagramLabel || '@dra.anitaalmeida'; }
  const floating = document.querySelector('.floating-whatsapp');
  const floatingLabel = floating.querySelector('span:last-child');
  if (floatingLabel) floatingLabel.textContent = company.contactButtonLabel || 'Falar no WhatsApp';
  if (activeUnitId) showUnit(activeUnits().find((unit) => unit.id === activeUnitId), false);
  else if (location.hash.startsWith('#unidade-')) showUnit(activeUnits().find((unit) => unit.id === decodeURIComponent(location.hash.slice(9))), false);
  bindTracking();
}

function detectarDispositivo() { return window.matchMedia('(max-width: 760px)').matches ? 'celular' : 'computador'; }
function detectarOrigem() {
  const params = new URLSearchParams(window.location.search);
  const origemInformada = params.get('origem');
  if (origemInformada) return `instagram:${origemInformada}`.slice(0, 120);
  const campanha = ['utm_source', 'utm_medium', 'utm_campaign'].map((chave) => { const valor = params.get(chave); return valor ? `${chave.replace('utm_', '')}=${valor}` : ''; }).filter(Boolean).join(';');
  if (campanha) return campanha.slice(0, 120); if (!document.referrer) return 'direto';
  try { const origem = new URL(document.referrer).hostname.replace(/^www\./, ''); return origem === window.location.hostname ? 'direto' : origem.slice(0, 120); } catch { return 'direto'; }
}

/**
 * Duas camadas de medição:
 * - sempre: contagem anônima (botão, unidade, origem, dispositivo), sem
 *   nenhum identificador do visitante;
 * - só com consentimento: visitor_id e @ do Instagram, que ligam os eventos
 *   a uma jornada.
 */
function eventoPadrao(botao) {
  if (botao === 'visualizacao_pagina') return 'page_view';
  if (botao === 'consentimento_autorizado' || botao === 'preferencias_privacidade') return 'consent';
  return 'cta_click';
}

function registrarClique(botao, unidade = null, evento = null) {
  if (new URLSearchParams(window.location.search).get('preview') === 'admin') return;
  if (!trackingConsent || storageGet(PRIVACY_STORAGE_KEY) !== `accepted:${CONSENT_VERSION}`) return;
  const payload = {
    superficie: 'digital_card',
    evento: evento || eventoPadrao(botao),
    pagina: window.location.pathname.slice(0, 300),
    botao: String(botao).slice(0, 40),
    unidade: unidade ? String(unidade).slice(0, 40) : null,
    origem: detectarOrigem(),
    dispositivo: detectarDispositivo(),
    visitor_id: trackingConsent ? visitorId() : null,
    instagram_handle: trackingConsent ? visitorInstagram || null : null,
    consent_version: trackingConsent ? CONSENT_VERSION : null,
  };
  void fetch(`${SUPABASE_URL}/rest/v1/digital_card_clicks`, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json', apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`, Prefer: 'return=minimal' }, body: JSON.stringify(payload) }).catch(() => {});
}

function openPrivacyDialog() {
  privacyDialog.showModal();
}

function initializePrivacy() {
  if (new URLSearchParams(window.location.search).get('preview') === 'admin') return;
  const choice = storageGet(PRIVACY_STORAGE_KEY);
  visitorInstagram = normalizeInstagramHandle(storageGet(INSTAGRAM_STORAGE_KEY));
  trackingConsent = choice === `accepted:${CONSENT_VERSION}`;
  if (trackingConsent) registrarClique('visualizacao_pagina');
  if (!trackingConsent && choice !== `declined:${CONSENT_VERSION}`) openPrivacyDialog();
}

privacyForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const wasTracking = trackingConsent;
  storageSet(PRIVACY_STORAGE_KEY, `accepted:${CONSENT_VERSION}`);
  trackingConsent = true;
  privacyDialog.close();
  // Só após a escolha afirmativa os eventos passam a ser registrados.
  registrarClique(wasTracking ? 'preferencias_privacidade' : 'consentimento_autorizado');
});

document.querySelector('[data-privacy-decline]').addEventListener('click', () => {
  trackingConsent = false;
  visitorInstagram = '';
  storageSet(PRIVACY_STORAGE_KEY, `declined:${CONSENT_VERSION}`);
  storageRemove(VISITOR_STORAGE_KEY);
  storageRemove(INSTAGRAM_STORAGE_KEY);
  privacyDialog.close();
});

document.querySelector('[data-privacy-settings]').addEventListener('click', openPrivacyDialog);
privacyDialog.addEventListener('cancel', (event) => event.preventDefault());

function bindTracking() {
  document.querySelectorAll('[data-track]:not([data-tracking-bound])').forEach((link) => { link.dataset.trackingBound = 'true'; link.addEventListener('click', () => { if (link.dataset.collectLead !== 'true') registrarClique(link.dataset.track, link.dataset.unit || null); }); });
  document.querySelectorAll('a[target="_blank"]').forEach((link) => link.setAttribute('aria-label', `${link.textContent.trim()} — abre em uma nova aba`));
}

function initializeScrollMotion() {
  const header = document.querySelector('.card-header');
  const revealTargets = [...document.querySelectorAll('main > section:not(.profile), footer')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return;

  document.body.classList.add('js-motion');
  revealTargets.forEach((target, index) => {
    target.classList.add('scroll-reveal');
    target.style.setProperty('--reveal-delay', `${Math.min(index * 28, 140)}ms`);
  });

  const atualizarProgresso = () => {
    const maximo = document.documentElement.scrollHeight - window.innerHeight;
    const progresso = maximo > 0 ? Math.min(1, window.scrollY / maximo) : 0;
    document.documentElement.style.setProperty('--card-progress', progresso.toString());
    document.documentElement.style.setProperty('--card-progress-y', `${progresso * -2}%`);
    document.documentElement.style.setProperty('--card-photo-shift', `${progresso * -1.4}%`);
    header?.classList.toggle('card-header--scrolled', window.scrollY > 40);
  };

  atualizarProgresso();
  window.addEventListener('scroll', atualizarProgresso, { passive: true });
  window.addEventListener('resize', atualizarProgresso, { passive: true });

  if (typeof IntersectionObserver === 'undefined') {
    revealTargets.forEach((target) => target.classList.add('is-visible'));
    return;
  }

  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) {
        entrada.target.classList.add('is-visible');
        observador.unobserve(entrada.target);
      }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
  revealTargets.forEach((target) => observador.observe(target));
}

document.addEventListener('click', (event) => {
  const unitButton = event.target.closest('[data-unit-open]');
  if (unitButton) { showUnit(activeUnits().find((unit) => unit.id === unitButton.dataset.unitOpen)); return; }
  if (event.target.closest('[data-unit-back]')) {
    if (history.state?.unitId) history.back(); else showCard();
    return;
  }
  const serviceButton = event.target.closest('[data-service]');
  if (serviceButton) {
    const service = SERVICE_OPTIONS.find((option) => option.id === serviceButton.dataset.service);
    renderContactRouter(currentUnits, currentCompany, service);
    contactRouter.showModal();
    registrarClique(service.id);
    return;
  }
  const routerTrigger = event.target.closest('[data-open-contact-router]');
  if (routerTrigger) {
    event.preventDefault();
    renderContactRouter(currentUnits, currentCompany);
    contactRouter.showModal();
    return;
  }
  if (event.target.closest('[data-contact-route-formation]')) contactRouter.close();
  const link = event.target.closest('a[data-collect-lead="true"]');
  if (!link) return;
  event.preventDefault();
  pendingLead = {
    destination: link.href,
    message: link.dataset.preMessage || '',
    button: link.dataset.leadLabel || link.textContent.trim(),
    unit: link.dataset.leadUnit || link.dataset.unit || '',
    track: link.dataset.track || 'contato',
    leadType: link.dataset.leadType || 'contact',
    serviceId: link.dataset.serviceId || '',
    courseId: link.dataset.courseId || '',
    courseTitle: link.dataset.courseTitle || '',
  };
  if (contactRouter.open) contactRouter.close();
  leadForm.reset();
  document.querySelector('#lead-instagram').value = visitorInstagram || storageGet(INSTAGRAM_STORAGE_KEY);
  const type = pendingLead.leadType;
  const professional = ['formation', 'rental', 'close_friends'].includes(type);
  const title = type === 'formation' ? `Interesse em ${pendingLead.courseTitle}`
    : type === 'rental' ? 'Alugar sala em Ribeirão'
    : type === 'close_friends' ? 'Close Friends'
    : type === 'patient' ? 'Seu atendimento'
    : type === 'appointment' ? 'Seu atendimento'
    : pendingLead.button || 'Contato';
  const description = type === 'formation' ? 'Qual curso combina com você?'
    : type === 'rental' ? 'Locação para dentistas e profissionais da saúde.'
    : type === 'close_friends' ? 'O que você gostaria de acompanhar?'
    : pendingLead.unit ? `${pendingLead.unit} · Só mais um detalhe.` : 'Só mais um detalhe para direcionar você.';
  pendingLead.stepTitle = title;
  pendingLead.stepDescription = description;
  pendingLead.audience = type === 'rental' ? 'Profissionais da saúde'
    : professional ? 'Área odontológica' : 'Atendimento ao paciente';
  document.querySelector('#professional-city-label').textContent = type === 'rental' ? 'Cidade onde atua' : 'Cidade onde atua ou estuda';
  const roleOptions = leadForm.elements.professionalRole.options;
  for (const option of roleOptions) {
    if (option.value === 'estudante' || option.value === 'outro') {
      option.hidden = type === 'rental';
      option.disabled = type === 'rental';
    }
    if (option.value === 'saude') {
      option.hidden = type !== 'rental';
      option.disabled = type !== 'rental';
    }
  }
  const sections = {
    '#patient-lead-fields': !professional,
    '#professional-lead-fields': professional,
    '#formation-lead-fields': type === 'formation',
    '#rental-lead-fields': type === 'rental',
    '#friends-lead-fields': type === 'close_friends',
    '#patient-extra-fields': !professional,
    '#professional-extra-fields': professional,
    '#formation-extra-fields': type === 'formation',
    '#rental-extra-fields': type === 'rental',
  };
  Object.entries(sections).forEach(([selector, visible]) => {
    const section = document.querySelector(selector);
    section.hidden = !visible;
    section.querySelectorAll('input,select').forEach((field) => { field.disabled = !visible; });
  });
  updateHealthProfessionField();
  // Não repete o que o botão já informou (unidade escolhida; "já sou paciente").
  const unitKnown = !professional && !!pendingLead.unit;
  const statusKnown = type === 'patient';
  const toggleField = (name, hide) => { const field = leadForm.elements[name]; const label = field.closest('label'); label.hidden = hide; field.disabled = hide || field.closest('[hidden]') !== null; };
  if (!professional) { toggleField('patientUnit', unitKnown); toggleField('patientStatus', statusKnown); }
  if (!professional) {
    if (type === 'patient') leadForm.elements.patientStatus.value = 'atual';
    if (pendingLead.unit) leadForm.elements.patientUnit.value = pendingLead.unit;
    if (pendingLead.serviceId === 'lentes') leadForm.elements.patientInterest.value = 'Lentes em resina';
    if (pendingLead.serviceId === 'clinico') leadForm.elements.patientInterest.value = 'Consulta clínica';
  }
  leadFeedback.textContent = '';
  document.querySelector('#lead-step-feedback').textContent = '';
  setLeadStep(1);
  registrarClique(pendingLead.track, pendingLead.unit || null, 'form_opened');
  leadDialog.showModal();
  requestAnimationFrame(() => document.querySelector('#lead-name').focus());
}, true);

function updateHealthProfessionField() {
  const field = document.querySelector('#health-profession-field');
  const enabled = pendingLead?.leadType === 'rental' && leadForm.elements.professionalRole.value === 'saude';
  field.hidden = !enabled;
  field.querySelector('input').disabled = !enabled;
}
leadForm.elements.professionalRole.addEventListener('change', updateHealthProfessionField);

function setLeadStep(step) {
  const first = step === 1;
  document.querySelector('#lead-step-one').hidden = !first;
  document.querySelector('#lead-step-two').hidden = first;
  document.querySelector('.lead-progress').setAttribute('aria-valuenow', String(step));
  document.querySelector('#lead-dialog-eyebrow').textContent = first ? 'Contato rápido' : 'Quase pronto';
  document.querySelector('#lead-dialog-title').textContent = first ? 'Vamos conversar?' : pendingLead.stepTitle;
  document.querySelector('#lead-dialog-description').textContent = first
    ? 'Seu nome e WhatsApp para nossa equipe falar com você.'
    : pendingLead.stepDescription;
  leadDialog.scrollTo({ top: 0, behavior: 'instant' });
}

function advanceLeadForm() {
  const name = document.querySelector('#lead-name');
  const phone = document.querySelector('#lead-phone');
  const feedback = document.querySelector('#lead-step-feedback');
  feedback.textContent = '';
  if (!name.reportValidity()) return;
  if (name.value.trim().length < 2) { feedback.textContent = 'Informe seu nome para continuar.'; name.focus(); return; }
  if (!phone.reportValidity()) return;
  if (phone.value.replace(/\D/g, '').length < 10) {
    feedback.textContent = 'Informe um WhatsApp válido com DDD.';
    phone.focus();
    return;
  }
  setLeadStep(2);
  const section = document.querySelector(pendingLead.leadType === 'formation' || pendingLead.leadType === 'rental' || pendingLead.leadType === 'close_friends'
    ? '#professional-lead-fields' : '#patient-lead-fields');
  requestAnimationFrame(() => section.querySelector('input:not([disabled]), select:not([disabled])')?.focus());
}
document.querySelector('#lead-next').addEventListener('click', advanceLeadForm);
document.querySelector('[data-lead-back]').addEventListener('click', () => {
  setLeadStep(1);
  requestAnimationFrame(() => document.querySelector('#lead-name').focus());
});
document.querySelector('#lead-step-one').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') { event.preventDefault(); advanceLeadForm(); }
});

window.addEventListener('popstate', () => {
  const id = location.hash.startsWith('#unidade-') ? decodeURIComponent(location.hash.slice(9)) : '';
  const unit = activeUnits().find((candidate) => candidate.id === id);
  if (unit) showUnit(unit, false);
  else showCard(false);
});

document.querySelector('[data-close-lead]').addEventListener('click', () => leadDialog.close());
leadDialog.addEventListener('click', (event) => { if (event.target === leadDialog) leadDialog.close(); });
document.querySelector('[data-close-contact-router]').addEventListener('click', () => contactRouter.close());
contactRouter.addEventListener('click', (event) => { if (event.target === contactRouter) contactRouter.close(); });

leadForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!pendingLead) return;
  const formData = new FormData(leadForm);
  const lead = {
    name: String(formData.get('name') || '').trim(),
    phone: String(formData.get('phone') || '').trim(),
    profession: ({ dentista: 'Dentista', estudante: 'Estudante de Odontologia', outro: 'Profissional da área odontológica', saude: 'Profissional da saúde' })[formData.get('professionalRole')]
      || String(formData.get('patientProfession') || '').trim(),
    instagram: normalizeInstagramHandle(formData.get('instagram')),
    isDentist: formData.get('professionalRole') === 'dentista' ? true : formData.get('professionalRole') === 'estudante' ? false : null,
    hasPreviousCourse: formData.get('hasPreviousCourse') === 'yes' ? true : formData.get('hasPreviousCourse') === 'no' ? false : null,
    city: String(formData.get('professionalCity') || '').trim(),
    course: pendingLead.courseTitle || '',
    unit: String(formData.get('patientUnit') || pendingLead.unit || '').trim(),
  };
  const answers = pendingLead.leadType === 'formation' ? {
    perfil: lead.profession, cidade: lead.city, ja_fez_curso: lead.hasPreviousCourse,
    interesse: String(formData.get('courseInterest') || ''),
  } : pendingLead.leadType === 'rental' ? {
    perfil: lead.profession, cidade: lead.city,
    profissao: String(formData.get('healthProfession') || '').trim(),
    finalidade: String(formData.get('rentalPurpose') || '').trim(), frequencia: String(formData.get('rentalFrequency') || ''),
  } : pendingLead.leadType === 'close_friends' ? {
    perfil: lead.profession, cidade: lead.city, interesse: String(formData.get('friendsInterest') || ''),
  } : {
    situacao: String(formData.get('patientStatus') || (pendingLead.leadType === 'patient' ? 'atual' : '')),
    interesse: String(formData.get('patientInterest') || ''),
    unidade: lead.unit,
    profissao: lead.profession,
  };
  if (lead.phone.replace(/\D/g, '').length < 10) {
    leadFeedback.textContent = 'Informe um telefone válido com DDD.';
    return;
  }
  if (pendingLead.leadType === 'rental' && !['dentista', 'saude'].includes(formData.get('professionalRole'))) {
    leadFeedback.textContent = 'A locação é exclusiva para dentistas e profissionais da saúde.';
    return;
  }
  const submit = leadForm.querySelector('[type="submit"]');
  if (submit.disabled) return;
  submit.disabled = true;
  leadFeedback.textContent = 'Salvando seus dados…';
  let destinationForStorage = pendingLead.destination;
  try { const url = new URL(destinationForStorage); url.search = ''; destinationForStorage = url.href; } catch { destinationForStorage = ''; }
  const intencao = pendingLead.leadType === 'formation' ? 'curso'
    : pendingLead.leadType === 'rental' ? 'locacao'
    : pendingLead.leadType === 'close_friends' ? 'close_friends'
    : pendingLead.leadType === 'patient' ? 'paciente_atual'
    : pendingLead.serviceId === 'lentes' ? 'lentes' : 'avaliacao';
  // Origem, campanha e página só acompanham o contato se as métricas foram autorizadas.
  const params = new URLSearchParams(window.location.search);
  const utm = {};
  if (trackingConsent) {
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((chave) => { const valor = params.get(chave); if (valor) utm[chave] = valor.slice(0, 100); });
    if (!utm.utm_source && params.get('origem')) utm.utm_source = `instagram:${params.get('origem')}`.slice(0, 100);
  }
  let salvo = false;
  try {
    // Mesmo motor da landing: grava no painel e no CRM, deduplicando pelo telefone.
    const envio = supabase.rpc('site_capturar_lead', { p: {
      superficie: 'digital_card',
      intencao,
      tipo_painel: pendingLead.leadType,
      // O envio é a ação afirmativa específica para responder ao contato;
      // a escolha de métricas acima continua independente.
      consentimento: true,
      nome: lead.name,
      telefone: lead.phone,
      profissao: lead.profession || null,
      rotulo: pendingLead.button,
      unidade: lead.unit || null,
      destino: destinationForStorage || null,
      dentista: lead.isDentist,
      ja_fez_curso: lead.hasPreviousCourse,
      respostas: answers,
      cidade: lead.city || null,
      curso_id: pendingLead.courseId || null,
      curso_titulo: pendingLead.courseTitle || null,
      visitor_id: trackingConsent ? visitorId() : null,
      instagram: lead.instagram || null,
      utm,
      referrer: trackingConsent ? detectarOrigem() : null,
      pagina: trackingConsent ? window.location.pathname : null,
      cta: pendingLead.track,
    } });
    const limite = new Promise((resolve) => window.setTimeout(() => resolve({ data: null, error: { message: 'tempo' } }), 4000));
    const { data, error } = await Promise.race([envio, limite]);
    if (!error && data?.ok === false) {
      leadFeedback.textContent = ({
        nome: 'Confira o nome informado.',
        telefone: 'Informe um telefone válido com DDD.',
        perfil_locacao: 'A locação é exclusiva para dentistas e profissionais da saúde.',
        limite: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
      })[data.erro] || 'Confira os dados do formulário e tente novamente.';
      submit.disabled = false;
      return;
    }
    salvo = !error && data?.ok === true;
  } catch {
    salvo = false;
  }
  if (trackingConsent && lead.instagram) {
    visitorInstagram = lead.instagram;
    storageSet(INSTAGRAM_STORAGE_KEY, visitorInstagram);
  }
  if (salvo) registrarClique(pendingLead.track, pendingLead.unit || null, 'lead_created');
  registrarClique(pendingLead.track, pendingLead.unit || null, 'whatsapp_opened');
  const details = Object.entries(answers).map(([key, value]) => {
    const labels = { perfil: 'Perfil', cidade: 'Cidade', profissao: 'Profissão', ja_fez_curso: 'Já fez curso', interesse: 'Interesse',
      finalidade: 'Finalidade da sala', frequencia: 'Frequência', situacao: 'Paciente', unidade: 'Unidade' };
    const display = typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : value;
    return display ? `${labels[key]}: ${display}` : '';
  }).filter(Boolean).join(' | ');
  const destination = applyPreMessage(pendingLead.destination, `${pendingLead.message} ${details}`, lead);
  // Se o banco falhar ou demorar, o atendimento abre mesmo assim.
  leadFeedback.textContent = salvo
    ? 'Contato registrado. Abrindo o atendimento…'
    : 'Não conseguimos registrar seu contato agora. Vamos abrir o WhatsApp para você continuar por lá.';
  window.setTimeout(() => { leadForm.reset(); submit.disabled = false; window.location.href = destination; }, salvo ? 400 : 2200);
});

window.addEventListener('message', (event) => { if (event.origin === window.location.origin && event.data?.type === 'vert-card-preview') renderContent(event.data.content); });
bindTracking(); initializeScrollMotion(); initializePrivacy(); loadCardContent().then(({ content }) => renderContent(content)).catch(() => {
  renderContent({ company: { phone: '5516999657667' }, units: [
    { id: 'franca', name: 'Unidade Franca', city: 'Franca', mapsUrl: 'https://share.google/h4z7z9tEyG4lLo7gp' },
    { id: 'ribeirao-preto', name: 'Unidade Ribeirão Preto', city: 'Ribeirão Preto', mapsUrl: 'https://share.google/FDO4JcaSOvqew78Sh' },
  ] });
});
