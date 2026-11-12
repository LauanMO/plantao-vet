import { createContext, useContext, useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { ALTURA, FAIXA, LARGURA, calcularPalco } from './escala'

const EscalaContexto = createContext(1)

function medirTela() {
  return { largura: window.innerWidth, altura: window.innerHeight, dpr: window.devicePixelRatio || 1 }
}

interface PropsPalco {
  /** sprites da cena, posicionados em pixels de arte */
  cena: ReactNode
  /** interface em HTML: por cima do palco, embaixo dele (retrato) ou ao lado (celular deitado) */
  children: ReactNode
}

export function Palco({ cena, children }: PropsPalco) {
  const [tela, setTela] = useState(medirTela)
  useEffect(() => {
    // shortcut: só o resize; mudar de monitor com outro dpr sem mudar o tamanho não recalcula. Usar matchMedia se incomodar.
    const atualizar = () => setTela(medirTela())
    window.addEventListener('resize', atualizar)
    return () => window.removeEventListener('resize', atualizar)
  }, [])

  const l = calcularPalco(tela.largura, tela.altura, tela.dpr)
  const largura = LARGURA * l.escala
  const altura = ALTURA * l.escala
  const larguraFaixa = (FAIXA.fim - FAIXA.inicio) * l.escala

  const janela: Record<typeof l.disposicao, CSSProperties> = {
    sobre: {},
    embaixo: { height: altura },
    'ao-lado': { width: larguraFaixa },
  }
  const ui: Record<typeof l.disposicao, CSSProperties> = {
    sobre: { left: l.x, top: l.y, width: largura, height: altura },
    embaixo: { top: altura },
    'ao-lado': { left: larguraFaixa },
  }

  return (
    <div className={`tela ${l.disposicao}`}>
      <div className="palco-janela" style={janela[l.disposicao]}>
        <div className="palco" style={{ left: l.x, top: l.y, width: largura, height: altura }}>
          <EscalaContexto.Provider value={l.escala}>{cena}</EscalaContexto.Provider>
        </div>
      </div>
      {/* a interface fica sempre no mesmo lugar da árvore para não perder o estado ao girar a tela */}
      <div className="interface" style={ui[l.disposicao]}>
        {children}
      </div>
    </div>
  )
}

interface PropsSprite {
  src: string
  alt: string
  /** posição e tamanho em pixels de arte */
  x: number
  y: number
  largura: number
  altura: number
}

export function Sprite({ src, alt, x, y, largura, altura }: PropsSprite) {
  const e = useContext(EscalaContexto)
  return <img src={src} alt={alt} style={{ left: x * e, top: y * e, width: largura * e, height: altura * e }} />
}
