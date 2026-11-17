import { useEffect, useRef, type ReactNode } from 'react'
import { BotaoMudo } from '../etapas/comum'
import { Palco, Sprite } from '../palco/Palco'

/** As telas de menu ficam na frente da clínica, à noite. */
export function NaFachada({ titulo, children }: { titulo: string; children: ReactNode }) {
  const rotulo = useRef<HTMLParagraphElement>(null)
  // ao trocar de tela, o foco vai para o título, como nas etapas do atendimento
  useEffect(() => {
    rotulo.current?.focus()
  }, [titulo])

  return (
    <Palco cena={<Sprite src="arte/fachada.png" alt="Fachada da clínica à noite" x={0} y={0} largura={320} altura={180} />}>
      <header className="cabecalho">
        <p className="etapa-atual" ref={rotulo} tabIndex={-1}>
          {titulo}
        </p>
        <div className="acoes">
          <BotaoMudo />
        </div>
      </header>
      <div className="conteudo">{children}</div>
    </Palco>
  )
}

interface PropsFachada {
  /** o nome do crachá; vazio até ela preencher nas configurações */
  nome: string
  plantao: () => void
  estudo: () => void
  biblioteca: () => void
  bulario: () => void
  progresso: () => void
  configuracoes: () => void
}

export function Fachada({ nome, plantao, estudo, biblioteca, bulario, progresso, configuracoes }: PropsFachada) {
  return (
    <NaFachada titulo="Plantão Vet">
      <section className="caixa">
        <h1 className="titulo">Plantão Vet</h1>
        <p>
          {nome && `Boa noite, ${nome}! `}A clínica-escola está de plantão. Quem chega hoje?
        </p>
      </section>
      <button type="button" className="principal" onClick={plantao}>
        Começar o plantão
      </button>
      <div className="opcoes">
        <button type="button" onClick={estudo}>
          <span>
            <strong>Estudo</strong> <span className="detalhe">casos parecidos de uma matéria</span>
          </span>
        </button>
        <button type="button" onClick={biblioteca}>
          <span>
            <strong>Biblioteca</strong> <span className="detalhe">o caso que você escolher</span>
          </span>
        </button>
        <button type="button" onClick={bulario}>
          <span>
            <strong>Bulário</strong> <span className="detalhe">o que cada remédio faz</span>
          </span>
        </button>
        <button type="button" onClick={progresso}>
          <span>
            <strong>Progresso</strong> <span className="detalhe">acertos, revisão e backup</span>
          </span>
        </button>
        <button type="button" onClick={configuracoes}>
          <span>
            <strong>Configurações</strong> <span className="detalhe">nome no crachá e som</span>
          </span>
        </button>
      </div>
    </NaFachada>
  )
}
