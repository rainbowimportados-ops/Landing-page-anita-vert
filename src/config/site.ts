/**
 * Conteúdo editável da landing page do Instituto Vert.
 *
 * Os itens marcados com TODO precisam ser confirmados pela clínica antes de
 * publicar. Depoimentos começam vazios de propósito: nada aqui deve ser
 * inventado.
 */

export type Unidade = {
  /** Chave curta gravada na coluna `unidade` de public.link_clicks. */
  slug: string
  nome: string
  cidade: string
  endereco: string
  /** Telefone no formato internacional, só dígitos: 55 + DDD + número. */
  whatsapp: string
  /** Texto pré-preenchido na conversa do WhatsApp. */
  mensagem: string
  /** Vazio esconde a linha de horários. Preenchível pelo painel. */
  horarios: string[]
  /** TODO: colar o link "Compartilhar › Copiar link" do Google Maps. */
  mapsUrl: string
}

export type Servico = {
  titulo: string
  descricao: string
  /** Nome do ícone definido em src/components/Icon.tsx */
  icone: IconeServico
}

export type IconeServico =
  | 'sparkle'
  | 'smile'
  | 'align'
  | 'tooth'
  | 'crown'
  | 'clipboard'

export type Depoimento = {
  nome: string
  texto: string
  tratamento: string
}

export const clinica = {
  nome: 'Instituto Vert',
  tagline: 'Odontologia estética e clínica',
  descricao:
    'Planejamento individual, materiais de alto padrão e uma equipe que acompanha você do primeiro diagnóstico ao resultado final.',
  instagram: 'https://www.instagram.com/institutovert.br',
  /** Vazio esconde o link no rodapé — a clínica atende por WhatsApp. */
  email: '',
  siteUrl: 'https://institutovert.app',
  /** Número comercial, usado quando o visitante ainda não escolheu unidade. */
  whatsappComercial: '5516988094942',
  /** Número do atendimento, para quem já é paciente. */
  whatsappAtendimento: '5516999657667',
}

/**
 * Identificação exigida pela resolução do CFO para publicidade odontológica.
 * Dados do contrato social e do registro no CRO-SP; o painel em /config pode
 * sobrescrever, mas o padrão já é o correto.
 */
export const rodapeLegal =
  'CLÍNICA DRA ANITA MATIAS DE ALMEIDA LTDA · CNPJ 37.669.064/0001-90 · ' +
  'Responsável técnica: Dra. Anita Matias de Almeida — CRO-SP 132978'

export const unidades: Unidade[] = [
  {
    slug: 'franca',
    nome: 'Vert Franca',
    cidade: 'Franca / SP',
    endereco: 'Rua Capitão Urias Batista de Avelar, 3736 — Vila Chico Júlio, Franca/SP, CEP 14405-217',
    whatsapp: '5516988094942',
    mensagem: 'Olá! Vim pelo site e gostaria de agendar uma avaliação na unidade de Franca.',
    horarios: [],
    mapsUrl: '',
  },
  {
    slug: 'ribeirao-preto',
    nome: 'Vert Ribeirão Preto',
    cidade: 'Ribeirão Preto / SP',
    endereco: 'Av. Presidente Vargas, 2001, Sala 98 — Jardim Santa Ângela, Ribeirão Preto/SP, CEP 14020-525',
    whatsapp: '5516988094942',
    mensagem:
      'Olá! Vim pelo site e gostaria de agendar uma avaliação na unidade de Ribeirão Preto.',
    horarios: [],
    mapsUrl: '',
  },
]

export const servicos: Servico[] = [
  {
    titulo: 'Lentes em resina',
    descricao:
      'Reanatomização do sorriso em resina composta, feita em poucas sessões e sem desgastar o dente sadio.',
    icone: 'sparkle',
  },
  {
    titulo: 'Estética do sorriso',
    descricao:
      'Clareamento, ajuste de forma e contorno gengival planejados a partir do seu rosto, não de um modelo pronto.',
    icone: 'smile',
  },
  {
    titulo: 'Ortodontia',
    descricao:
      'Aparelho fixo e alinhadores transparentes, com acompanhamento próximo em cada etapa do movimento.',
    icone: 'align',
  },
  {
    titulo: 'Clínico geral',
    descricao:
      'Restaurações, tratamento de canal, limpeza e prevenção — a base que sustenta qualquer resultado estético.',
    icone: 'tooth',
  },
  {
    titulo: 'Próteses e implantes',
    descricao:
      'Reabilitação de dentes ausentes, com dentista e protético trabalhando juntos ao longo do caso.',
    icone: 'crown',
  },
  {
    titulo: 'Avaliação e diagnóstico',
    descricao:
      'Exame clínico, registro fotográfico e plano de tratamento com etapas, prazos e valores por escrito.',
    icone: 'clipboard',
  },
]

