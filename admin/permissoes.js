// Permissões do usuário logado no /admin.
//
// Quem decide de verdade é o banco (RLS e funções em
// supabase/migrations/20261021120000_site_admin_permissoes.sql): aqui o menu
// só esconde o que a pessoa não pode ver e avisa quando a área é só leitura.

/** Área de permissão de cada seção do painel. */
export const AREA_DA_SECAO = {
  'visao-geral': 'relatorios', relatorios: 'relatorios', origens: 'relatorios', acessos: 'relatorios',
  'meu-dia': 'leads', contatos: 'leads', pipeline: 'leads', tarefas: 'leads', agenda: 'leads', avaliacoes: 'leads', pacientes: 'leads',
  formularios: 'campanhas', 'campanhas-crm': 'campanhas', 'links-qr': 'campanhas',
  site: 'site', historico: 'site',
  casos: 'casos',
  empresa: 'cartao', unidades: 'cartao', links: 'cartao', formacoes: 'cartao', campanhas: 'cartao', depoimentos: 'cartao',
  midia: 'midia',
  integracoes: 'configuracoes', avisos: 'configuracoes',
  privacidade: 'privacidade',
  equipe: 'equipe',
};

/** Áreas configuráveis, na ordem em que aparecem na tela de permissões. */
export const AREAS = [
  ['leads', 'Contatos e atendimento', 'Contatos, funil, agenda, avaliações, pacientes, tarefas e Meu dia'],
  ['relatorios', 'Visão geral e relatórios', 'Indicadores, relatórios, origens e acessos ao cartão'],
  ['campanhas', 'Captação', 'Campanhas, formulários, links e QR codes'],
  ['site', 'Editar site', 'Textos e seções do site, histórico de alterações'],
  ['casos', 'Antes e depois', 'Fotos de pacientes, análise e publicação dos casos'],
  ['cartao', 'Cartão digital', 'Dados da empresa, unidades, WhatsApp, formações, promoções e depoimentos'],
  ['midia', 'Biblioteca de mídia', 'Imagens e vídeos públicos'],
  ['configuracoes', 'Avisos e integrações', 'Aviso de lead novo no WhatsApp e conexões'],
  ['privacidade', 'Privacidade', 'Pedidos de titulares de dados (LGPD)'],
];

export const UNIDADES = ['Franca', 'Ribeirão Preto'];

const tudo = (nivel) => Object.fromEntries(AREAS.map(([area]) => [area, nivel]));

/** Perfis prontos: o ponto de partida; dá para ajustar área por área depois. */
export const PERFIS = {
  gestao: { nome: 'Gestão', descricao: 'Vê e edita tudo, exceto liberar usuários.', areas: tudo('editar') },
  recepcao: { nome: 'Recepção', descricao: 'Atende contatos e agenda; vê os indicadores.', areas: { leads: 'editar', relatorios: 'ver' } },
  marketing: {
    nome: 'Marketing',
    descricao: 'Site, cartão, antes e depois, mídia e captação; vê os indicadores.',
    areas: { campanhas: 'editar', site: 'editar', casos: 'editar', cartao: 'editar', midia: 'editar', relatorios: 'ver' },
  },
  consulta: {
    nome: 'Somente consulta',
    descricao: 'Vê contatos, relatórios e conteúdo, sem alterar nada.',
    areas: { leads: 'ver', relatorios: 'ver', campanhas: 'ver', site: 'ver', casos: 'ver', cartao: 'ver', midia: 'ver' },
  },
  personalizado: { nome: 'Personalizado', descricao: 'Você escolhe área por área.', areas: {} },
};

let atuais = null;

export async function carregarPermissoes(supabase) {
  const { data, error } = await supabase.rpc('site_minhas_permissoes');
  // Sem a função (banco antigo): mostra tudo; o banco continua decidindo.
  atuais = error || !data ? { diretoria: false, areas: {}, unidades: null, desconhecido: true } : data;
  return atuais;
}

/** 'editar' | 'ver' | 'nenhum' para uma seção do painel. */
export function nivelDaSecao(secao) {
  if (!atuais || atuais.desconhecido) return 'editar';
  if (secao === 'conteudo') {
    const niveis = ['site', 'casos', 'cartao', 'midia'].map((a) => atuais.areas?.[a] ?? 'nenhum');
    return niveis.includes('editar') ? 'editar' : niveis.includes('ver') ? 'ver' : 'nenhum';
  }
  const area = AREA_DA_SECAO[secao];
  if (!area) return 'editar';
  return atuais.areas?.[area] ?? 'nenhum';
}

export const podeVer = (secao) => nivelDaSecao(secao) !== 'nenhum';

/** Esconde do menu o que a pessoa não vê e marca as áreas só de leitura. */
export function aplicarPermissoes() {
  const nav = document.querySelector('.sidebar nav');
  nav?.querySelectorAll('.nav-link[data-section]').forEach((botao) => {
    botao.hidden = !podeVer(botao.dataset.section);
  });
  // Títulos de grupo sem nenhum item visível também somem.
  nav?.querySelectorAll('.nav-group-label').forEach((titulo) => {
    let irmao = titulo.nextElementSibling;
    let algum = false;
    while (irmao && !irmao.classList.contains('nav-group-label')) {
      if (!irmao.hidden) algum = true;
      irmao = irmao.nextElementSibling;
    }
    titulo.hidden = !algum;
  });
  document.querySelectorAll('#mobile-section-nav option').forEach((opcao) => {
    opcao.hidden = !podeVer(opcao.value);
    opcao.disabled = opcao.hidden;
  });
  document.querySelectorAll('[data-panel]').forEach((painel) => {
    const nivel = nivelDaSecao(painel.dataset.panel);
    painel.toggleAttribute('data-somente-leitura', nivel === 'ver');
    painel.querySelector(':scope > .aviso-somente-leitura')?.remove();
    if (nivel === 'ver') {
      painel.querySelector('.panel__heading')?.insertAdjacentHTML(
        'afterend',
        '<p class="aviso-somente-leitura" role="note">Você tem acesso só para ver esta área. Alterações não são salvas.</p>',
      );
      // Formulários do cartão: campos travados para não parecer editável.
      if (AREA_DA_SECAO[painel.dataset.panel] === 'cartao') {
        painel.querySelectorAll('input, textarea, select, button[data-add], label.upload').forEach((campo) => {
          if (campo.matches('label')) campo.hidden = true;
          else campo.disabled = true;
        });
      }
    }
  });
}

/** Primeira seção visível, para abrir quando a pedida não é permitida. */
export function primeiraSecaoPermitida() {
  const botao = [...document.querySelectorAll('.sidebar nav .nav-link[data-section]')].find((b) => !b.hidden);
  return botao?.dataset.section ?? null;
}

export const permissoesAtuais = () => atuais;
