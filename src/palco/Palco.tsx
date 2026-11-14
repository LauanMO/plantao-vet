import { createContext, useContext, useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import manifesto from '../../conteudo/arte/sprites.json'
import type { Sprites } from '../modelo/caso'
import { ALTURA, FAIXA, LARGURA, calcularPalco } from './escala'

// o npm run validar confere o manifesto contra o schema no CI; aqui só se aproveita o tipo
const sprites: Sprites = manifesto

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

interface PropsPersonagem {
  /** id do manifesto conteudo/arte/sprites.json */
  id: string
  estado: string
  alt: string
  /** onde fica o pé, em pixels de arte */
  x: number
  y: number
  /** entra em cena deslizando desde essa distância, em pixels de arte (negativa vem da esquerda) */
  entraDe?: number
}

export function Personagem({ id, estado, alt, x, y, entraDe }: PropsPersonagem) {
  const e = useContext(EscalaContexto)
  const s = sprites[id]
  // um passo por pixel de arte, para a arte não borrar no meio do caminho
  const entrada = entraDe ? ({ '--de': `${entraDe * e}px`, '--passos': Math.abs(entraDe) } as CSSProperties) : {}
  return (
    <div
      className={entraDe ? 'personagem entra' : 'personagem'}
      role="img"
      aria-label={alt}
      style={{ left: (x - s.pe.x) * e, top: (y - s.pe.y) * e, width: s.largura * e, height: s.altura * e, ...entrada }}
    >
      {/* os quadros da respiração ficam lado a lado no PNG, e o CSS desliza a folha */}
      {/* a key troca a <img> junto com o personagem; sem ela, a imagem antiga aparece esticada enquanto a nova carrega */}
      <img key={id} src={`arte/${id}-${estado}.png`} alt="" style={{ width: s.largura * s.quadros * e, height: s.altura * e }} />
    </div>
  )
}
