import type { Caso } from '../modelo/caso.ts'
import type { Progresso } from '../modelo/progresso.ts'

// As regras estão em docs/PLANO.md, na seção Repetição dos casos errados.
// O relógio é o número de casos jogados, não dias, para funcionar mesmo se ela jogar pouco.

/** Pacientes por turno do Plantão. Ajustar depois dos primeiros testes. */
export const TURNO = 5
/** No Plantão, no máximo 1 paciente a cada tantos é revisão. */
export const REVISAO_A_CADA = 4
/** Casos jogados até o tema voltar, por caixa (0 a 4). */
export const INTERVALOS = [3, 5, 10, 20, 40]
/** O mesmo caso não volta dentro dos últimos tantos casos jogados (ou metade dos disponíveis). */
const JANELA = 8

export type { Progresso }

export const progressoVazio = (): Progresso => ({ versao: 1, jogados: 0, casos: {}, temas: {} })

const slug = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export const chaveDoTema = (caso: Caso) => `${caso.materia}/${slug(caso.tema)}`

/** Regras 1 a 3: o caso terminado move a caixa do tema e marca quando ele volta. */
export function registrar(p: Progresso, caso: Caso, { nota, acertou }: { nota: number; acertou: boolean }): Progresso {
  const jogados = p.jogados + 1
  const c = p.casos[caso.id] ?? { vezes: 0, acertos: 0, ultimo: 0, ultimaNota: 0 }
  const chave = chaveDoTema(caso)
  const t = p.temas[chave] ?? { caixa: 0, volta: 0, emRevisao: false, erros: 0, acertos: 0 }

  const caixa = acertou ? Math.min(t.caixa + 1, INTERVALOS.length - 1) : 0
  const tema = acertou
    ? // depois de um erro, o tema fica na caixa 0; dois acertos seguidos o levam à caixa 2 e o tiram da revisão
      { ...t, caixa, acertos: t.acertos + 1, emRevisao: t.emRevisao && caixa < 2 }
    : { ...t, caixa, erros: t.erros + 1, emRevisao: true, ultimoErrado: caso.id }

  return {
    ...p,
    jogados,
    casos: { ...p.casos, [caso.id]: { vezes: c.vezes + 1, acertos: c.acertos + Number(acertou), ultimo: jogados, ultimaNota: nota } },
    temas: { ...p.temas, [chave]: { ...tema, volta: jogados + INTERVALOS[caixa] } },
  }
}

/**
 * Regras 5 e 8: tira os casos jogados há pouco. A janela é no máximo metade dos casos, então a lista nunca esvazia,
 * e o último caso jogado só se repete quando é o único: é assim que a regra 8 se cumpre num banco pequeno.
 */
function semOsRecentes(p: Progresso, casos: Caso[]): Caso[] {
  const janela = Math.min(JANELA, Math.floor(casos.length / 2))
  return casos.filter((c) => !(c.id in p.casos) || p.jogados - p.casos[c.id].ultimo >= janela)
}

/** o que ela não vê há mais tempo, com os nunca jogados na frente */
const maisEsquecido = (p: Progresso, casos: Caso[]) =>
  casos.toSorted((a, b) => (p.casos[a.id]?.ultimo ?? -1) - (p.casos[b.id]?.ultimo ?? -1))[0]

/** Regra 4: um caso de revisão de algum tema que já chegou ao ponto de volta, com os temas em revisão na frente. */
function revisao(p: Progresso, candidatos: Caso[]): Caso | undefined {
  const vencidos = Object.entries(p.temas)
    .filter(([, t]) => t.volta <= p.jogados)
    .toSorted(([, a], [, b]) => Number(b.emRevisao) - Number(a.emRevisao) || a.volta - b.volta)
  for (const [chave, t] of vencidos) {
    const doTema = candidatos.filter((c) => chaveDoTema(c) === chave)
    if (doTema.length === 0) continue
    // de preferência outro caso do mesmo tema; o que ela errou só volta se o tema não tiver outro
    const outros = doTema.filter((c) => c.id !== t.ultimoErrado)
    return maisEsquecido(p, outros.length > 0 ? outros : doTema)
  }
}

/**
 * Regra 6: o próximo paciente do plantão. `revisoes` diz, de cada paciente já atendido no turno, se ele foi revisão.
 * `sorteio` devolve um número de 0 a 1, como o Math.random; os testes passam um fixo.
 */
export function proximoDoPlantao(p: Progresso, casos: Caso[], revisoes: boolean[], sorteio = Math.random) {
  const candidatos = semOsRecentes(p, casos)
  const podeRevisar = !revisoes.slice(-(REVISAO_A_CADA - 1)).some(Boolean)
  const deRevisao = podeRevisar ? revisao(p, candidatos) : undefined
  if (deRevisao) return { caso: deRevisao, revisao: true }

  // peso 3 para caso nunca jogado e 1 para os já jogados
  const pesos = candidatos.map((c) => (c.id in p.casos ? 1 : 3))
  let x = sorteio() * pesos.reduce((soma, peso) => soma + peso, 0)
  const i = pesos.findIndex((peso) => (x -= peso) < 0)
  // com sorteio() = 1, nenhum índice zera e o -1 do findIndex cai no último caso
  return { caso: candidatos.at(i)!, revisao: false }
}

/** Regra 7: no Estudo de uma matéria, os temas em revisão primeiro, os temas na ordem de materias.json, e os casos nunca jogados antes. */
export function proximoDoEstudo(p: Progresso, casos: Caso[], temas: string[]): Caso {
  const emRevisao = (c: Caso) => Number(p.temas[chaveDoTema(c)]?.emRevisao ?? false)
  return semOsRecentes(p, casos).toSorted(
    (a, b) =>
      emRevisao(b) - emRevisao(a) ||
      temas.indexOf(a.tema) - temas.indexOf(b.tema) ||
      (p.casos[a.id]?.ultimo ?? -1) - (p.casos[b.id]?.ultimo ?? -1),
  )[0]
}
