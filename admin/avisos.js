/**
 * Tela "Avisos" (fica dentro do formulário geral do painel, por isso não usa
 * <form>: o navegador descartaria um formulário aninhado): liga e desliga o aviso de lead novo no WhatsApp da equipe,
 * define quem recebe, envia uma mensagem de teste e mostra os últimos envios.
 * Tudo passa pelas funções site_aviso_* do banco, que só respondem aos
 * administradores do painel.
 */
const safe = (value = '') => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });
const SEIS_HORAS = 6 * 60 * 60 * 1000;

const ERROS = {
  destino_invalido: 'Informe o número com DDD (ex.: 16 99999-0000) ou o id de um grupo, que termina em @g.us.',
  destino_vazio: 'Informe quem recebe antes de ligar o aviso.',
  sem_destino: 'Salve o número ou o grupo antes de enviar o teste.',
  conexao_indisponivel: 'A conexão do WhatsApp não está disponível. Reconecte no CRM de atendimento.',
  aguarde: 'Aguarde alguns segundos antes de enviar outro teste.',
  sem_permissao: 'Sua conta não tem permissão para alterar os avisos.',
};

/** Número guardado (55 + DDD + telefone) volta para a forma de digitar; grupo fica como está. */
function formatar(destino) {
  const texto = String(destino || '');
  const m = texto.match(/^55(\d{2})(\d{4,5})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : texto;
}

function situacaoDoEnvio(envio) {
  if (envio.erro) return { texto: envio.erro === 'conexao_indisponivel' ? 'Falhou: conexão do WhatsApp indisponível' : `Falhou: ${envio.erro}`, ruim: true };
  const codigo = envio.status_code;
  if (codigo >= 200 && codigo < 300) return { texto: 'Enviado', ok: true };
  if (codigo >= 300) return { texto: `Falhou (HTTP ${codigo}). Confira se o WhatsApp está conectado.`, ruim: true };
  return { texto: Date.now() - new Date(envio.criado_em).getTime() < SEIS_HORAS ? 'Aguardando resposta' : 'Sem confirmação' };
}

export function initAvisos({ supabase }) {
  const $ = (seletor) => document.querySelector(seletor);
  const statusBox = $('#avisos-status');
  const campoDestino = $('#avisos-destino');
  const campoAtivo = $('#avisos-ativo');
  const botaoSalvar = $('#avisos-salvar');
  const botaoTestar = $('#avisos-testar');
  const feedback = $('#avisos-feedback');
  const listaEnvios = $('#avisos-envios');
  let salvo = { destino: '', ativo: false };
  let ocupado = false;

  const alterado = () => campoDestino.value.trim() !== salvo.destino || campoAtivo.checked !== salvo.ativo;
  function mostrar(texto, ok = false) {
    feedback.textContent = texto;
    feedback.classList.toggle('is-ok', ok);
  }
  function travar(valor) {
    ocupado = valor;
    botaoSalvar.disabled = valor;
    botaoTestar.disabled = valor;
  }

  function renderStatus(dados) {
    const conexao = dados.conexao || {};
    const conectado = conexao.status === 'connected';
    const verificado = conexao.verificado_em ? dataHora.format(new Date(conexao.verificado_em)) : 'ainda não verificado';
    statusBox.innerHTML = `
      <h3>Situação</h3>
      <div class="avisos-linha"><span>Aviso de lead novo</span><em class="avisos-pill ${dados.ativo ? 'is-ok' : ''}">${dados.ativo ? 'Ligado' : 'Desligado'}</em></div>
      <div class="avisos-linha"><span>WhatsApp ${safe(conexao.nome || '')}</span><em class="avisos-pill ${conectado ? 'is-ok' : 'is-bad'}">${conectado ? 'Conectado' : 'Desconectado'}</em></div>
      <p class="ops-muted">Última verificação: ${safe(verificado)}.</p>
      ${conectado ? '' : '<p class="avisos-alerta">O WhatsApp está desconectado, então os avisos não chegam. Reconecte lendo o QR code no CRM de atendimento. Esta tela atualiza o estado em alguns minutos.</p>'}`;
  }

  function renderEnvios(envios) {
    listaEnvios.innerHTML = envios.length
      ? envios.map((envio) => {
          const situacao = situacaoDoEnvio(envio);
          return `<div class="ops-list-row"><span><strong>${envio.lead_id ? 'Lead novo' : 'Mensagem de teste'}</strong><small>${safe(dataHora.format(new Date(envio.criado_em)))}</small></span><em class="avisos-pill ${situacao.ok ? 'is-ok' : situacao.ruim ? 'is-bad' : ''}">${safe(situacao.texto)}</em></div>`;
        }).join('')
      : '<div class="ops-empty"><strong>Nenhum aviso enviado ainda</strong><p>Use o botão de teste ou espere o próximo lead.</p></div>';
  }

  async function carregar(forcar = false) {
    const { data, error } = await supabase.rpc('site_aviso_status');
    if (error || !data) {
      statusBox.innerHTML = '<div class="ops-empty"><strong>Não foi possível carregar os avisos</strong><p>Tente atualizar em instantes.</p></div>';
      return;
    }
    renderStatus(data);
    renderEnvios(data.envios || []);
    // Não sobrescreve o que a pessoa está digitando, a menos que tenha acabado de salvar.
    const digitando = alterado() && !forcar;
    salvo = { destino: formatar(data.destino), ativo: Boolean(data.ativo) };
    if (!digitando) {
      campoDestino.value = salvo.destino;
      campoAtivo.checked = salvo.ativo;
    }
  }

  async function salvar() {
    if (ocupado) return;
    travar(true);
    mostrar('Salvando…');
    const { data, error } = await supabase.rpc('site_aviso_salvar', { p_destino: campoDestino.value, p_ativo: campoAtivo.checked });
    travar(false);
    if (error || !data) { mostrar('Não foi possível salvar. Tente de novo.'); return; }
    if (!data.ok) { mostrar(ERROS[data.erro] || 'Confira os dados e tente de novo.'); return; }
    await carregar(true);
    mostrar(campoAtivo.checked ? 'Salvo. O aviso está ligado.' : 'Salvo. O aviso está desligado.', true);
  }
  botaoSalvar.addEventListener('click', () => void salvar());
  campoDestino.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') { evento.preventDefault(); void salvar(); }
  });

  botaoTestar.addEventListener('click', async () => {
    if (ocupado) return;
    if (alterado()) { mostrar('Salve as alterações antes de enviar o teste.'); return; }
    travar(true);
    mostrar('Enviando teste…');
    const { data, error } = await supabase.rpc('site_aviso_testar');
    travar(false);
    if (error || !data) { mostrar('Não foi possível enviar o teste. Tente de novo.'); return; }
    if (!data.ok) { mostrar(ERROS[data.erro] || 'Não foi possível enviar o teste.'); return; }
    mostrar('Teste enviado. Confira o WhatsApp de quem recebe; o resultado aparece abaixo em alguns segundos.', true);
    window.setTimeout(() => void carregar(), 5000);
  });

  $('#avisos-refresh').addEventListener('click', () => void carregar());

  return { activate(secao) { if (secao === 'avisos') void carregar(); } };
}
