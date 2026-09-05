import { loadCardContent, supabase, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './lib/supabase.js';

document.getElementById('year').textContent = new Date().getFullYear();

const leadDialog = document.querySelector('#lead-dialog');
const leadForm = document.querySelector('#lead-form');
const leadFeedback = document.querySelector('#lead-feedback');
const contactRouter = document.querySelector('#contact-router');
const contactRouterOptions = document.querySelector('#contact-router-options');
let pendingLead = null;
let currentCompany = {};
let currentUnits = [];

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
  return String(message || '')
    .replaceAll('{nome}', lead.name || '')
    .replaceAll('{telefone}', lead.phone || '')
    .replaceAll('{profissao}', lead.profession || '')
    .replaceAll('{curso}', lead.course || '')
    .replaceAll('{dentista}', audience)
    .replaceAll('{perfil}', audience)
    .replaceAll('{curso_anterior}', lead.hasPreviousCourse === true ? 'Sim' : lead.hasPreviousCourse === false ? 'Não' : '')
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

function prepareLeadLink(link, { collectLead = true, message = '', label = 'Contato', unit = '', leadType = 'contact', courseId = '', courseTitle = '' } = {}) {
  if (!collectLead) return link;
  link.dataset.collectLead = 'true';
  link.dataset.preMessage = message;
  link.dataset.leadLabel = label;
  link.dataset.leadUnit = unit;
  link.dataset.leadType = leadType;
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

function renderContactRouter(units, company) {
  const activeUnits = units.filter((unit) => unit.active !== false);
  const sharedNumber = company.phone || activeUnits[0]?.phone;
  const useSharedNumber = (company.whatsappMode || 'shared') === 'shared';
  contactRouterOptions.replaceChildren();

  activeUnits.forEach((unit) => {
    const unitName = unit.city || unit.name || 'Unidade';
    const message = unit.whatsappMessage || company.whatsappMessage || 'Olá! Meu nome é {nome} e quero agendar uma avaliação em {unidade}.';
    const phone = useSharedNumber ? sharedNumber : (unit.phone || sharedNumber);
    const destination = useSharedNumber
      ? whatsappUrl(sharedNumber, personalizeMessage(message, { unit: unitName }))
      : (unit.contactUrl || whatsappUrl(phone, personalizeMessage(message, { unit: unitName })));
    const link = trackableLink(applyPreMessage(destination, message, { unit: unitName }), 'whatsapp_agendar', unit.id);
    link.className = 'contact-router__option';
    link.innerHTML = `<span><small>Nova consulta</small><strong>${escapeText(unit.contactButtonLabel || `Consulta em ${unitName}`)}</strong></span><b aria-hidden="true">→</b>`;
    prepareLeadLink(link, { collectLead: unit.collectLead !== false, message, label: `Consulta — ${unitName}`, unit: unitName, leadType: 'appointment' });
    contactRouterOptions.append(link);
  });

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
    const card = document.createElement('article'); card.className = 'google-card';
    const map = document.createElement('div'); map.className = 'google-card__preview';
    const iframe = document.createElement('iframe'); iframe.src = `https://www.google.com/maps?q=${encodeURIComponent(unit.mapsQuery || `${unit.name}, ${unit.city}`)}&output=embed`; iframe.title = `Prévia de ${unit.name} no Google Maps`; iframe.loading = 'lazy'; iframe.referrerPolicy = 'no-referrer-when-downgrade'; map.append(iframe);
    const body = document.createElement('div'); body.className = 'google-card__content'; body.innerHTML = '<span class="google-card__google" aria-label="Google"><i></i> Google</span>';
    const name = document.createElement('div'); name.innerHTML = '<small>Instituto Vert</small>'; const strong = document.createElement('strong'); strong.textContent = unit.name; name.append(strong); body.append(name);
    if (unit.address) { const address = document.createElement('small'); address.textContent = unit.address; address.style.marginTop = '8px'; body.append(address); }
    const link = trackableLink(unit.mapsUrl, 'google_perfil', unit.id); link.innerHTML = 'Ver perfil no Google <span aria-hidden="true">→</span>'; body.append(link); card.append(map, body); grid.append(card);
  });
}

