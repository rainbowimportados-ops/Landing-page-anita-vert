// Barra de abas do celular, no padrão dos apps da Apple: as quatro áreas mais
// usadas pela equipe e "Mais", que abre o seletor com todas as áreas.
// Não tem lógica própria de navegação: muda o seletor existente
// (#mobile-section-nav), que já chama activatePanel e respeita as permissões.

const ICONES = {
  inicio: '<path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z"/>',
  contatos: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 19.5c1.2-3.3 3.8-5 7-5s5.8 1.7 7 5"/>',
  funil: '<path d="M4 5h16l-6 7.5V18l-4 2v-7.5z"/>',
  agenda: '<rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M8 3.5v4M16 3.5v4M4 10h16"/>',
  mais: '<circle cx="6" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18" cy="12" r="1.3"/>',
};

const ABAS = [
  { secao: 'visao-geral', texto: 'Início', icone: 'inicio' },
  { secao: 'contatos', texto: 'Contatos', icone: 'contatos' },
  { secao: 'pipeline', texto: 'Funil', icone: 'funil' },
  { secao: 'agenda', texto: 'Agenda', icone: 'agenda' },
];

export function initTabbar() {
  const app = document.querySelector('#admin-app');
  const seletor = document.querySelector('#mobile-section-nav');
  if (!app || !seletor || document.querySelector('.ap-tabbar')) return;

  const barra = document.createElement('nav');
  barra.className = 'ap-tabbar';
  barra.setAttribute('aria-label', 'Áreas principais');
  barra.hidden = app.hidden;
  const svg = (nome) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONES[nome]}</svg>`;
  barra.innerHTML = ABAS.map((aba) => `<button type="button" data-tab="${aba.secao}">${svg(aba.icone)}<span>${aba.texto}</span></button>`).join('')
    + `<button type="button" data-tab-more aria-haspopup="listbox">${svg('mais')}<span>Mais</span></button>`;
  document.body.append(barra);

  const ir = (secao) => {
    if (seletor.value === secao) return;
    seletor.value = secao;
    seletor.dispatchEvent(new Event('change', { bubbles: true }));
  };

  barra.addEventListener('click', (evento) => {
    const botao = evento.target.closest('button');
    if (!botao) return;
    if (botao.dataset.tab) return ir(botao.dataset.tab);
    // "Mais": abre o seletor nativo com todas as áreas permitidas.
    try { seletor.showPicker(); } catch { seletor.focus(); seletor.click(); }
  });

  const atualizar = () => {
    barra.hidden = app.hidden;
    const ativa = app.dataset.activeSection;
    const principal = ABAS.some((aba) => aba.secao === ativa);
    let visiveis = 1;
    barra.querySelectorAll('[data-tab]').forEach((botao) => {
      // Mesma regra do menu: a aba some se a área estiver fora das permissões.
      const link = document.querySelector(`.sidebar .nav-link[data-section="${botao.dataset.tab}"]`);
      botao.hidden = !link || link.hidden;
      if (!botao.hidden) visiveis += 1;
      if (botao.dataset.tab === ativa) botao.setAttribute('aria-current', 'page');
      else botao.removeAttribute('aria-current');
    });
    const mais = barra.querySelector('[data-tab-more]');
    if (principal) mais.removeAttribute('aria-current');
    else mais.setAttribute('aria-current', 'page');
    barra.style.setProperty('--ap-tabs', String(visiveis));
  };

  new MutationObserver(atualizar).observe(app, { attributes: true, attributeFilter: ['hidden', 'data-active-section'] });
  new MutationObserver(atualizar).observe(document.querySelector('.sidebar nav'), { subtree: true, attributes: true, attributeFilter: ['hidden'], childList: true });
  atualizar();
}
