import { BotaoFlutuante } from './components/BotaoFlutuante'
import { ChamadaFinal } from './components/ChamadaFinal'
import { Confianca } from './components/Confianca'
import { Dentistas } from './components/Dentistas'
import { Depoimentos } from './components/Depoimentos'
import { Diferenciais } from './components/Diferenciais'
import { Duvidas } from './components/Duvidas'
import { Etapas } from './components/Etapas'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Rodape } from './components/Rodape'
import { Servicos } from './components/Servicos'
import { Unidades } from './components/Unidades'

export default function App() {
  return (
    <>
      <a
        href="#tratamentos"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-marca-forte focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-conteudo-inverso"
      >
        Pular para o conteúdo
      </a>

      <Header />

      <main>
        <Hero />
        <Confianca />
        <Servicos />
        <Diferenciais />
        <Etapas />
        <Depoimentos />
        <Unidades />
        <Dentistas />
        <Duvidas />
        <ChamadaFinal />
      </main>

      <Rodape />
      <BotaoFlutuante />
    </>
  )
}
