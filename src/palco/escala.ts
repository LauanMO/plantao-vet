// Palco de 320×180 pixels de arte, ampliado por um fator inteiro.
export const LARGURA = 320
export const ALTURA = 180

// Faixa da cena que sempre aparece quando o palco é cortado: cabe em 2× num celular de 360 px.
export const FAIXA = { inicio: 70, fim: 250 }
const LARGURA_FAIXA = FAIXA.fim - FAIXA.inicio

// Em retrato, o palco usa no máximo 60% da altura; o resto fica para a interface.
const ALTURA_MAX_RETRATO = 0.6
// Deitada e mais baixa que isso (celular), a interface por cima cobriria a cena inteira: ela vai para o lado.
const ALTURA_MIN_SOBRE = 500
// Com a interface ao lado, o palco usa no máximo metade da largura.
const LARGURA_MAX_AO_LADO = 0.5

/** onde a interface fica em relação ao palco */
export type Disposicao = 'sobre' | 'embaixo' | 'ao-lado'

export interface LayoutPalco {
  disposicao: Disposicao
  /** px CSS por pixel de arte */
  escala: number
  /** origem do palco dentro da janela dele, em px CSS; x fica negativo quando as laterais são cortadas */
  x: number
  y: number
}

export function calcularPalco(largura: number, altura: number, dpr = 1): LayoutPalco {
  // A conta é em pixels do aparelho: cada pixel de arte vira um bloco inteiro mesmo com dpr 2,625 ou zoom de 125%.
  const w = Math.floor(largura * dpr)
  const h = Math.floor(altura * dpr)
  const escala = (k: number) => k / dpr
  const px = (pixelsDoAparelho: number) => Math.floor(pixelsDoAparelho) / dpr

  if (largura < altura) {
    // retrato: palco em cima, centrado na faixa, interface embaixo
    const k = Math.max(1, Math.min(Math.floor(w / LARGURA_FAIXA), Math.floor((h * ALTURA_MAX_RETRATO) / ALTURA)))
    return { disposicao: 'embaixo', escala: escala(k), x: px((w - LARGURA * k) / 2), y: 0 }
  }

  if (altura < ALTURA_MIN_SOBRE) {
    // deitada e baixa: a janela do palco mostra só a faixa, à esquerda, e a interface fica à direita
    const k = Math.max(1, Math.min(Math.floor(h / ALTURA), Math.floor((w * LARGURA_MAX_AO_LADO) / LARGURA_FAIXA)))
    return { disposicao: 'ao-lado', escala: escala(k), x: -px(FAIXA.inicio * k), y: px((h - ALTURA * k) / 2) }
  }

  // deitada: palco inteiro centrado, interface por cima
  const k = Math.max(1, Math.min(Math.floor(w / LARGURA), Math.floor(h / ALTURA)))
  return { disposicao: 'sobre', escala: escala(k), x: px((w - LARGURA * k) / 2), y: px((h - ALTURA * k) / 2) }
}
