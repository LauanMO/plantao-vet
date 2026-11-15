import { describe, expect, it } from 'vitest'
import pipocaJson from '../../conteudo/casos/clinica-geral/clin-parvovirose-01.json'
import { casoSchema, type Caso } from '../modelo/caso.ts'
import { casosDoPlantao, chaveDoTema, progressoVazio, proximoDoEstudo, proximoDoPlantao, registrar, type Progresso } from './repeticao.ts'

const base = casoSchema.parse(pipocaJson)
const VOMITO = 'Vômito e diarreia em cães'
const PELE = 'Afecções de pele'
const URINA = 'Afecções urinárias'
const TEMAS = [VOMITO, 'Afecções respiratórias', PELE, URINA]

/** um caso de mentira: só o id e o tema importam para a repetição */
const caso = (id: string, tema = VOMITO): Caso => ({ ...base, id, tema })

const ERROU = { nota: 0.4, acertou: false }
const ACERTOU = { nota: 1, acertou: true }

/** joga os casos na ordem, com o mesmo resultado */
const jogar = (p: Progresso, casos: Caso[], resultado = ACERTOU) => casos.reduce((q, c) => registrar(q, c, resultado), p)

describe('repetição dos casos errados', () => {
  it('regra 1: cada tema tem uma caixa e um ponto de volta medido em casos jogados', () => {
    const p = registrar(progressoVazio(), caso('a'), ACERTOU)
    expect(chaveDoTema(caso('a'))).toBe('clinica-geral/vomito-e-diarreia-em-caes')
    expect(p.jogados).toBe(1)
    expect(p.temas['clinica-geral/vomito-e-diarreia-em-caes']).toMatchObject({ caixa: 1, volta: 1 + 5, acertos: 1 })
    expect(p.casos.a).toEqual({ vezes: 1, acertos: 1, ultimo: 1, ultimaNota: 1 })
  })

  it('regra 2: errou, o tema vai para a caixa 0, entra em revisão e volta depois de 3 casos', () => {
    const p = registrar(jogar(progressoVazio(), [caso('a'), caso('b')]), caso('c'), ERROU)
    expect(p.temas[chaveDoTema(caso('c'))]).toMatchObject({ caixa: 0, volta: 3 + 3, emRevisao: true, erros: 1, ultimoErrado: 'c' })
  })

  it('regra 3: cada acerto sobe uma caixa e alonga a volta; dois acertos depois de um erro tiram o tema da revisão', () => {
    const chave = chaveDoTema(caso('a'))
    let p = registrar(progressoVazio(), caso('a'), ERROU)
    const voltas: number[] = []
    for (let i = 0; i < 5; i++) {
      p = registrar(p, caso('a'), ACERTOU)
      voltas.push(p.temas[chave].volta - p.jogados)
      if (i === 0) expect(p.temas[chave].emRevisao).toBe(true)
      if (i === 1) expect(p.temas[chave].emRevisao).toBe(false)
    }
    expect(voltas).toEqual([5, 10, 20, 40, 40]) // caixas 1, 2, 3, 4 e 4 de novo
  })

  it('regra 4: na revisão vem outro caso do mesmo tema; o caso errado só volta se o tema não tiver outro', () => {
    const banco = [caso('a'), caso('b'), caso('p1', PELE), caso('p2', PELE), caso('p3', PELE), caso('p4', PELE)]
    // errou "a" e jogou mais 3 casos de pele: o tema do vômito chegou ao ponto de volta
    const p = jogar(registrar(progressoVazio(), caso('a'), ERROU), [caso('p1', PELE), caso('p2', PELE), caso('p3', PELE)])
    expect(proximoDoPlantao(p, banco, [], () => 0)).toEqual({ caso: caso('b'), revisao: true })
    const semOutro = banco.filter((c) => c.id !== 'b')
    expect(proximoDoPlantao(p, semOutro, [], () => 0)).toEqual({ caso: caso('a'), revisao: true })
  })

  it('regra 5: o mesmo caso não volta dentro dos últimos 8 jogados, ou de metade dos disponíveis', () => {
    const banco = Array.from({ length: 20 }, (_, i) => caso(`c${i}`, i % 2 ? PELE : URINA))
    const p = jogar(progressoVazio(), banco.slice(0, 10)) // c0 a c9; os temas ainda não voltaram
    const sorteados = new Set(Array.from({ length: 50 }, (_, i) => proximoDoPlantao(p, banco, [true], () => i / 50).caso.id))
    for (const id of ['c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9']) expect(sorteados).not.toContain(id)
    expect(sorteados).toContain('c1')
    // com 4 casos disponíveis, a janela é de 2: só os 2 últimos ficam de fora
    const quatro = Array.from({ length: 4 }, (_, i) => caso(`q${i}`))
    const q = jogar(progressoVazio(), quatro)
    expect(proximoDoEstudo(q, quatro, TEMAS).id).toBe('q0')
    expect(proximoDoEstudo(registrar(q, caso('q0'), ACERTOU), quatro, TEMAS).id).toBe('q1')
  })

  it('regra 6: no plantão, no máximo 1 revisão a cada 4 pacientes; no sorteio, peso 3 para nunca jogado', () => {
    const banco = [caso('a'), caso('b'), caso('p1', PELE), caso('p2', PELE), caso('p3', PELE), caso('nova', URINA)]
    const p = jogar(registrar(progressoVazio(), caso('a'), ERROU), [caso('p1', PELE), caso('p2', PELE), caso('p3', PELE)])
    // o vômito está vencido, mas houve revisão entre os 3 últimos pacientes do turno
    expect(proximoDoPlantao(p, banco, [true, false, false]).revisao).toBe(false)
    expect(proximoDoPlantao(p, banco, [true, false, false, false]).revisao).toBe(true)
    // sem revisão: "a" (já jogado, peso 1) e "nova" (nunca jogada, peso 3) dividem 4 partes
    const dois = [caso('a'), caso('nova', URINA)]
    const q = { ...registrar(progressoVazio(), caso('a'), ACERTOU), jogados: 10 } // "a" já saiu da janela
    expect(proximoDoPlantao(q, dois, [true], () => 0.2).caso.id).toBe('a')
    expect(proximoDoPlantao(q, dois, [true], () => 0.3).caso.id).toBe('nova')
    expect(proximoDoPlantao(q, dois, [true], () => 0.99).caso.id).toBe('nova')
  })

  it('regra 7: no estudo, os temas em revisão vêm primeiro e, dentro do tema, os casos nunca jogados', () => {
    const banco = [caso('v1'), caso('v2'), caso('p1', PELE), caso('p2', PELE), caso('u1', URINA), caso('u2', URINA)]
    // sem nada jogado: o primeiro tema da matéria, e o caso nunca jogado
    expect(proximoDoEstudo(progressoVazio(), banco, TEMAS).id).toBe('v1')
    // errou um de pele: pele passa na frente, e vem o caso de pele que ela ainda não viu
    const p = jogar(registrar(progressoVazio(), caso('p1', PELE), ERROU), [caso('v1')])
    expect(proximoDoEstudo(p, banco, TEMAS).id).toBe('p2')
  })

  it('regra 8: num banco pequeno a regra 5 encolhe, e o último caso só se repete quando é o único', () => {
    // 2 casos, os 2 já jogados: a janela é 1, e volta o penúltimo, nunca o último
    const dois = [caso('a'), caso('b')]
    const p = jogar(progressoVazio(), dois)
    expect(proximoDoEstudo(p, dois, TEMAS).id).toBe('a')
    expect(proximoDoPlantao(p, dois, [true], () => 0.99).caso.id).toBe('a')
    // com um caso só, ele volta
    expect(proximoDoEstudo(registrar(progressoVazio(), caso('a'), ACERTOU), [caso('a')], TEMAS).id).toBe('a')
  })

  it('o plantão sorteia só das matérias marcadas, e de todas se nenhuma marcada tiver casos', () => {
    const banco = [caso('c1'), { ...caso('f1'), materia: 'farmacologia' }, { ...caso('f2'), materia: 'farmacologia' }]
    expect(casosDoPlantao(banco).map((c) => c.id)).toEqual(['c1', 'f1', 'f2'])
    expect(casosDoPlantao(banco, ['farmacologia']).map((c) => c.id)).toEqual(['f1', 'f2'])
    expect(casosDoPlantao(banco, ['anatomia']).map((c) => c.id)).toEqual(['c1', 'f1', 'f2'])
  })
})
