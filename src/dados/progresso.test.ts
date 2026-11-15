import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Progresso } from '../modelo/progresso.ts'
import { carregarProgresso, lerProgresso, salvarProgresso } from './progresso.ts'

const progresso: Progresso = {
  versao: 1,
  nome: 'Dra. Teste',
  jogados: 3,
  casos: { 'clin-a-01': { vezes: 2, acertos: 1, ultimo: 3, ultimaNota: 0.83 } },
  temas: { 'clinica-geral/a': { caixa: 0, volta: 6, emRevisao: true, erros: 1, acertos: 1, ultimoErrado: 'clin-a-01' } },
}

/** Um localStorage de mentira, porque o Vitest roda no Node. */
function memoria(inicial: Record<string, string> = {}) {
  const dados = new Map(Object.entries(inicial))
  vi.stubGlobal('localStorage', { getItem: (k: string) => dados.get(k) ?? null, setItem: (k: string, v: string) => dados.set(k, v) })
  return dados
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('progresso salvo', () => {
  it('volta igual depois de salvo e carregado', () => {
    memoria()
    salvarProgresso(progresso)
    expect(carregarProgresso()).toEqual(progresso)
  })

  it('o backup volta igual depois de lido', () => {
    expect(lerProgresso(JSON.stringify(progresso))).toEqual(progresso)
  })

  it.each([
    ['não é JSON', 'oi'],
    ['objeto vazio', '{}'],
    ['outra versão', JSON.stringify({ ...progresso, versao: 2 })],
    ['caixa sem intervalo', JSON.stringify({ ...progresso, temas: { t: { ...progresso.temas['clinica-geral/a'], caixa: 7 } } })],
    ['nota acima de 100%', JSON.stringify({ ...progresso, casos: { c: { vezes: 1, acertos: 1, ultimo: 1, ultimaNota: 5 } } })],
  ])('recusa arquivo que não é progresso: %s', (_nome, texto) => {
    expect(lerProgresso(texto)).toBeUndefined()
  })

  it('começa do zero sem apagar um progresso estragado', () => {
    const dados = memoria({ 'plantao-vet:progresso:v1': '{"versao":1,"jog' })
    expect(carregarProgresso().jogados).toBe(0)
    expect(dados.get('plantao-vet:progresso:v1:estragado')).toBe('{"versao":1,"jog')
  })

  it('segue na memória quando o navegador bloqueia o localStorage', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('bloqueado')
      },
      setItem: () => {
        throw new Error('bloqueado')
      },
    })
    expect(carregarProgresso().jogados).toBe(0)
    expect(() => salvarProgresso(progresso)).not.toThrow()
  })
})