export const diferenciais = [
  {
    titulo: 'Plano antes do orçamento',
    texto:
      'Você sai da avaliação sabendo o que será feito, em quantas sessões e por que cada etapa existe.',
  },
  {
    titulo: 'Duas unidades no interior paulista',
    texto: 'Franca e Ribeirão Preto, com a mesma equipe e o mesmo protocolo clínico.',
  },
  {
    titulo: 'Estética sem exagero',
    texto:
      'O objetivo é um sorriso que combine com o seu rosto — natural o bastante para ninguém perguntar o que você fez.',
  },
  {
    titulo: 'Acompanhamento depois da alta',
    texto:
      'Retornos programados para manter o resultado ao longo do tempo, não apenas no dia da entrega.',
  },
]

export const etapas = [
  {
    titulo: 'Conversa no WhatsApp',
    texto: 'Você conta o que incomoda e a equipe indica o tipo de avaliação mais adequado.',
  },
  {
    titulo: 'Avaliação na clínica',
    texto:
      'Exame clínico, registro fotográfico e discussão das possibilidades reais para o seu caso.',
  },
  {
    titulo: 'Plano de tratamento',
    texto:
      'Você recebe o plano por escrito, com etapas, número de sessões e condições de pagamento.',
  },
  {
    titulo: 'Tratamento e retornos',
    texto: 'Execução acompanhada em cada fase e retornos programados após a conclusão.',
  },
]

/**
 * Depoimentos reais de pacientes, com autorização de uso.
 * A seção só aparece quando esta lista tem itens — nunca preencher com texto fictício.
 */
export const depoimentos: Depoimento[] = []

/** `pendente` esconde a pergunta até o painel dar uma resposta de verdade. */
export const faq: Array<{ pergunta: string; resposta: string; pendente?: boolean }> = [
  {
    pergunta: 'Quanto custa a primeira avaliação?',
    resposta: '',
    pendente: true,
  },
  {
    pergunta: 'Lentes em resina duram quanto tempo?',
    resposta:
      'A durabilidade depende do caso e dos hábitos de cada paciente. Na avaliação explicamos a expectativa realista para o seu sorriso e a manutenção necessária para preservar o resultado.',
  },
  {
    pergunta: 'Vocês atendem por convênio?',
    resposta: '',
    pendente: true,
  },
  {
    pergunta: 'Quais são as formas de pagamento?',
    resposta: '',
    pendente: true,
  },
  {
    pergunta: 'Preciso trocar de dentista para fazer só a parte estética?',
    resposta:
      'Não. Muitos pacientes chegam com o clínico geral em dia e procuram a Vert apenas para a etapa estética. Nesse caso avaliamos a saúde bucal, alinhamos o que precisa estar resolvido antes e seguimos com o planejamento.',
  },
]

/** Seção voltada a dentistas — cursos e locação de sala. */
export const profissionais = {
  titulo: 'Para dentistas',
  texto:
    'Além do atendimento a pacientes, a Vert mantém duas frentes voltadas a colegas de profissão.',
  itens: [
    {
      titulo: 'Cursos e imersões',
      texto:
        'Formações práticas em estética e reabilitação, com turmas reduzidas. Fale com a equipe para saber das próximas turmas.',
      botao: 'Quero saber dos cursos',
      mensagem: 'Olá! Vim pelo site e gostaria de informações sobre os cursos do Instituto Vert.',
    },
    {
      titulo: 'Locação de consultório',
      texto:
        'Salas equipadas para atendimento por período, dentro da estrutura da clínica. Consulte disponibilidade e condições.',
      botao: 'Quero alugar uma sala',
      mensagem: 'Olá! Vim pelo site e gostaria de informações sobre a locação de consultório.',
    },
  ],
}
