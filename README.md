# Landing page — Instituto Vert

Landing page de captação do **Instituto Vert** (odontologia estética e clínica),
com unidades em Franca e Ribeirão Preto. Todos os CTAs levam ao WhatsApp e são
registrados na tabela `public.link_clicks` do Supabase.

## Stack

- Vite 6 + React 18 + TypeScript
- Tailwind CSS 3.4
- Sem backend próprio: o registro de cliques vai direto para a API REST do Supabase

## Rodando localmente

```bash
npm install
cp .env.example .env   # já vem com as chaves públicas do projeto
npm run dev
```

Outros scripts: `npm run build`, `npm run preview`, `npm run typecheck`.

## Onde editar o conteúdo

Praticamente todo o texto da página está em **`src/config/site.ts`**: dados da
clínica, unidades, tratamentos, diferenciais, etapas, FAQ e a seção para
dentistas. Não é preciso mexer nos componentes para trocar copy.

### Pendências antes de publicar

O arquivo `src/config/site.ts` tem itens marcados com `TODO` que precisam ser
confirmados pela clínica:

- endereço completo e horário de atendimento das duas unidades;
- link do Google Maps de cada unidade (`mapsUrl`) — sem ele o botão "Como
  chegar" não aparece;
- perfil do Instagram, e-mail de contato e domínio definitivo;
- valor da primeira avaliação, convênios aceitos e formas de pagamento (FAQ);
- calendário dos cursos e condições da locação de consultório;
- razão social, CNPJ e responsável técnico com CRO no rodapé — exigidos pelo CFO
  para publicidade odontológica.

Também confirmar se cada unidade deve usar um número de WhatsApp próprio. Hoje as
duas apontam para o comercial (`5516988094942`); o atendimento
(`5516999657667`) é usado apenas no botão "Já sou paciente".

### Depoimentos

A seção de depoimentos só é renderizada quando `depoimentos` em
`src/config/site.ts` tem itens. Preencher **apenas** com depoimentos reais e
autorizados pelo paciente.

## Medição de cliques

Cada CTA chama `registrarClique(botao, unidade)` (`src/lib/analytics.ts`), que
insere uma linha em `public.link_clicks` com:

| coluna        | conteúdo                                                        |
| ------------- | --------------------------------------------------------------- |
| `botao`       | identificador do botão, ex. `hero_agendar`, `unidade_franca_agendar` |
| `unidade`     | `franca`, `ribeirao-preto` ou `null` quando o CTA é geral        |
| `origem`      | `utm_source` da URL, senão o domínio de origem, senão `direto`   |
| `dispositivo` | `mobile`, `tablet` ou `desktop`                                  |

Nenhum dado pessoal é enviado. A chave usada é a publishable/anon, cuja única
permissão nessa tabela é `INSERT` (policy `anon pode registrar clique`).

Exemplo de leitura dos resultados:

```sql
select botao, unidade, origem, count(*)
from public.link_clicks
where created_at > now() - interval '30 days'
group by 1, 2, 3
order by count(*) desc;
```

Para separar campanhas, basta divulgar a URL com `?utm_source=instagram_bio`.

## Deploy

Build estático em `dist/`. As variáveis `VITE_SUPABASE_URL` e
`VITE_SUPABASE_ANON_KEY` precisam existir no ambiente de build — sem elas a
página funciona normalmente, apenas sem registrar os cliques.
