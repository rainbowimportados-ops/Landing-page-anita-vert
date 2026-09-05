# Instituto Vert

Duas páginas no mesmo build, servidas pelo projeto `instituto-vert` na Vercel.

| Rota | O que é |
| --- | --- |
| `/` | **Cartão digital** — página mobile-first de contatos e agendamento |
| `/agendar` | **Landing page** — página de captação com tratamentos, processo e FAQ |
| `/admin` | Painel administrativo do cartão digital |

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

### Pendências antes de divulgar esta rota

`src/config/site.ts` tem itens marcados com `TODO` que a clínica precisa
confirmar:

- endereço completo e horário de atendimento das duas unidades;
- link do Google Maps de cada unidade (`mapsUrl`) — sem ele o botão "Como
  chegar" não aparece;
- valor da primeira avaliação, convênios aceitos e formas de pagamento (FAQ);
- calendário dos cursos e condições da locação de consultório;
- razão social, CNPJ e responsável técnico com CRO no rodapé — exigidos pelo CFO
  para publicidade odontológica.

A seção de depoimentos só é renderizada quando `depoimentos` tem itens.
Preencher **apenas** com depoimentos reais e autorizados pelo paciente.

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
