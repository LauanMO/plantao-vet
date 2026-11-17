import { casoSchema, materiasSchema, spritesSchema } from './caso.ts'
import { bulaSchema } from './bula.ts'

export interface ArquivoCaso {
  /** caminho dentro de conteudo/casos/, com barras normais: clinica-geral/clin-parvovirose-01.json */
  caminho: string
  conteudo: unknown
}

export interface ResultadoValidacao {
  erros: string[]
  /** a conta de cada receita, para alguém conferir */
  doses: string[]
  revisados: number
  /** ids de todos os fármacos das receitas, para conferir o bulário */
  farmacos: Set<string>
}

export const numero = (x: number) => x.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
const onde = (path: PropertyKey[]) => (path.length ? `${path.map(String).join('.')}: ` : '')

/** Valida o banco de casos inteiro: cada caso pelo schema, mais as regras que cruzam arquivos. */
export function validarBanco(arquivos: ArquivoCaso[], materiasJson: unknown, spritesJson: unknown): ResultadoValidacao {
  const resultado: ResultadoValidacao = { erros: [], doses: [], revisados: 0, farmacos: new Set() }

  const materias = materiasSchema.safeParse(materiasJson)
  const sprites = spritesSchema.safeParse(spritesJson)
  if (!materias.success || !sprites.success) {
    if (!materias.success) resultado.erros.push(...materias.error.issues.map((i) => `materias.json: ${onde(i.path)}${i.message}`))
    if (!sprites.success) resultado.erros.push(...sprites.error.issues.map((i) => `sprites.json: ${onde(i.path)}${i.message}`))
    return resultado
  }
  const porId = new Map(materias.data.materias.map((m) => [m.id, m]))
  const spritePorId = new Map(Object.entries(sprites.data))
  const ids = new Map<string, string>()

  for (const { caminho, conteudo } of arquivos) {
    const erro = (mensagem: string) => resultado.erros.push(`${caminho}: ${mensagem}`)
    const lido = casoSchema.safeParse(conteudo)
    if (!lido.success) {
      for (const i of lido.error.issues) erro(`${onde(i.path)}${i.message}`)
      continue
    }
    const caso = lido.data
    const [pasta, arquivo] = caminho.split('/')

    if (arquivo !== `${caso.id}.json`) erro(`o id "${caso.id}" não bate com o nome do arquivo`)
    const outro = ids.get(caso.id)
    if (outro) erro(`o id "${caso.id}" já é usado em ${outro}`)
    else ids.set(caso.id, caminho)

    const materia = porId.get(caso.materia)
    if (!materia) erro(`a matéria "${caso.materia}" não existe em materias.json`)
    else if (!materia.temas.includes(caso.tema)) erro(`o tema "${caso.tema}" não está entre os temas de ${materia.nome}`)
    if (pasta !== caso.materia) erro(`o caso está na pasta "${pasta}", mas é da matéria "${caso.materia}"`)

    // os estados que a cena usa: o tutor parado; o paciente chega doente (ou deitado) e volta feliz no retorno bom
    const sprite = (campo: string, id: string, estados: string[]) => {
      const s = spritePorId.get(id)
      if (!s) return erro(`${campo}: o sprite "${id}" não está em conteudo/arte/sprites.json`)
      for (const e of estados) if (!s.estados.includes(e)) erro(`${campo}: o sprite "${id}" não tem o estado "${e}"`)
    }
    sprite('tutor.sprite', caso.tutor.sprite, ['parado'])
    sprite('paciente.sprite', caso.paciente.sprite, [caso.paciente.postura === 'deitado' ? 'deitado' : 'doente', 'feliz'])

    if (caso.revisado) resultado.revisados++

    for (const etapa of caso.etapas) {
      if (etapa.tipo !== 'receita') continue
      for (const f of etapa.farmacos) resultado.farmacos.add(f.id)
      const { doseMgKg, concentracao, farmaco: id } = etapa.correto
      const farmaco = etapa.farmacos.find((f) => f.id === id)! // o schema já garantiu que ele está nas opções
      const mg = doseMgKg * caso.paciente.pesoKg
      resultado.doses.push(
        `${caso.id}: ${farmaco.nome}, ${numero(doseMgKg)} mg/kg × ${numero(caso.paciente.pesoKg)} kg = ${numero(mg)} mg; ` +
          `÷ ${numero(concentracao)} mg/${farmaco.unidade} = ${numero(mg / concentracao)} ${farmaco.unidade}`,
      )
    }
  }

  return resultado
}

export interface ArquivoBula {
  /** nome do arquivo dentro de conteudo/bulario/ */
  arquivo: string
  conteudo: unknown
}

/**
 * Valida o bulário: cada bula pelo schema, o id igual ao nome do arquivo e cada fármaco dos casos coberto por
 * uma bula só. Com `exigirTodas`, todo fármaco das receitas precisa ter bula.
 */
export function validarBulario(arquivos: ArquivoBula[], farmacosDosCasos: Set<string>, exigirTodas: boolean) {
  const erros: string[] = []
  const cobertos = new Map<string, string>()
  let revisadas = 0

  for (const { arquivo, conteudo } of arquivos) {
    const erro = (mensagem: string) => erros.push(`bulario/${arquivo}: ${mensagem}`)
    const lido = bulaSchema.safeParse(conteudo)
    if (!lido.success) {
      for (const i of lido.error.issues) erro(`${onde(i.path)}${i.message}`)
      continue
    }
    const bula = lido.data
    if (arquivo !== `${bula.id}.json`) erro(`o id "${bula.id}" não bate com o nome do arquivo`)
    if (bula.revisado) revisadas++
    for (const id of bula.farmacos) {
      const outra = cobertos.get(id)
      if (outra) erro(`o fármaco "${id}" já está na bula ${outra}`)
      else cobertos.set(id, bula.id)
      if (!farmacosDosCasos.has(id)) erro(`o fármaco "${id}" não aparece em nenhuma receita`)
    }
  }

  const semBula = [...farmacosDosCasos].filter((id) => !cobertos.has(id)).sort()
  if (exigirTodas) for (const id of semBula) erros.push(`o fármaco "${id}" das receitas não tem bula em conteudo/bulario/`)
  return { erros, revisadas, semBula }
}
