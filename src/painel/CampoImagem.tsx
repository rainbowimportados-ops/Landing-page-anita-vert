import { useId, useState } from 'react'
import { enviarImagem } from './upload'

type Props = {
  rotulo: string
  dica?: string
  valor: string | undefined
  aoMudar: (url: string) => void
  /** Subpasta no bucket, para os arquivos não virarem um monte só. */
  pasta: string
}

/** Envia uma imagem, mostra a prévia e devolve a URL pública. */
export function CampoImagem({ rotulo, dica, valor, aoMudar, pasta }: Props) {
  const id = useId()
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function selecionar(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0]
    if (!arquivo) return

    setEnviando(true)
    setErro(null)
    try {
      aoMudar(await enviarImagem(arquivo, pasta))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível enviar.')
    } finally {
      setEnviando(false)
      evento.target.value = ''
    }
  }

  return (
    <div>
      <span className="block text-sm font-medium text-conteudo">{rotulo}</span>
      {dica && <p className="mt-1 text-xs leading-relaxed text-conteudo-tenue">{dica}</p>}

      <div className="mt-2 flex items-center gap-3">
        {valor && (
          <img
            src={valor}
            alt=""
            className="h-16 w-16 shrink-0 rounded-lg border border-borda object-cover"
          />
        )}

        <div className="flex flex-wrap gap-2">
          <label
            htmlFor={id}
            className="inline-flex min-h-[44px] cursor-pointer items-center rounded-full border border-borda-forte px-5 text-sm font-medium text-conteudo"
          >
            {enviando ? 'Enviando…' : valor ? 'Trocar imagem' : 'Escolher imagem'}
          </label>
          <input
            id={id}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={selecionar}
            disabled={enviando}
          />

          {valor && (
            <button
              type="button"
              onClick={() => aoMudar('')}
              className="inline-flex min-h-[44px] items-center text-sm font-medium text-red-700"
            >
              Remover
            </button>
          )}
        </div>
      </div>

      {erro && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {erro}
        </p>
      )}
    </div>
  )
}
