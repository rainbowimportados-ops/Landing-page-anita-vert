# Instituto Vert

Duas páginas no mesmo build, servidas pelo projeto `instituto-vert` na Vercel.

| Rota | O que é |
| --- | --- |
| `/` | **Cartão digital** — página mobile-first de contatos e agendamento |
| `/agendar` | **Landing page** — página de captação com tratamentos, processo e FAQ |
| `/config` | Painel de configuração da landing page (login) |
| `/admin` | Painel administrativo do cartão digital |

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

## Medição de cliques

As duas páginas gravam na mesma tabela `public.link_clicks`:

| coluna | conteúdo |
| --- | --- |
| `botao` | identificador do botão, ex. `hero_agendar`, `unidade_franca_agendar` |
| `unidade` | `franca`, `ribeirao-preto` ou `null` quando o CTA é geral |
| `origem` | `utm_source` da URL, senão o domínio de origem, senão `direto` |
| `dispositivo` | `mobile`, `tablet` ou `desktop` |

Nenhum dado pessoal é enviado. A chave usada é a publishable, cuja única
permissão nessa tabela é `INSERT`.

Para separar campanhas, divulgue a URL com `?utm_source=instagram_bio`.

## Desenvolvimento

```bash
npm install
npm run dev
```

Outros scripts: `npm run build`, `npm run preview`, `npm run typecheck`.
O build de produção sai em `dist`.
