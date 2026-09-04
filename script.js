const SUPABASE_URL = 'https://xiskevunqbvmoclygppc.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_aDaa3WVZP7siuPw8IbK_Wg_Y68x-MHH';

document.getElementById('year').textContent = new Date().getFullYear();

document.querySelectorAll('a[target="_blank"]').forEach((link) => {
  link.setAttribute('aria-label', `${link.textContent.trim()} — abre em uma nova aba`);
});

function detectarDispositivo() {
  return window.matchMedia('(max-width: 760px)').matches ? 'celular' : 'computador';
}

function detectarOrigem() {
  const params = new URLSearchParams(window.location.search);
  const campanha = ['utm_source', 'utm_medium', 'utm_campaign']
    .map((chave) => {
      const valor = params.get(chave);
      return valor ? `${chave.replace('utm_', '')}=${valor}` : '';
    })
    .filter(Boolean)
    .join(';');

  if (campanha) return campanha.slice(0, 120);
  if (!document.referrer) return 'direto';

  try {
    const origem = new URL(document.referrer).hostname.replace(/^www\./, '');
    return origem === window.location.hostname ? 'direto' : origem.slice(0, 120);
  } catch {
    return 'direto';
  }
}

function registrarClique(botao, unidade = null) {
  const payload = {
    botao: String(botao).slice(0, 40),
    unidade: unidade ? String(unidade).slice(0, 40) : null,
    origem: detectarOrigem(),
    dispositivo: detectarDispositivo(),
  };

  void fetch(`${SUPABASE_URL}/rest/v1/link_clicks`, {
    method: 'POST',
    keepalive: true,
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(payload),
  }).catch(() => {
    // A medição nunca deve impedir o visitante de acessar o link.
  });
}

document.querySelectorAll('[data-track]').forEach((link) => {
  link.addEventListener('click', () => {
    registrarClique(link.dataset.track, link.dataset.unit || null);
  });
});

registrarClique('visualizacao_pagina');
