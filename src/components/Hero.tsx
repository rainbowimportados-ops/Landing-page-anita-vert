import { useEffect, useRef, useState } from 'react'
import { sobre } from '../config/site'
import { useConteudo } from '../lib/ConteudoContexto'
import foto1200 from '../assets/hero/dra-anita-1200.webp'
import foto720 from '../assets/hero/dra-anita-720.webp'
import { BotaoWhatsApp } from './CTA'
import { IconBrilho, IconLocal, IconSeta } from './Icon'
import './hero-vert.css'

// Só fatos da clínica — nada de números inventados de pacientes ou de satisfação.
const fatos = [
  { valor: 'Por escrito', rotulo: 'Plano com etapas, sessões e valores' },
  { valor: 'Sem retoque', rotulo: 'Fotos reais dos nossos pacientes' },
]

const MENSAGEM = 'Olá! Vim pelo site e gostaria de agendar uma avaliação.'

/**
 * Primeira dobra em tela cheia: a Dra. Anita sorrindo ocupa o fundo à direita,
 * com um véu escuro só sob o texto, para o rosto e o sorriso ficarem livres.
 * Toda a animação é CSS: a foto entra com um cruzamento suave e respira devagar,
 * e cada bloco de texto sobe em sequência. Nada disso roda com
 * `prefers-reduced-motion`.
 */
export function Hero() {
  const { clinica, unidades } = useConteudo()
  const foto = useRef<HTMLImageElement>(null)
  const [pronta, setPronta] = useState(false)

  // A imagem pode já estar no cache quando o componente monta: aí o onLoad não dispara.
  useEffect(() => {
    if (foto.current?.complete) setPronta(true)
  }, [])

  return (
    <section id="topo" className="hv">
      <div className="hv__midia" aria-hidden="true">
        <img
          ref={foto}
          className={`hv__foto ${pronta ? 'is-pronta' : ''}`}
          src={foto1200}
          srcSet={`${foto720} 720w, ${foto1200} 1200w`}
          sizes="(min-width: 900px) 62vw, 100vw"
          alt=""
          width={1200}
          height={1800}
          fetchPriority="high"
          onLoad={() => setPronta(true)}
        />
        <div className="hv__veu" />
        <div className="hv__linhas">
          <span /><span /><span />
        </div>
      </div>

      <div className="hv__miolo">
        <div className="hv__texto">
          <p className="hv__nota">
            <IconBrilho className="hv__nota-icone" />
            <span>Odontologia estética em<br />Franca e Ribeirão Preto</span>
          </p>

          <h1 className="hv__titulo">
            Sorrisos que<br />
            transformam<br />
            <em>histórias.</em>
          </h1>

          <p className="hv__sub">
            Mais que estética, devolvemos confiança, bem-estar e qualidade de vida. Resultados reais, com
            planejamento e segurança.
          </p>

          <div className="hv__acoes">
            <BotaoWhatsApp
              rastreio="hero_agendar"
              intencao="avaliacao"
              numero={clinica.whatsappComercial}
              mensagem={MENSAGEM}
              icone="nenhum"
              className="hv__ir"
            >
              Agendar avaliação
              <span className="hv__ir-seta" aria-hidden="true"><IconSeta /></span>
            </BotaoWhatsApp>

            <a className="hv__prova" href="#unidades">
              <span className="hv__pontos" aria-hidden="true">
                <i /><i />
              </span>
              <span className="hv__prova-texto">
                <strong>{unidades.length > 1 ? `${unidades.length} unidades` : 'Nossa unidade'}</strong>
                {unidades.map((u) => u.cidade.split(' /')[0]).join(' · ')}
              </span>
            </a>
          </div>

          <ul className="hv__fatos">
            {fatos.map((fato) => (
              <li key={fato.valor} className="hv__fato">
                <span className="hv__fato-marca" aria-hidden="true">*</span>
                <span className="hv__fato-valor">{fato.valor}</span>
                <span className="hv__fato-rotulo">{fato.rotulo}</span>
                <span className="hv__fato-traco" aria-hidden="true" />
              </li>
            ))}
          </ul>
        </div>

        <p className="hv__legenda">
          <strong>{sobre.nome}</strong>
          {sobre.cargo}
        </p>
      </div>

      <div className="hv__rodape">
        <span className="hv__marca-dagua" aria-hidden="true">VERT</span>
        <div className="hv__unidades">
          <span className="hv__unidades-rotulo">Nossas unidades</span>
          <ul>
            {unidades.map((u) => (
              <li key={u.slug}>
                <a href="#unidades">
                  <IconLocal />
                  <span>{u.cidade.split(' /')[0]}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
