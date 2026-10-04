import { useEffect } from 'react'
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
import { ProvedorDeConteudo } from './lib/ConteudoContexto'
import { Unidades } from './components/Unidades'
import { Ambientes } from './components/Ambientes'
import { Manifesto } from './components/Manifesto'
import { iniciarRolagemSuave } from './lib/rolagemSuave'

export default function App() {
  useEffect(() => iniciarRolagemSuave(), [])

  return (
    <LazyMotion features={domAnimation} strict>
    <ProvedorDeConteudo>
      <ProvedorDeCaptura>
      <a
        href="#tratamentos"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-marca-forte focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-conteudo-inverso"
      >
        Pular para o conteúdo
      </a>

      <Header />
      <AvisoPrivacidade />

      <main>
        <Hero />
        <Detalhes />
        <Manifesto />
        <Banner />
        <Servicos />
        <Resultados />
        <Sobre />
        <Diferenciais />
        <Etapas />
        <InstagramSecao />
        <Depoimentos />
        <Ambientes />
        <Unidades />
        <Dentistas />
        <Duvidas />
        <ChamadaFinal />
      </main>

      <Rodape />
      <BotaoFlutuante />
      </ProvedorDeCaptura>
    </ProvedorDeConteudo>
    </LazyMotion>
  )
}
