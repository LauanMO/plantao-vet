import { describe, expect, it } from 'vitest'
import mimosaJson from '../../conteudo/casos/clinica-geral/clin-hipocalcemia-01.json'
import pipocaJson from '../../conteudo/casos/clinica-geral/clin-parvovirose-01.json'
import { casoSchema, type Caso } from '../modelo/caso.ts'
import {
  notaDaEtapa,
  quantidadeCerta,
  resultadoDoCaso,
  type Etapa,
  type EtapaDo,
  type Resposta,
  type RespostaDo,
} from './pontuacao.ts'

const pipoca = casoSchema.parse(pipocaJson)
const mimosa = casoSchema.parse(mimosaJson)

/** As respostas certas de cada etapa, tiradas do próprio caso. */
function gabarito(caso: Caso): (Resposta | undefined)[] {
  return caso.etapas.map((e): Resposta | undefined => {
    switch (e.tipo) {
      case 'coleta':
        return { tipo: 'coleta', escolhidos: e.itens.filter((it) => it.importante).map((it) => it.id) }
      case 'escolha':
        return { tipo: 'escolha', opcao: e.opcoes.findIndex((o) => o.correta) }
      case 'calculo':
        return { tipo: 'calculo', valor: e.resposta }
      case 'receita':
        return { tipo: 'receita', ...e.correto, quantidade: quantidadeCerta(e, caso.paciente.pesoKg) }
      case 'retorno':
        return undefined
    }
  })
}

const etapa = <T extends Etapa['tipo']>(c: Caso, tipo: T) => c.etapas.find((e) => e.tipo === tipo) as EtapaDo<T>

/** gabarito com a receita trocada em alguma parte */
function comReceita(c: Caso, mudar: Partial<RespostaDo<'receita'>>) {
  const respostas = gabarito(c)
  const i = c.etapas.indexOf(etapa(c, 'receita'))
  respostas[i] = { ...(respostas[i] as RespostaDo<'receita'>), ...mudar }
  return { respostas, i }
}
const receita = (c: Caso, mudar: Partial<RespostaDo<'receita'>>) => {
  const { respostas, i } = comReceita(c, mudar)
  return notaDaEtapa(c.etapas[i], c.paciente.pesoKg, respostas[i])
}

describe('pontuação', () => {
  it.each([pipoca, mimosa])('o gabarito de $paciente.nome dá 100%, 3 estrelas e caso acertado', (caso) => {
    expect(resultadoDoCaso(caso, gabarito(caso))).toEqual({
      notas: caso.etapas.map((e) => (e.tipo === 'retorno' ? null : 1)),
      nota: 1,
      estrelas: 3,
      criticasCertas: true,
      acertou: true,
    })
  })

  it('sem resposta, cada etapa vale 0 e o caso dá 1 estrela', () => {
    expect(resultadoDoCaso(pipoca, [])).toMatchObject({ nota: 0, estrelas: 1, criticasCertas: false, acertou: false })
  })

  it('coleta: importantes encontrados ÷ total, sem contar os outros itens', () => {
    const anamnese = etapa(pipoca, 'coleta')
    expect(notaDaEtapa(anamnese, 5, { tipo: 'coleta', escolhidos: ['vacina', 'inicio', 'objeto', 'passeio'] })).toBeCloseTo(2 / 3)
  })

  it('cálculo: certo dentro da tolerância, que é uma fração da resposta', () => {
    const calculo = etapa(mimosa, 'calculo') // 11,1 g com 5%
    expect(notaDaEtapa(calculo, 500, { tipo: 'calculo', valor: 11.6 })).toBe(1)
    expect(notaDaEtapa(calculo, 500, { tipo: 'calculo', valor: 11.7 })).toBe(0)
  })

  it('receita: dose dentro da tolerância, e só com o fármaco certo', () => {
    // Pipoca: 0,5 mL com 10% de tolerância
    expect(receita(pipoca, { quantidade: 0.45 })).toBe(1)
    expect(receita(pipoca, { quantidade: 0.44 })).toBe(0.7)
    expect(receita(pipoca, { farmaco: 'meloxicam' })).toBe(0.3)
    expect(receita(pipoca, { via: 'Oral', frequencia: 'Dose única' })).toBe(0.7)
  })

  it('crítica errada: o caso não conta como acertado mesmo com nota alta', () => {
    const respostas = gabarito(pipoca)
    respostas[pipoca.etapas.indexOf(etapa(pipoca, 'escolha'))] = { tipo: 'escolha', opcao: 1 } // diagnóstico errado
    expect(resultadoDoCaso(pipoca, respostas)).toMatchObject({ nota: 0.83, estrelas: 2, criticasCertas: false, acertou: false })
  })

  it('receita crítica só conta como certa com 100%', () => {
    const { respostas } = comReceita(mimosa, { frequencia: 'A cada 8 horas' })
    expect(resultadoDoCaso(mimosa, respostas)).toMatchObject({ estrelas: 3, criticasCertas: false, acertou: false })
  })
})
