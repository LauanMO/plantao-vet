import type { Caso } from '../modelo/caso.ts'

export type Etapa = Caso['etapas'][number]
export type EtapaDo<T extends Etapa['tipo']> = Extract<Etapa, { tipo: T }>

/** O que ela respondeu em cada etapa; o retorno não tem resposta. */
export type Resposta =
  | { tipo: 'coleta'; escolhidos: string[] }
  | { tipo: 'escolha'; opcao: number }
  | { tipo: 'calculo'; valor: number }
  | { tipo: 'receita'; farmaco: string; quantidade: number; via: string; frequencia: string }
export type RespostaDo<T extends Resposta['tipo']> = Extract<Resposta, { tipo: T }>

/** A tolerância é uma fração da resposta certa: 0,1 aceita 10% para mais ou para menos. */
export const dentro = (valor: number, certo: number, tolerancia: number) =>
  // a folga de 1e-9 é do ponto flutuante: sem ela, 0,45 contra 0,5 com 10% pode cair fora
  Math.abs(valor - certo) <= tolerancia * Math.abs(certo) + 1e-9

/** Quantidade por aplicação, na unidade do fármaco certo: mg/kg × peso ÷ concentração. */
export const quantidadeCerta = (etapa: EtapaDo<'receita'>, pesoKg: number) =>
  (etapa.correto.doseMgKg * pesoKg) / etapa.correto.concentracao

export const importantes = (etapa: EtapaDo<'coleta'>) => etapa.itens.filter((it) => it.importante)

/** Os itens importantes que ela não pediu: o jogo mostra ao concluir a coleta e no resultado. */
export const faltaram = (etapa: EtapaDo<'coleta'>, escolhidos: string[]) =>
  importantes(etapa).filter((it) => !escolhidos.includes(it.id))

/** Cada parte da receita: a dose só conta com o fármaco certo. */
export function partesDaReceita(etapa: EtapaDo<'receita'>, pesoKg: number, r: RespostaDo<'receita'>) {
  const farmaco = r.farmaco === etapa.correto.farmaco
  return {
    farmaco,
    dose: farmaco && dentro(r.quantidade, quantidadeCerta(etapa, pesoKg), etapa.correto.tolerancia),
    via: r.via === etapa.correto.via,
    frequencia: r.frequencia === etapa.correto.frequencia,
  }
}

// em pontos inteiros, para 40 + 30 + 15 + 15 dar exatamente 1
const PESOS_DA_RECEITA = { farmaco: 40, dose: 30, via: 15, frequencia: 15 }

/** Nota de 0 a 1 de uma etapa; null no retorno, que não pontua. Sem resposta, vale 0. */
export function notaDaEtapa(etapa: Etapa, pesoKg: number, r: Resposta | undefined): number | null {
  switch (etapa.tipo) {
    case 'retorno':
      return null
    case 'coleta':
      return r?.tipo === 'coleta' ? 1 - faltaram(etapa, r.escolhidos).length / importantes(etapa).length : 0
    case 'escolha':
      return r?.tipo === 'escolha' && etapa.opcoes[r.opcao]?.correta ? 1 : 0
    case 'calculo':
      return r?.tipo === 'calculo' && dentro(r.valor, etapa.resposta, etapa.tolerancia) ? 1 : 0
    case 'receita': {
      if (r?.tipo !== 'receita') return 0
      const partes = partesDaReceita(etapa, pesoKg, r)
      const pontos = Object.entries(PESOS_DA_RECEITA).filter(([parte]) => partes[parte as keyof typeof partes])
      return pontos.reduce((soma, [, peso]) => soma + peso, 0) / 100
    }
  }
}

export interface ResultadoCaso {
  /** nota de cada etapa, na ordem do caso; null no retorno */
  notas: (number | null)[]
  /** média das etapas pontuadas, de 0 a 1, em pontos percentuais inteiros */
  nota: number
  estrelas: 1 | 2 | 3
  /** todas as etapas críticas com nota 1: decide o retorno bom ou ruim */
  criticasCertas: boolean
  /** nota de 70% ou mais e todas as críticas certas */
  acertou: boolean
}

export function resultadoDoCaso(caso: Caso, respostas: (Resposta | undefined)[]): ResultadoCaso {
  const notas = caso.etapas.map((etapa, i) => notaDaEtapa(etapa, caso.paciente.pesoKg, respostas[i]))
  const pontuadas = notas.filter((n) => n !== null)
  // arredondada ao ponto percentual que a tela mostra, para as estrelas baterem com o número
  const nota = Math.round((pontuadas.reduce((soma, n) => soma + n, 0) / pontuadas.length) * 100) / 100
  const criticasCertas = caso.etapas.every((etapa, i) => !('critica' in etapa && etapa.critica) || notas[i] === 1)
  return {
    notas,
    nota,
    estrelas: nota >= 0.9 ? 3 : nota >= 0.7 ? 2 : 1,
    criticasCertas,
    acertou: nota >= 0.7 && criticasCertas,
  }
}