function renderPortfolio(items) {
  const strip = document.querySelector('.media-strip'); const active = (items || []).filter((item) => item.active !== false && item.mediaUrl);
  if (!active.length) return; strip.replaceChildren();
  active.forEach((item) => {
    const figure = document.createElement('figure'); let media;
    if (item.mediaType === 'video') { media = document.createElement('video'); media.controls = true; media.playsInline = true; media.preload = 'metadata'; if (item.posterUrl) media.poster = safeUrl(item.posterUrl, ''); const source = document.createElement('source'); source.src = safeUrl(item.mediaUrl); source.type = 'video/mp4'; media.append(source); }
    else if (item.mediaType === 'document') {
      media = trackableLink(item.mediaUrl, 'documento_resultado');
      media.className = 'document-card';
      const icon = document.createElement('span'); icon.setAttribute('aria-hidden', 'true'); icon.textContent = 'DOC';
      const copy = document.createElement('span');
      const label = document.createElement('small'); label.textContent = 'Documento';
      const name = document.createElement('strong'); name.textContent = item.fileName || item.title || 'Abrir documento';
      copy.append(label, name);
      const arrow = document.createElement('span'); arrow.setAttribute('aria-hidden', 'true'); arrow.textContent = '↗';
      media.append(icon, copy, arrow);
    }
    else { media = document.createElement('img'); media.src = safeUrl(item.mediaUrl); media.alt = item.title || 'Resultado real'; media.loading = 'lazy'; }
    const caption = document.createElement('figcaption');
    const title = document.createElement('strong'); title.textContent = item.title || 'Resultado real'; caption.append(title);
    if (item.procedure) { const procedure = document.createElement('span'); procedure.textContent = item.procedure; caption.append(procedure); }
    if (item.description) { const description = document.createElement('p'); description.textContent = item.description; caption.append(description); }
    if (item.details) { const details = document.createElement('small'); details.textContent = item.details; caption.append(details); }
    figure.append(media, caption); strip.append(figure);
  });
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

function renderFormations(items, settings, company) {
  const section = document.querySelector('#formacoes');
  const container = document.querySelector('#formation-list');
  const active = (items || []).filter((item) => item.active !== false && item.title);
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
    const message = item.whatsappMessage || settings.whatsappMessage || 'Olá! Meu nome é {nome}. Quero informações sobre {curso}. Perfil: {perfil}. Já fiz outro curso: {curso_anterior}.';
    const formationPhone = (company.whatsappMode || 'shared') === 'shared'
      ? company.phone
      : (item.whatsappPhone || settings.phone || company.phone);
    const destination = whatsappUrl(formationPhone, personalizeMessage(message, { course: item.title }));
    const link = trackableLink(destination, `formacao_${item.id || 'curso'}`);
    link.className = 'formation-card__action';
    link.innerHTML = `<span>${escapeText(item.buttonLabel || settings.buttonLabel || 'Quero saber mais')}</span><b aria-hidden="true">→</b>`;
    prepareLeadLink(link, { message, label: `Formação — ${item.title}`, leadType: 'formation', courseId: item.id || '', courseTitle: item.title });
    card.append(heading, description, meta, link);
    container.append(card);
  });
}

