# Instituto Vert

Duas páginas no mesmo build, servidas pelo projeto `instituto-vert` na Vercel.

| Rota | O que é |
| --- | --- |
| `/` | **Cartão digital** — página mobile-first de contatos e agendamento |
| `/agendar` | **Landing page** — página de captação com tratamentos, processo e FAQ |
| `/config` | Painel de configuração da landing page (login) |
| `/admin` | Painel administrativo do cartão digital |
| `/privacidade`, `/termos` | Política de privacidade e termos de uso |

O subdomínio **`vert.institutovert.app`** serve a landing page na raiz — um
rewrite condicionado ao host manda `/` para `/agendar` — e o painel dela
continua em `/config`.

## Cartão digital (`/`)

- WhatsApp para as unidades de Franca e Ribeirão Preto
- resultados clínicos reais autorizados
- vídeo vertical otimizado
- Instagram e rotas no Google Maps
- download do contato em formato vCard
- área para dentistas

Conteúdo editável pelo painel em `/admin`, gravado na tabela
`digital_card_content` do Supabase.

## Landing page (`/agendar`)

Página de conversão para tráfego de anúncio e busca: tratamentos, diferenciais,
o processo em quatro etapas, unidades, área para dentistas e FAQ.

Construída em React + TypeScript + Tailwind, com o conteúdo centralizado em
**`src/config/site.ts`** — dados da clínica, unidades, tratamentos, etapas, FAQ
e a seção para dentistas. Não é preciso mexer nos componentes para trocar copy.

### Fonte única de unidades e contatos

Endereço e WhatsApp das unidades, telefone da clínica e Instagram vêm do
cadastro do cartão (`digital_card_content`, editado em `/admin`) e valem para
as duas páginas. "Como chegar" é gerado a partir do endereço, então não
depende de link colado à mão. Os padrões em `src/config/site.ts` só entram se
o Supabase estiver fora do ar.

### Configuração pelo painel (`/config`)

O que está em `src/config/site.ts` é o **padrão**. O painel grava só as
diferenças na tabela `public.landing_content`, e elas são aplicadas por cima na
hora de renderizar. Campo em branco no painel mantém o texto do código; se o
Supabase estiver fora do ar, a página abre com os padrões em vez de quebrar.

Editável pelo painel — é onde ficam as pendências que a clínica precisa
preencher antes de divulgar a rota:

- endereço, horários, link do Google Maps e WhatsApp de cada unidade;
- respostas do FAQ (valor da avaliação, convênios, formas de pagamento);
- depoimentos — a seção só aparece quando houver ao menos um, e devem ser
  reais e autorizados pelo paciente;
- razão social, CNPJ e responsável técnico com CRO no rodapé, exigidos pelo CFO
  para publicidade odontológica. Enquanto vazio, a linha não é exibida.

Segue apenas no código: textos dos tratamentos, diferenciais, etapas e a seção
para dentistas.

### Login e permissão

Entrada por link mágico do Supabase, sem senha. Quem pode salvar não é decidido
no navegador: o RLS de `landing_content` exige que o usuário esteja em
`digital_card_admins` — a mesma tabela que já governa o painel do cartão. A
tela apenas reflete essa decisão; um usuário logado fora dessa lista recebe o
erro do banco ao tentar salvar.

## Captação e medição

**Leads.** Landing e cartão usam a mesma função pública do Supabase,
`site_capturar_lead(p jsonb)`. Ela valida os dados, limita abusos (3 envios
por telefone e 60 no total a cada 10 min) e grava em:

- `digital_card_leads` — lista que o painel `/admin` já exibe;
- `crm_contacts` — uma pessoa por telefone normalizado (nunca sobrescreve nome);
- `crm_leads` — uma oportunidade por pedido, com `intent`, `source_surface`,
  unidade, `utm`, página e botão de entrada.

"Já sou paciente" (`intent = paciente_atual`) identifica a pessoa, mas não
cria oportunidade: é atendimento, não aquisição. Se o banco falhar ou demorar
mais de 4 s, o WhatsApp abre mesmo assim.

**Eventos.** As duas páginas gravam em `public.digital_card_clicks`:

| coluna | conteúdo |
| --- | --- |
| `superficie` | `digital_card` ou `landing` |
| `evento` | `page_view`, `cta_click`, `form_opened`, `lead_created`, `whatsapp_opened`, `consent` |
| `botao` | detalhe, ex. `hero_agendar`, `whatsapp_paciente` |
| `unidade`, `origem`, `dispositivo`, `pagina` | contexto, sem dado pessoal |
| `visitor_id`, `instagram_handle` | só no cartão e só com consentimento |

Visitas e cliques são contados sempre de forma anônima; o consentimento só
liga os eventos a uma pessoa. `public.link_clicks` guarda o histórico antigo
da landing e não recebe mais eventos.

Para separar campanhas, divulgue a URL com `?utm_source=instagram_bio`.

## Desenvolvimento

```bash
npm install
npm run dev
```

Outros scripts: `npm run build`, `npm run preview`, `npm run typecheck`.
O build de produção sai em `dist`.
