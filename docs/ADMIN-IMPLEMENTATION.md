# Administração do Instituto Vert — implementação e aceite

Documento baseado na leitura de `admin/workspace.js`, `formulario/form.js`, `src/painel/Editor.tsx` e `supabase/migrations/20261014210000_admin_workspace.sql`, em 14/10/2026. Os critérios abaixo são roteiros de aceite, não resultados de execução. A existência de código e migração não comprova que o banco remoto foi atualizado ou que os fluxos foram homologados com sessão real.

## Mapa de telas, dados e ações

| Tela | Dados e dependências | Ações implementadas | Critério de aceite a executar |
| --- | --- | --- | --- |
| Navegação | Seções existentes do painel e novas seções de workspace | Agrupamento por Início, CRM, Captação, Site e conteúdo, Análises e Administração; seletor móvel | Abrir cada destino no desktop e no seletor móvel; preservar acesso às áreas existentes. |
| Meu dia | Leads carregados pelo painel e `site_lead_tasks` | Ver tarefas sem prazo ou até o fim do dia, avaliações do dia e retornos vencidos; abrir contato; criar, editar e concluir tarefas | Preparar dados de ontem/hoje/amanhã e verificar contagens e persistência ao recarregar. O dia usa o fuso do navegador. |
| Tarefas | `site_lead_tasks`, vínculo com lead e unidade do lead | Criar/editar título, contato e prazo; concluir/reabrir; filtrar por texto, status e unidade | Salvar tarefa vinculada, recarregar, concluir/reabrir e conferir cada filtro. Busca é aplicada no evento de alteração do campo. |
| Formulários | `site_forms` | Criar/editar nome, slug, apresentação, interesse, unidade e campos opcionais; publicar/despublicar; copiar e abrir link | Rascunho não aparece publicamente; publicação habilita o endereço; despublicação impede nova submissão. |
| Formulário público | RPCs `site_public_form`, `site_submit_form`, dependência preexistente `site_capturar_lead` | Nome, telefone e consentimento obrigatórios; cidade/profissão/Instagram/mensagem opcionais; profissão obrigatória para locação; envio ao CRM e feedback de erro/sucesso | Enviar dados de teste consentidos; conferir lead, interesse, unidade e origem no CRM; testar telefone inválido, falha de rede e formulário despublicado. Validar também rejeição diretamente na RPC, sem depender do HTML. |
| Links e QR codes | `site_tracking_links`; gerador QR local | Criar URL para site ou cartão com UTMs; copiar/abrir URL; exibir QR e baixar SVG | Ler QR em dispositivo real, conferir destino e parâmetros; submeter contato pelo destino e conferir atribuição disponível. |
| Biblioteca de mídia | Bucket público `digital-card-media` | Navegar pastas, listar até 100 itens por pasta, enviar JPEG/PNG/WebP/MP4 até 20 MB, abrir e copiar URL | Enviar arquivo permitido, verificar URL pública e rejeição de formato/tamanho inválidos; conferir políticas e limites do bucket no servidor. |
| Conteúdo | Destinos existentes do painel | Abrir site, cartão, cursos, depoimentos, casos, unidades, campanhas e mídia | Cada cartão deve encaminhar à área correspondente sem perder a navegação. |
| Integrações | Links para telas existentes; cartões informativos | Encaminhar a CRM, avisos, Instagram/acessos, UTMs, relatórios e agenda | Confirmar que a configuração/estado efetivo é consultado na tela de destino; não interpretar os cartões como teste de conectividade. |
| Privacidade | `site_privacy_requests`, vínculo opcional ao lead | Registrar acesso/correção/exclusão/revogação; atualizar status e notas | Registrar e atualizar solicitação; conferir persistência e auditoria; marcar concluída não deve excluir dados nem executar a solicitação automaticamente. |
| Equipe | `digital_card_admins`, RPCs `site_admin_members` e `site_admin_access`, contas preexistentes em Auth | Listar administradores; diretoria concede/revoga acesso a conta já existente | Conta inexistente retorna erro; administrador comum não altera acessos; diretoria não pode remover a própria conta protegida; revogado perde acesso conforme políticas aplicáveis. |
| Histórico | `site_admin_audit`, `site_content_versions`, `site_content_drafts` | Ver últimas 200 alterações e 50 versões; preparar versão da landing como rascunho | Publicar conteúdo de teste, localizar versão e auditoria; restaurar após confirmação; verificar que o publicado permanece igual até nova publicação. |
| Editor do site | `landing_content`, `site_content_drafts`, RPC `site_publish_draft`; iframe da landing | Editar contato, horários, respostas do FAQ, banner e rodapé; prévia desktop/celular; salvar rascunho e publicar | Salvar e reabrir rascunho sem alterar site público; conferir prévia; publicar; testar conflito entre dois editores e preservação de resultados/antes e depois. |

## Comportamento de dados e publicação

A migração adiciona tabelas e políticas administrativas sem redefinir as políticas preexistentes do CRM. As novas tabelas operacionais usam RLS baseada na presença do usuário em `digital_card_admins`; histórico e versões permitem leitura administrativa. As RPCs públicas expõem a definição de um formulário publicado e encaminham sua submissão ao capturador existente; não expõem a lista de submissões.

O editor recupera o rascunho antes do publicado. A gravação compara o timestamp do rascunho e a publicação bloqueia registros e verifica a versão-base publicada. A publicação da landing preserva o campo `resultados`, administrado no fluxo próprio de casos. O histórico começa na instalação dos gatilhos; não recupera versões anteriores à migração. Os gatilhos cobrem formulários, links, solicitações, rascunhos, conteúdo da landing/cartão, campanhas e tarefas, além dos eventos de concessão/revogação registrados pela RPC. Não representam auditoria integral de toda atividade do sistema.

