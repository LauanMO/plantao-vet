import { casoSchema, materiasSchema } from './caso.ts'

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
}

const numero = (x: number) => x.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
const onde = (path: PropertyKey[]) => (path.length ? `${path.map(String).join('.')}: ` : '')

/** Valida o banco de casos inteiro: cada caso pelo schema, mais as regras que cruzam arquivos. */
export function validarBanco(arquivos: ArquivoCaso[], materiasJson: unknown): ResultadoValidacao {
  const resultado: ResultadoValidacao = { erros: [], doses: [], revisados: 0 }

  const materias = materiasSchema.safeParse(materiasJson)
  if (!materias.success) {
    resultado.erros = materias.error.issues.map((i) => `materias.json: ${onde(i.path)}${i.message}`)
    return resultado
  }
  const porId = new Map(materias.data.materias.map((m) => [m.id, m]))
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

    if (caso.revisado) resultado.revisados++

    for (const etapa of caso.etapas) {
      if (etapa.tipo !== 'receita') continue
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
