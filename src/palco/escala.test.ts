import { describe, expect, it } from 'vitest'
import { ALTURA, FAIXA, LARGURA, calcularPalco, type Disposicao } from './escala'

// [nome, largura CSS, altura CSS, dpr, disposição esperada, escala esperada em px CSS]
const telas: [string, number, number, number, Disposicao, number][] = [
  ['Android 360 em pé', 360, 800, 3, 'embaixo', 2],
  ['iPhone em pé', 390, 844, 3, 'embaixo', 2],
  ['Android 412 em pé (dpr 2,625)', 412, 915, 2.625, 'embaixo', 6 / 2.625],
  ['iPhone deitado', 844, 390, 3, 'ao-lado', 2],
  ['Android 360 deitado', 800, 360, 3, 'ao-lado', 2],
  ['tablet em pé', 768, 1024, 2, 'embaixo', 3],
  ['tablet deitado', 1024, 768, 2, 'sobre', 3],
  ['notebook', 1366, 768, 1, 'sobre', 4],
  ['notebook com zoom de 125%', 1536, 864, 1.25, 'sobre', 4.8],
  ['PC Full HD', 1920, 1080, 1, 'sobre', 6],
]

const margem = 1e-9

describe('calcularPalco', () => {
  it.each(telas)('%s', (_nome, largura, altura, dpr, disposicao, esperada) => {
    const l = calcularPalco(largura, altura, dpr)
    expect(l.disposicao).toBe(disposicao)
    expect(l.escala).toBeCloseTo(esperada, 9)

    // cada pixel de arte ocupa um número inteiro de pixels do aparelho, e a origem cai num pixel inteiro
    const k = l.escala * dpr
    expect(k).toBeCloseTo(Math.round(k), 9)
    expect(l.x * dpr).toBeCloseTo(Math.round(l.x * dpr), 9)
    expect(l.y * dpr).toBeCloseTo(Math.round(l.y * dpr), 9)

    if (l.disposicao === 'sobre') {
      // o palco inteiro aparece
      expect(l.x).toBeGreaterThanOrEqual(0)
      expect(l.y).toBeGreaterThanOrEqual(0)
      expect(l.x + LARGURA * l.escala).toBeLessThanOrEqual(largura + margem)
      expect(l.y + ALTURA * l.escala).toBeLessThanOrEqual(altura + margem)
    } else if (l.disposicao === 'embaixo') {
      // a faixa central aparece inteira, e sobram pelo menos 40% da altura para a interface
      expect(-l.x / l.escala).toBeLessThanOrEqual(FAIXA.inicio + margem)
      expect((largura - l.x) / l.escala).toBeGreaterThanOrEqual(FAIXA.fim - margem)
      expect(ALTURA * l.escala).toBeLessThanOrEqual(altura * 0.6 + margem)
    } else {
      // a janela começa no início da faixa, a altura toda aparece, e sobra pelo menos metade da largura
      expect(-l.x / l.escala).toBeCloseTo(FAIXA.inicio, 9)
      expect(l.y).toBeGreaterThanOrEqual(0)
      expect(l.y + ALTURA * l.escala).toBeLessThanOrEqual(altura + margem)
      expect((FAIXA.fim - FAIXA.inicio) * l.escala).toBeLessThanOrEqual(largura * 0.5 + margem)
    }
  })

  it('nunca usa escala menor que 1 pixel do aparelho', () => {
    expect(calcularPalco(200, 100, 1).escala).toBe(1)
  })
})
