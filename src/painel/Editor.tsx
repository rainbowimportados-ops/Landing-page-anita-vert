import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  clinica as clinicaPadrao,
  faq as faqPadrao,
  rodapeLegal as rodapeLegalPadrao,
  unidades as unidadesPadrao,
} from '../config/site'
import { SLUG, type Ajustes } from '../lib/conteudo'
import './editor-workspace.css'
import { BLOCOS, normalizarBlocos, type BlocoId } from '../lib/blocos'
import { CampoImagem } from './CampoImagem'
import { supabase } from './supabase'

type Estado = 'carregando' | 'pronto' | 'salvando' | 'salvo' | 'erro'

const rotulo = 'block text-sm font-medium text-conteudo'
const campo =
  'mt-1.5 w-full rounded-lg border border-borda-forte bg-superficie px-3 py-2.5 text-sm text-conteudo'

export function Editor({ email, aoSair, abas }: { email: string; aoSair: () => void; abas?: ReactNode }) {
  const integrado = new URLSearchParams(window.location.search).has('embed')
  const [ajustes, setAjustes] = useState<Ajustes>({})
  const [estado, setEstado] = useState<Estado>('carregando')
  const [erro, setErro] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState('')
  const [baseStamp, setBaseStamp] = useState<string | null>(null)
  const [draftStamp, setDraftStamp] = useState<string | null>(null)
  const [changed, setChanged] = useState(false)
  const [uploading,setUploading]=useState(false)
  const [loaded,setLoaded] = useState(false)
  const [mobilePreview, setMobilePreview] = useState(false)
  const [painel, setPainel] = useState('topo')
  const blocos = normalizarBlocos(ajustes.blocos)
  function moverBloco(id: BlocoId, delta: number) {
    const lista = normalizarBlocos(ajustes.blocos)
    const index = lista.findIndex(b => b.id === id), destino = index + delta
    if (destino < 0 || destino >= lista.length) return
    ;[lista[index], lista[destino]] = [lista[destino], lista[index]]
    setAjustes(a => ({ ...a, blocos: lista })); setChanged(true)
  }
  const preview = useRef<HTMLIFrameElement>(null)
  const previewWindow = useRef<Window | null>(null)
  const [previewReady, setPreviewReady] = useState(false)
  function abrirPrevia() {
    previewWindow.current = window.open('/preview/?preview=admin', 'vert-editor-preview')
    enviarPrevia()
  }
  function enviarPrevia() { for(const target of [preview.current?.contentWindow,previewWindow.current]) if(target&&!target.closed) target.postMessage({type:'vert-editor-preview',ajustes},window.location.origin) }
  useEffect(() => { enviarPrevia() }, [ajustes])
  useEffect(() => {
    const ready=(event:MessageEvent)=>{if(event.origin===window.location.origin&&[preview.current?.contentWindow,previewWindow.current].includes(event.source as Window)&&event.data?.type==='vert-preview-ready'){if(event.source===preview.current?.contentWindow)setPreviewReady(true);enviarPrevia()}}
    window.addEventListener('message',ready);return()=>window.removeEventListener('message',ready)
  },[ajustes])
  useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(changed)e.preventDefault()};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)},[changed])

  useEffect(() => {
    let active=true
    Promise.all([
      supabase.from('landing_content').select('content,updated_at').eq('slug',SLUG).maybeSingle(),
      supabase.from('site_content_drafts').select('content,base_updated_at,updated_at').eq('target','landing').maybeSingle(),
    ]).then(([published,draft])=>{
      if(!active)return
      if(published.error||draft.error){setErro(published.error?.message||draft.error?.message||'Falha ao carregar');setEstado('erro');return}
      setAjustes((draft.data?.content??published.data?.content??{}) as Ajustes)
      setBaseStamp(draft.data?draft.data.base_updated_at:published.data?.updated_at??null)
      setDraftStamp(draft.data?.updated_at??null)
      setMensagem(draft.data?'Rascunho recuperado. O site publicado permanece igual.':'Você está editando uma cópia do conteúdo publicado.')
      setLoaded(true)
      setEstado('pronto')
    })
    return()=>{active=false}
  }, [])

  async function salvar(publicar=false) {
    if(uploading)return
    setEstado('salvando');setErro(null)
    try {
      const user=await supabase.auth.getUser()
      if(user.error)throw user.error
      const record={target:'landing',content:ajustes,base_updated_at:baseStamp,updated_at:new Date().toISOString(),updated_by:user.data.user?.id}
      const result=draftStamp
        ? await supabase.from('site_content_drafts').update(record).eq('target','landing').eq('updated_at',draftStamp).select('updated_at').single()
        : await supabase.from('site_content_drafts').insert(record).select('updated_at').single()
      if(result.error)throw new Error('Não foi possível salvar. Outro editor pode ter atualizado o rascunho. Recarregue para conferir. '+result.error.message)
      setDraftStamp(result.data.updated_at)
      setChanged(false)
      if(publicar){
        const published=await supabase.rpc('site_publish_draft',{p_target:'landing',p_updated_at:result.data.updated_at})
        if(published.error)throw published.error
        setDraftStamp(null)
        const current=await supabase.from('landing_content').select('updated_at').eq('slug',SLUG).single()
        if(current.error)throw current.error
        setBaseStamp(current.data.updated_at)
        setMensagem('Publicado. O site já usa esta versão.')
      } else setMensagem('Rascunho salvo. O site publicado permanece igual.')
      setEstado('salvo')
    }catch(e){setErro(e instanceof Error?e.message:'Não foi possível salvar');setEstado('erro')}
  }

  async function descartarRascunho() {
    if(!window.confirm('Descartar este rascunho e carregar a versão publicada? As alterações não publicadas serão perdidas.'))return
    setEstado('salvando')
    const result=draftStamp?await supabase.from('site_content_drafts').delete().eq('target','landing').eq('updated_at',draftStamp).select('target').single():{error:null}
    if(result.error){setErro('O rascunho mudou. Recarregue antes de descartar.');setEstado('erro');return}
    setChanged(false)
    window.location.reload()
  }

  function definirUnidade(slug: string, campo: string, valor: string | string[]) {
    setAjustes((a) => ({
      ...a,
      unidades: { ...a.unidades, [slug]: { ...a.unidades?.[slug], [campo]: valor } },
    }))
  }

  if (estado === 'carregando') {
    return <p className="container-vert py-20 text-sm text-conteudo-suave">Carregando…</p>
  }

  if(!loaded) return <div className="p-8"><p role="alert">{erro}</p><button onClick={()=>window.location.reload()}>Tentar carregar novamente</button></div>

  return (
    <div className={`${integrado ? 'min-h-full' : 'min-h-dvh'} bg-fundo pb-28`}>
      {!integrado && <header className="border-b border-borda bg-superficie">
        <div className="container-vert flex h-16 items-center justify-between gap-4">
          <span className="font-display text-lg text-conteudo">
            Configuração da <span className="text-marca">landing</span>
          </span>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-conteudo-tenue sm:inline">{email}</span>
            <button
              onClick={aoSair}
              className="inline-flex min-h-[44px] items-center rounded-full border border-borda-forte px-4 text-sm font-medium text-conteudo"
            >
              Sair
            </button>
          </div>
        </div>
        {abas}
      </header>}

      <div className="vert-editor-layout">
      <aside className="vert-block-sidebar"><h2>Blocos da página</h2><p>Escolha um bloco para editar.</p>
        <button type="button" className={painel==='topo'?'is-selected':''} onClick={()=>setPainel('topo')}>Topo da página <small>Fixo</small></button>
        {blocos.map((b,index)=><div className={`vert-block-row ${painel===b.id?'is-selected':''}`} key={b.id}>
          <button type="button" onClick={()=>setPainel(b.id)}>{BLOCOS.find(([id])=>id===b.id)?.[1]}<small>{b.visivel?'Visível':'Oculto'}</small></button>
          <div className="vert-block-controls">
            <button type="button" disabled={index===0||estado==='salvando'} aria-label={`Mover ${b.id} para cima`} onClick={()=>moverBloco(b.id,-1)}>↑</button>
            <button type="button" disabled={index===blocos.length-1||estado==='salvando'} aria-label={`Mover ${b.id} para baixo`} onClick={()=>moverBloco(b.id,1)}>↓</button>
            <input type="checkbox" aria-label={`Exibir ${b.id}`} checked={b.visivel} disabled={b.id==='unidades'||estado==='salvando'} onChange={e=>{setChanged(true);setAjustes(a=>({...a,blocos:blocos.map(x=>x.id===b.id?{...x,visivel:e.target.checked}:x)}))}} />
          </div>
        </div>)}
        <button type="button" className={painel==='contato'?'is-selected':''} onClick={()=>setPainel('contato')}>Contato e rodapé <small>Fixo</small></button>
      </aside>
      <main className="vert-editor-fields container-vert space-y-10 py-6" onChangeCapture={()=>setChanged(true)}>
      <fieldset disabled={estado==='salvando'||uploading} className="space-y-10">
        <div className="vert-draft-tools"><button type="button" disabled={estado==='salvando'||uploading} onClick={()=>void descartarRascunho()}>Descartar rascunho e recarregar publicado</button><a href="/" target="_blank" rel="noopener">Conferir versão publicada ↗</a></div>
        <section hidden={painel!=='topo'}><h2 className="titulo-secao">Topo da página</h2><p className="lead">Título e apresentação. Em branco, usamos o texto original.</p>
          <label className={rotulo}>Título principal<input className={campo} maxLength={120} value={ajustes.topo?.titulo??''} placeholder="Sorrisos que transformam histórias." onChange={e=>setAjustes(a=>({...a,topo:{...a.topo,titulo:e.target.value}}))}/></label>
          <label className={rotulo}>Texto de apresentação<textarea className={campo} rows={4} maxLength={500} value={ajustes.topo?.texto??''} onChange={e=>setAjustes(a=>({...a,topo:{...a.topo,texto:e.target.value}}))}/></label>
        </section>
        {!['topo','contato','unidades','duvidas','banner'].includes(painel)&&<section><h2 className="titulo-secao">{BLOCOS.find(([id])=>id===painel)?.[1]}</h2><p className="lead">Use as setas e a caixa de visibilidade ao lado para organizar este bloco.</p><p className="lead">{painel==='resultados'?'As fotos e os casos são editados em Antes e depois.':painel==='depoimentos'?'Os textos são editados em Depoimentos e usados no site e no cartão.':'Este bloco mantém o conteúdo e o desenho do site.'}</p></section>}

        <section hidden={painel!=='contato'}>
          <h2 id="editor-contato" className="titulo-secao">Contato</h2>
          <p className="mt-2 rounded-card border border-borda bg-superficie-suave p-4 text-sm text-conteudo-suave">
            WhatsApp da clínica, Instagram (da clínica e da Dra. Anita), endereço e WhatsApp das
            unidades ficam em <strong>WhatsApp e contatos</strong> e <strong>Unidades</strong> e valem
            para o site e o cartão. Aqui ficam só o e-mail e um WhatsApp de atendimento, se for diferente.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {([
              ['whatsappAtendimento', 'WhatsApp do atendimento (se diferente)', '55 + DDD + número'],
              ['email', 'E-mail de contato', ''],
            ] as const).map(([chave, texto, dica]) => (
              <div key={chave}>
                <label className={rotulo} htmlFor={chave}>
                  {texto}
                </label>
                <input
                  id={chave}
                  className={campo}
                  placeholder={clinicaPadrao[chave]}
                  value={ajustes.clinica?.[chave] ?? ''}
                  onChange={(e) =>
                    setAjustes((a) => ({
                      ...a,
                      clinica: { ...a.clinica, [chave]: e.target.value },
                    }))
                  }
                />
                {dica && <p className="mt-1 text-xs text-conteudo-tenue">{dica}</p>}
              </div>
            ))}
          </div>
        </section>

        <section hidden={painel!=='unidades'}>
          <h2 id="editor-horarios" className="titulo-secao">Horários das unidades</h2>
          <div className="mt-5 space-y-8">
            {unidadesPadrao.map((unidade) => (
              <div key={unidade.slug} className="rounded-card border border-borda bg-superficie p-5">
                <h3 className="font-display text-lg text-conteudo">{unidade.nome}</h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className={rotulo}>Horários (um por linha)</label>
                    <textarea
                      className={campo}
                      rows={3}
                      placeholder={unidade.horarios.join('\n')}
                      value={(ajustes.unidades?.[unidade.slug]?.horarios ?? []).join('\n')}
                      onChange={(e) =>
                        definirUnidade(
                          unidade.slug,
                          'horarios',
                          e.target.value.split('\n').filter((l) => l.trim()),
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section hidden={painel!=='duvidas'}>
          <h2 id="editor-faq" className="titulo-secao">Perguntas frequentes</h2>
          <div className="mt-5 space-y-5">
            {faqPadrao.map((item) => (
              <div key={item.pergunta}>
                <label className={rotulo}>{item.pergunta}</label>
                <textarea
                  className={campo}
                  rows={3}
                  placeholder={item.resposta}
                  value={ajustes.faq?.[item.pergunta] ?? ''}
                  onChange={(e) =>
                    setAjustes((a) => ({
                      ...a,
                      faq: { ...a.faq, [item.pergunta]: e.target.value },
                    }))
                  }
                />
              </div>
            ))}
          </div>
        </section>

        <section hidden={painel!=='banner'}>
          <h2 id="editor-banner" className="titulo-secao">Campanha em destaque</h2>
          <p className="lead mt-2">
            Um banner na posição escolhida na lista de blocos. Fica oculto enquanto não houver imagem nem título.
          </p>
          <div className="mt-5 space-y-4">
            <CampoImagem
              rotulo="Imagem do banner"
              pasta="campanhas"
              valor={ajustes.banner?.imagem}
              aoEnviar={setUploading}
              aoMudar={(url) => {setChanged(true);setAjustes((a) => ({ ...a, banner: { ...a.banner, imagem: url } }))}}
            />
            <div>
              <label className={rotulo}>Título</label>
              <input
                className={campo}
                value={ajustes.banner?.titulo ?? ''}
                onChange={(e) =>
                  setAjustes((a) => ({ ...a, banner: { ...a.banner, titulo: e.target.value } }))
                }
              />
            </div>
            <div>
              <label className={rotulo}>Texto</label>
              <textarea
                className={campo}
                rows={2}
                value={ajustes.banner?.texto ?? ''}
                onChange={(e) =>
                  setAjustes((a) => ({ ...a, banner: { ...a.banner, texto: e.target.value } }))
                }
              />
            </div>
            <div>
              <label className={rotulo}>Link ao clicar</label>
              <input
                className={campo}
                placeholder="Deixe vazio para o banner não ser clicável"
                value={ajustes.banner?.link ?? ''}
                onChange={(e) =>
                  setAjustes((a) => ({ ...a, banner: { ...a.banner, link: e.target.value } }))
                }
              />
            </div>
          </div>
        </section>

        <section hidden={painel!=='contato'}>
          <h2 id="editor-rodape" className="titulo-secao">Rodapé legal</h2>
          <p className="lead mt-2">
            Razão social, CNPJ e responsável técnico com CRO. Exigido pela resolução do CFO para
            publicidade odontológica. Em branco, vale o texto padrão mostrado abaixo.
          </p>
          <textarea
            className={`${campo} mt-4`}
            rows={2}
            placeholder={rodapeLegalPadrao}
            value={ajustes.rodapeLegal ?? ''}
            onChange={(e) => setAjustes((a) => ({ ...a, rodapeLegal: e.target.value }))}
          />
        </section>

        <section hidden={painel!=='contato'} className="rounded-card border border-borda bg-superficie-suave p-5 text-sm text-conteudo-suave">
          <h2 className="font-display text-lg text-conteudo">O que fica em outras áreas</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li><strong>Depoimentos</strong>: em Depoimentos, no menu do painel. Valem para o site e o cartão.</li>
            <li><strong>Fotos de antes e depois</strong>: em Antes e depois. O caso publicado aparece no site e no cartão.</li>
            <li><strong>WhatsApp, Instagram e endereços</strong>: em WhatsApp e contatos e em Unidades.</li>
            <li><strong>Logotipo e foto do topo</strong>: em Dados da empresa (cartão). O site usa a identidade fixa do layout.</li>
          </ul>
        </section>
      </fieldset>
      </main>
      <aside className="vert-editor-preview"><header><strong>Prévia do site</strong><div><button type="button" aria-pressed={!mobilePreview} onClick={()=>setMobilePreview(false)}>Desktop</button><button type="button" aria-pressed={mobilePreview} onClick={()=>setMobilePreview(true)}>Celular</button></div></header>{!previewReady&&<div className="vert-preview-loading" role="status"><strong>Carregando prévia…</strong><p>Se a visualização não aparecer, abra a prévia em outra aba.</p><button type="button" onClick={abrirPrevia}>Abrir prévia em outra aba ↗</button></div>}<iframe ref={preview} onLoad={enviarPrevia} title="Prévia do rascunho do site" src="/preview/?preview=admin" className={mobilePreview?'is-mobile':''}/><p>Links externos e envios desativados. <button type="button" onClick={abrirPrevia}>Abrir prévia em outra aba ↗</button></p></aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-borda bg-superficie/95 backdrop-blur">
        <div className="container-vert flex max-w-3xl items-center justify-between gap-4 py-3">
          <p role="status" className="text-sm text-conteudo-suave">
            {estado !== 'erro' && estado !== 'salvando' && mensagem}
            {estado === 'salvando' && 'Salvando…'}
            {estado === 'erro' && <span className="text-red-700">{erro}</span>}
          </p>
          <button
            onClick={()=>void salvar(false)}
            disabled={estado === 'salvando'||uploading}
            className="inline-flex min-h-[44px] items-center rounded-full bg-marca-forte px-6 text-sm font-semibold text-conteudo-inverso transition duration-padrao active:scale-[0.98] disabled:opacity-50"
          >
            Salvar rascunho
          </button>
          <button onClick={()=>void salvar(true)} disabled={estado==='salvando'||uploading} className="vert-publish">Publicar no site</button>
        </div>
      </div>
    </div>
  )
}

