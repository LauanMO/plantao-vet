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
}

export function Personagem({ id, estado, alt, x, y }: PropsPersonagem) {
  const s = sprites[id]
  return (
    // a key troca a <img> junto com o personagem; sem ela, a imagem antiga aparece esticada enquanto a nova carrega
    <Sprite
      key={id}
      src={`arte/${id}-${estado}.png`}
      alt={alt}
      x={x - s.pe.x}
      y={y - s.pe.y}
      largura={s.largura}
      altura={s.altura}
    />
  )
}