## Limitações explícitas

- Não há alegação de equivalência exata aos mockups. O aceite visual exige inspeção autenticada, tamanhos de tela reais e comparação com referências aprovadas.
- Meta Ads, Google Ads e calendário externo não estão conectados por este módulo. UTMs não fornecem investimento, ROAS ou sincronização de anúncios. Os cartões de integrações descrevem capacidades/configuração, não monitoramento em tempo real.
- Não há RBAC por unidade ou papéis granulares. Administradores autorizados têm acesso completo ao site e CRM. O filtro de unidade é apresentação, não barreira de autorização.
- Não há convite por e-mail nem criação de conta pelo painel. “Autorizar conta existente” depende de conta previamente cadastrada no provedor; somente a diretoria pode conceder/revogar.
- O editor é baseado em campos fixos com prévia; não é construtor visual por arrastar, nem permite reorganização arbitrária de blocos. A prévia mantém botões e formulários ligados aos fluxos públicos.
- Privacidade é registro e acompanhamento: concluir uma solicitação não executa exclusão, exportação, correção ou revogação nos sistemas envolvidos.
- A biblioteca usa arquivos públicos, lista no máximo 100 itens por pasta e não oferece exclusão, busca, paginação ou gestão de direitos de uso. Casos de pacientes continuam na área própria.
- Links rastreáveis têm criação e consulta, sem edição/exclusão na interface atual. Os formulários têm campos opcionais de catálogo fixo; editar um formulário publicado modifica imediatamente sua definição pública.
- O envio de formulário preserva `utm_source`, fixa `utm_medium=form` e usa o slug como campanha; não preserva todos os parâmetros recebidos. Proteções efetivas de captação e limites dependem do capturador existente e devem ser testados no servidor.
- Restauração disponível na interface apenas para landing; versões do cartão são consultáveis. Restaurar pode substituir rascunho existente após confirmação. Histórico é limitado na tela e não contém comparação de campos.
- “Meu dia” reúne dados operacionais disponíveis, sem filtro por responsável; não é uma agenda pessoal com segregação de acesso. Datas usam fuso local do navegador nessa área.

## Próximas entregas e critérios de conclusão

1. **Homologação e implantação:** aplicar a migração em ambiente de teste com dependências existentes; testar RLS como anônimo, não administrador, administrador e diretoria; executar cada critério da tabela com dados de teste. Registrar ambiente, commit, resultados e screenshots desktop/móvel antes da aprovação visual.
2. **Permissões e convites:** definir matriz de papéis/unidades; implementar autorização no banco e nas RPCs, além da interface; adicionar convite por serviço de backend. Concluir quando testes negativos provarem que um usuário não lê nem altera dados fora de seu escopo e o convite tenha expiração/revogação.
3. **Integrações externas:** priorizar provedor e métricas com a equipe; implementar OAuth no servidor, armazenamento protegido de credenciais, sincronização idempotente, estado de falha e última atualização. Aceitar somente após reconciliar métricas com a conta de origem. Implementar agenda externa como entrega separada.
4. **Privacidade operacional:** definir procedimento de verificação de identidade, responsáveis, retenção e sistemas afetados; adicionar execução controlada de exportação/correção/revogação/exclusão com trilha de execução. Concluir somente quando houver prova da operação em cada destino, sem confundir mudança de status com execução.
5. **Editor e histórico:** validar necessidade de blocos reordenáveis antes de expandir o esquema; adicionar prévia isolada de submissões, comparação de versões e restauração do cartão, com testes de concorrência. Se houver construtor visual, exigir equivalência entre prévia e publicação e migração dos conteúdos existentes.
6. **Escala e atribuição:** paginar mídia/histórico, acrescentar busca e gestão de links, padronizar fuso operacional e definir preservação de UTMs. Concluir com conjuntos acima dos limites atuais, QR lido em dispositivo e atribuição conferida ponta a ponta.

## Evidência disponível

Esta documentação registra comportamento identificado em código e SQL. Não certifica aplicação da migração remota, entrega de notificações, políticas de armazenamento, execução dos critérios de aceite, acessibilidade completa ou fidelidade visual. Resultados de build, testes e implantação devem ser anexados pelo responsável pela entrega com o commit correspondente; resultados de versões anteriores não validam automaticamente este workspace.

### Verificação registrada nesta entrega

- Código funcional enviado no commit `68befd0c7c805b5600e05d79cf4b2711b916931b`, PR #40 em rascunho.
- Migrations `site_admin_workspace` e `site_admin_media_list` aplicadas no projeto Vert em 14/10/2026.
- Testes SQL transacionais passaram para leitura/escrita sem identidade administrativa, rejeição da RPC de membros e isolamento entre formulário publicado e rascunho. Todos os registros de teste foram revertidos; nenhum lead foi criado nem aviso enviado.
- Os seis testes do modelo de dashboard passaram. A implantação Vercel `dpl_Df5D5M4DxHAw3oaKR8UMHdpRmyeD` concluiu o build e chegou a READY para esse commit.
- A página de login da nova prévia carregou; as 29 entradas de navegação foram montadas no DOM. A conferência visual e de fluxos internos permanece bloqueada pela ausência de sessão administrativa no navegador de teste. Não foi alterada a autenticação para contornar esse bloqueio.
- O upload do editor sinaliza atividade ao formulário e bloqueia publicação até concluir. Remover/trocar imagem também marca edição pendente.
- A versão ainda não foi mesclada em `main`; a interface pública em produção não foi substituída por este PR. As adições de banco já estão presentes.