function escapeText(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

function renderContent(content) {
  if (!content) return; const company = content.company || {}; const units = content.units || []; const formationSettings = content.formationSettings || {}; currentCompany = company; currentUnits = units;
  setText('.profile__identity p', company.category); setText('#titulo', company.name); setText('.intro .eyebrow', company.ctaLabel); setText('#cms-headline', company.headline); setText('#cms-description', company.description); setText('footer p', company.tagline);
  const hero = document.querySelector('.profile__photo > img');
  if (hero && company.heroImage) applyImageSource(hero, company.heroImage, new URL('./assets/hero.webp', import.meta.url).href);
  const logoSources = {
    primaryDark: company.logoPrimaryDark || DEFAULT_LOGOS.primaryDark,
    primaryLight: company.logoPrimaryLight || DEFAULT_LOGOS.primaryLight,
    horizontal: company.logoHorizontal || DEFAULT_LOGOS.horizontal,
  };
  const logo = document.querySelector('.brand img');
  const selectedVariant = company.logoVariant || 'primaryDark';
  const selectedLogo = logoSources[selectedVariant] || logoSources.primaryDark;
  applyImageSource(logo, selectedLogo, DEFAULT_LOGOS.primaryDark);
  const cities = units.filter((unit) => unit.active !== false).map((unit) => unit.city).filter(Boolean); setText('.profile__identity span', company.identityLine || cities.join(' • '));
  renderUnits(units); renderPortfolio(content.portfolio); renderCards('campanhas', 'campaign-list', content.campaigns, 'campaign'); renderCards('depoimentos', 'testimonial-list', content.testimonials, 'testimonial'); renderFormations(content.formations, formationSettings, company); renderExtraLinks(content.links); renderWhatsApp(units, company);
  const instagram = document.querySelector('.quick-links a[data-track="instagram"]'); if (instagram && company.instagram) { instagram.href = safeUrl(company.instagram); const label = instagram.querySelector('small'); if (label) label.textContent = company.instagramLabel || 'Instagram'; }
  const floating = document.querySelector('.floating-whatsapp');
  const floatingLabel = floating.querySelector('span:last-child');
  if (floatingLabel) floatingLabel.textContent = company.contactButtonLabel || 'Falar no WhatsApp';
  bindTracking();
}

function detectarDispositivo() { return window.matchMedia('(max-width: 760px)').matches ? 'celular' : 'computador'; }
function detectarOrigem() {
  const params = new URLSearchParams(window.location.search); const campanha = ['utm_source', 'utm_medium', 'utm_campaign'].map((chave) => { const valor = params.get(chave); return valor ? `${chave.replace('utm_', '')}=${valor}` : ''; }).filter(Boolean).join(';');
  if (campanha) return campanha.slice(0, 120); if (!document.referrer) return 'direto';
  try { const origem = new URL(document.referrer).hostname.replace(/^www\./, ''); return origem === window.location.hostname ? 'direto' : origem.slice(0, 120); } catch { return 'direto'; }
}

function registrarClique(botao, unidade = null) {
  const payload = { botao: String(botao).slice(0, 40), unidade: unidade ? String(unidade).slice(0, 40) : null, origem: detectarOrigem(), dispositivo: detectarDispositivo() };
  void fetch(`${SUPABASE_URL}/rest/v1/digital_card_clicks`, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json', apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`, Prefer: 'return=minimal' }, body: JSON.stringify(payload) }).catch(() => {});
}

function bindTracking() {
  document.querySelectorAll('[data-track]:not([data-tracking-bound])').forEach((link) => { link.dataset.trackingBound = 'true'; link.addEventListener('click', () => { if (link.dataset.collectLead !== 'true') registrarClique(link.dataset.track, link.dataset.unit || null); }); });
  document.querySelectorAll('a[target="_blank"]').forEach((link) => link.setAttribute('aria-label', `${link.textContent.trim()} — abre em uma nova aba`));
}

document.addEventListener('click', (event) => {
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
    courseId: link.dataset.courseId || '',
    courseTitle: link.dataset.courseTitle || '',
  };
  if (contactRouter.open) contactRouter.close();
  leadForm.reset();
  const isFormation = pendingLead.leadType === 'formation';
  const isPatient = pendingLead.leadType === 'patient';
  const isAppointment = pendingLead.leadType === 'appointment';
  document.querySelector('#lead-dialog-title').textContent = isFormation
    ? `Interesse em ${pendingLead.courseTitle}`
    : isPatient
      ? 'Atendimento para paciente'
      : isAppointment
        ? `Consulta em ${pendingLead.unit}`
        : currentCompany.leadFormTitle || 'Antes de continuar';
  document.querySelector('#lead-dialog-description').textContent = isFormation
    ? 'Preencha seus dados e responda duas perguntas rápidas.'
    : isPatient
      ? 'Informe seu nome e telefone para identificarmos seu cadastro antes do atendimento.'
      : currentCompany.leadFormDescription || 'Informe seus dados para receber atendimento personalizado.';
  const formationFields = document.querySelector('#formation-lead-fields');
  formationFields.hidden = !isFormation;
  formationFields.querySelectorAll('input,select').forEach((field) => { field.disabled = !isFormation; });
  const professionField = document.querySelector('#lead-profession-field');
  const professionInput = document.querySelector('#lead-profession');
  professionField.hidden = isFormation;
  professionInput.disabled = isFormation;
  leadFeedback.textContent = '';
  leadDialog.showModal();
  requestAnimationFrame(() => document.querySelector('#lead-name').focus());
}, true);

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
    profession: String(formData.get('profession') || '').trim(),
    isDentist: formData.get('isDentist') === 'yes' ? true : formData.get('isDentist') === 'no' ? false : null,
    hasPreviousCourse: formData.get('hasPreviousCourse') === 'yes' ? true : formData.get('hasPreviousCourse') === 'no' ? false : null,
    city: '',
    course: pendingLead.courseTitle || '',
  };
  if (lead.phone.replace(/\D/g, '').length < 10) {
    leadFeedback.textContent = 'Informe um telefone válido com DDD.';
    return;
  }
  const submit = leadForm.querySelector('[type="submit"]');
  submit.disabled = true;
  leadFeedback.textContent = 'Salvando seus dados…';
  let destinationForStorage = pendingLead.destination;
  try { const url = new URL(destinationForStorage); url.search = ''; destinationForStorage = url.href; } catch { destinationForStorage = ''; }
  const { error } = await supabase.from('digital_card_leads').insert({
    name: lead.name,
    phone: lead.phone,
    profession: lead.profession || null,
    button: pendingLead.button,
    unit: pendingLead.unit || null,
    destination: destinationForStorage || null,
    consent: formData.get('consent') === 'on',
    lead_type: pendingLead.leadType,
    is_dentist: lead.isDentist,
    has_previous_course: lead.hasPreviousCourse,
    city: lead.city || null,
    course_id: pendingLead.courseId || null,
    course_title: pendingLead.courseTitle || null,
  });
  if (error) {
    leadFeedback.textContent = 'Não foi possível continuar agora. Tente novamente.';
    submit.disabled = false;
    return;
  }
  registrarClique(pendingLead.track, pendingLead.unit || null);
  const destination = applyPreMessage(pendingLead.destination, pendingLead.message, lead);
  leadFeedback.textContent = 'Tudo certo. Abrindo o atendimento…';
  leadForm.reset();
  window.setTimeout(() => { window.location.href = destination; }, 250);
});

window.addEventListener('message', (event) => { if (event.origin === window.location.origin && event.data?.type === 'vert-card-preview') renderContent(event.data.content); });
bindTracking(); registrarClique('visualizacao_pagina'); loadCardContent().then(({ content }) => renderContent(content)).catch(() => {});
