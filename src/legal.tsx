import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { clinica, rodapeLegal } from './config/site'
import { MarcaVert } from './components/MarcaVert'
import './index.css'

/**
 * Política de privacidade e termos de uso. Descrevem o que o site realmente
 * coleta (ver README, "Captação e medição"). Revisar com o jurídico da
 * clínica antes de divulgar; a data de atualização muda junto com o texto.
 */
type Secao = { titulo: string; paragrafos: string[] }

const atualizado = '26 de setembro de 2026'
const whatsapp = `https://wa.me/${clinica.whatsappAtendimento}`

const documentos: Record<string, { titulo: string; resumo: string; secoes: Secao[] }> = {
  privacidade: {
    titulo: 'Política de privacidade',
    resumo:
      'Como o Instituto Vert trata os dados de quem visita este site ou entra em contato por ele, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).',
    secoes: [
      {
        titulo: 'Quem é o responsável',
        paragrafos: [
          `O controlador dos dados é ${rodapeLegal.split(' · Responsável')[0]}, que opera a marca Instituto Vert.`,
          'Pedidos sobre seus dados podem ser feitos pelo WhatsApp da clínica, informado ao final desta página.',
        ],
      },
      {
        titulo: 'O que coletamos',
        paragrafos: [
          'Quando você pede contato pelo site: nome, número de WhatsApp, a unidade de preferência e o interesse informado (por exemplo, avaliação, curso ou locação). Profissionais também informam profissão e cidade. No cartão digital, o @ do Instagram é opcional.',
          'Junto com o pedido guardamos a origem da visita (como o parâmetro utm de uma campanha), a página e o botão usados.',
          'Visitas e cliques são contados de forma anônima, sem nome, telefone ou identificador pessoal: registramos o botão, o tipo de dispositivo, a página e a data.',
          'Só se você autorizar no aviso de privacidade do cartão digital guardamos um identificador do navegador e o @ do Instagram informado, para ligar seus acessos ao seu atendimento.',
        ],
      },
      {
        titulo: 'Para que usamos',
        paragrafos: [
          'Para responder ao seu pedido e agendar o atendimento na unidade escolhida.',
          'Para entender quais canais e campanhas trazem contatos, sempre em números agregados.',
          'Não vendemos nem cedemos seus dados para fins de publicidade de terceiros.',
        ],
      },
      {
        titulo: 'Base legal',
        paragrafos: [
          'Os dados de contato são tratados para atender a um pedido feito por você (procedimentos preliminares a um contrato). A ligação dos acessos à sua pessoa depende do seu consentimento, que pode ser recusado ou retirado a qualquer momento.',
        ],
      },
      {
        titulo: 'Onde ficam e por quanto tempo',
        paragrafos: [
          'Os dados ficam em um banco de dados com acesso restrito à equipe autorizada da clínica. Guardamos pelo tempo necessário ao atendimento e às obrigações legais, ou até você pedir a exclusão.',
        ],
      },
      {
        titulo: 'Seus direitos',
        paragrafos: [
          'Você pode pedir a confirmação de que tratamos seus dados, o acesso a eles, a correção, a exclusão ou a retirada do consentimento. Basta enviar o pedido pelo WhatsApp da clínica.',
        ],
      },
    ],
  },
  termos: {
    titulo: 'Termos de uso',
    resumo: 'Regras para o uso deste site do Instituto Vert.',
    secoes: [
      {
        titulo: 'Finalidade do site',
        paragrafos: [
          'Este site apresenta os tratamentos, as unidades e as formas de contato do Instituto Vert. As informações têm caráter informativo e não substituem a avaliação clínica presencial.',
        ],
      },
      {
        titulo: 'Resultados apresentados',
        paragrafos: [
          'As fotografias de antes e depois são de pacientes reais, publicadas com autorização e sem simulação digital do resultado. Cada caso é único, e os resultados podem variar de acordo com as características e necessidades de cada paciente.',
        ],
      },
      {
        titulo: 'Agendamento e contato',
        paragrafos: [
          'O envio do formulário não confirma um horário. O agendamento é combinado com a equipe pelo WhatsApp, conforme a disponibilidade de cada unidade. Valores e condições são apresentados após a avaliação.',
        ],
      },
      {
        titulo: 'Propriedade intelectual',
        paragrafos: [
          'Marca, textos, fotografias e vídeos deste site pertencem ao Instituto Vert ou são usados com autorização. Não é permitido reproduzi-los sem permissão por escrito.',
        ],
      },
      {
        titulo: 'Privacidade',
        paragrafos: ['O tratamento dos seus dados segue a nossa política de privacidade, disponível em /privacidade.'],
      },
    ],
  },
}

function Documento({ id }: { id: string }) {
  const doc = documentos[id] ?? documentos.privacidade
  return (
    <div className="min-h-screen bg-fundo text-conteudo">
      <header className="border-b border-borda bg-superficie-inversa text-conteudo-inverso">
        <div className="container-vert flex h-[4.5rem] items-center justify-between">
          <a href="/agendar" aria-label={`${clinica.nome} — início`} className="inline-flex min-h-[44px] items-center">
            <MarcaVert className="h-6" />
          </a>
          <a href="/agendar" className="text-sm text-conteudo-inverso-suave underline-offset-4 hover:underline">Voltar ao site</a>
        </div>
      </header>
      <main className="container-vert max-w-3xl py-16 sm:py-20">
        <p className="olho">Atualizado em {atualizado}</p>
        <h1 className="titulo-secao mt-3">{doc.titulo}</h1>
        <p className="lead mt-5 text-conteudo-suave">{doc.resumo}</p>
        {doc.secoes.map((secao) => (
          <section key={secao.titulo} className="mt-10">
            <h2 className="font-display text-2xl">{secao.titulo}</h2>
            {secao.paragrafos.map((texto) => (
              <p key={texto} className="mt-3 leading-relaxed text-conteudo-suave">{texto}</p>
            ))}
          </section>
        ))}
        <p className="mt-12 border-t border-borda pt-6 text-sm text-conteudo-tenue">
          Contato: <a className="underline" href={whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp da clínica</a>
          {' · '}{rodapeLegal}
        </p>
      </main>
    </div>
  )
}

const container = document.getElementById('root')
if (!container) throw new Error('Elemento #root não encontrado')
createRoot(container).render(
  <StrictMode>
    <Documento id={container.dataset.documento ?? 'privacidade'} />
  </StrictMode>,
)
