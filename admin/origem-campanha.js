/**
 * Origem de campanha dos leads (colunas criadas em digital_card_leads):
 * utm_medium, utm_campaign, utm_content, utm_term, gclid, gbraid, wbraid, entry_page.
 * Leads antigos não têm esses campos; todas as funções aceitam valores vazios.
 */
export const COLUNAS_CAMPANHA = 'utm_medium,utm_campaign,utm_content,utm_term,gclid,gbraid,wbraid,entry_page';

const texto = (valor) => String(valor ?? '').trim();

/** Identificador de clique do Google Ads, quando o lead veio de um anúncio. */
export function cliqueDoAnuncio(lead) {
  return texto(lead.gclid) || texto(lead.gbraid) || texto(lead.wbraid);
}

export function veioDeAnuncio(lead) {
  return Boolean(cliqueDoAnuncio(lead));
}

/** Nome da campanha; vazio quando o lead não trouxe utm_campaign. */
export function nomeCampanha(lead) {
  return texto(lead.utm_campaign);
}

/** Resumo curto para a lista: "Google Ads · pmax-lentes · cpc". */
export function resumoCampanha(lead) {
  return [veioDeAnuncio(lead) ? 'Google Ads' : '', nomeCampanha(lead), texto(lead.utm_medium)].filter(Boolean).join(' · ');
}

/** Texto usado na busca da lista de contatos. */
export function textoBuscaCampanha(lead) {
  return [lead.utm_campaign, lead.utm_medium, lead.utm_content, lead.utm_term, lead.gclid, lead.gbraid, lead.wbraid].map(texto).filter(Boolean).join(' ');
}

/** Campos extras do CSV, na mesma ordem de CABECALHO_CSV_CAMPANHA. */
export const CABECALHO_CSV_CAMPANHA = ['Meio', 'Campanha', 'Conteúdo do anúncio', 'Termo', 'Clique Google (gclid)', 'gbraid', 'wbraid', 'Página de entrada'];
export function linhaCsvCampanha(lead) {
  return [lead.utm_medium, lead.utm_campaign, lead.utm_content, lead.utm_term, lead.gclid, lead.gbraid, lead.wbraid, lead.entry_page];
}

/** Leads por campanha, com quantos viraram avaliação e conversão (etapas do painel). */
export function agruparPorCampanha(leads) {
  const grupos = new Map();
  leads.forEach((lead) => {
    const nome = nomeCampanha(lead);
    if (!nome) return;
    const grupo = grupos.get(nome) || { nome, leads: 0, anuncio: 0, agendados: 0, convertidos: 0 };
    grupo.leads += 1;
    if (veioDeAnuncio(lead)) grupo.anuncio += 1;
    if (lead.pipeline_status === 'agendado' || lead.appointment_at) grupo.agendados += 1;
    if (lead.pipeline_status === 'concluido') grupo.convertidos += 1;
    grupos.set(nome, grupo);
  });
  return [...grupos.values()].sort((a, b) => b.leads - a.leads);
}
