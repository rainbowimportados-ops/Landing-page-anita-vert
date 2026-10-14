import { Fragment, useEffect } from 'react'
import { LazyMotion, domAnimation } from 'motion/react'
import { Banner } from './components/Banner'
import { AvisoPrivacidade } from './components/AvisoPrivacidade'
import { ProvedorDeCaptura } from './components/Captura'
import { BotaoFlutuante } from './components/BotaoFlutuante'
import { ChamadaFinal } from './components/ChamadaFinal'
import { Dentistas } from './components/Dentistas'
import { Detalhes } from './components/Detalhes'
import { Depoimentos } from './components/Depoimentos'
import { Diferenciais } from './components/Diferenciais'
import { Duvidas } from './components/Duvidas'
import { Etapas } from './components/Etapas'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { InstagramSecao } from './components/InstagramSecao'
import { Resultados } from './components/Resultados'
import { Rodape } from './components/Rodape'
import { Servicos } from './components/Servicos'
import { Sobre } from './components/Sobre'
import { ProvedorDeConteudo, useConteudo } from './lib/ConteudoContexto'
import { Unidades } from './components/Unidades'
import { iniciarRolagemSuave } from './lib/rolagemSuave'

export default function App() {
  useEffect(() => iniciarRolagemSuave(), [])

  return (
    <LazyMotion features={domAnimation} strict>
    <ProvedorDeConteudo>
      <ProvedorDeCaptura>
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-marca-forte focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-conteudo-inverso"
      >
        Pular para o conteúdo
      </a>

      <Header />
      <AvisoPrivacidade />

      <Pagina />

      <Rodape />
      <BotaoFlutuante />
      </ProvedorDeCaptura>
    </ProvedorDeConteudo>
    </LazyMotion>
  )
}


function Pagina() {
  const { blocos } = useConteudo()
  const componentes = { detalhes: <Detalhes />, banner: <Banner />, tratamentos: <Servicos />,
    resultados: <Resultados />, sobre: <Sobre />, diferenciais: <Diferenciais />,
    etapas: <Etapas />, instagram: <InstagramSecao />, depoimentos: <Depoimentos />,
    unidades: <Unidades />, cursos: <Dentistas />, duvidas: <Duvidas /> }
  return <main id="conteudo-principal" tabIndex={-1}><Hero />
    {blocos.filter(b => b.visivel).map(b => <Fragment key={b.id}>{componentes[b.id]}</Fragment>)}
    <ChamadaFinal />
  </main>
}
