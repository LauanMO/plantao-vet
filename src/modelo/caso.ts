import { z } from 'zod'

z.config(z.locales.ptBR())

/** Ferramentas que o jogo tem no exame físico. */
export const FERRAMENTAS = ['termometro', 'estetoscopio', 'lanterna', 'mao', 'gota'] as const

/** Espécies que cada cenário recebe. */
export const ESPECIES = { consultorio: ['cão', 'gato'], campo: ['bovino', 'equino'] } as const

const texto = z.string().min(1)
// Limites da caixa de diálogo (regra 9 do validador, em docs/PLANO.md)
const rotulo = texto.max(45)
const resposta = texto.max(120)
const fala = texto.max(160) // também vale para perguntas e alternativas
const tolerancia = z.number().min(0).max(0.2)

const coleta = z.strictObject({
  tipo: z.literal('coleta'),
  titulo: texto,
  limite: z.number().int().positive().optional(),
  orcamento: z.number().positive().optional(),
  itens: z
    .array(
      z.strictObject({
        id: texto,
        rotulo,
        resultado: resposta,
        importante: z.boolean(),
        ferramenta: z.enum(FERRAMENTAS).optional(),
        custo: z.number().positive().optional(),
      }),
    )
    .min(1),
})

const escolha = z.strictObject({
  tipo: z.literal('escolha'),
  titulo: texto,
  quem: z.enum(['prontuario', 'preceptora']),
  critica: z.boolean().optional(),
  pergunta: fala,
  opcoes: z.array(z.strictObject({ texto: fala, correta: z.boolean(), explicacao: texto })).min(2),
})

const calculo = z.strictObject({
  tipo: z.literal('calculo'),
  titulo: texto,
  critica: z.boolean().optional(),
  pergunta: fala,
  unidade: texto,
  resposta: z.number(),
  tolerancia,
  explicacao: texto,
})

const receita = z.strictObject({
  tipo: z.literal('receita'),
  titulo: texto,
  critica: z.boolean().optional(),
  instrucao: texto,
  farmacos: z
    .array(z.strictObject({ id: texto, nome: texto, apresentacao: texto, unidade: texto, explicacao: texto }))
    .min(2),
  correto: z.strictObject({
    farmaco: texto,
    doseMgKg: z.number().positive(),
    /** mg por unidade do fármaco (mL, comprimido) */
    concentracao: z.number().positive(),
    tolerancia,
    via: texto,
    frequencia: texto,
  }),
  vias: z.array(texto).min(2),
  frequencias: z.array(texto).min(2),
  explicacao: texto,
})

const retorno = z.strictObject({
  tipo: z.literal('retorno'),
  titulo: texto,
  bom: texto,
  falaBom: fala,
  ruim: texto,
  falaRuim: fala,
})

export const materiasSchema = z.strictObject({
  versao: z.literal(1),
  materias: z
    .array(
      z.strictObject({
        id: texto,
        nome: texto,
        prefixo: texto,
        cobra: texto,
        temas: z.array(texto).min(1),
        referencias: z.array(texto).min(1),
      }),
    )
    .min(1),
})

/** O manifesto conteudo/arte/sprites.json, escrito pelo ferramentas-arte/gerar.py. */
export const spritesSchema = z.record(
  texto,
  z.strictObject({
    largura: z.number().int().positive(),
    altura: z.number().int().positive(),
    /** pixel do desenho que encosta no chão: é por ele que a cena posiciona o personagem */
    pe: z.strictObject({ x: z.number().int().min(0), y: z.number().int().min(0) }),
    /** cada estado é o arquivo public/arte/<id>-<estado>.png */
    estados: z.array(texto).min(1),
  }),
)

export type Sprites = z.infer<typeof spritesSchema>

/** Um caso de conteudo/casos/<materia>/<id>.json, com as regras que dependem só dele. */
export const casoSchema = z
  .strictObject({
    id: texto,
    materia: texto,
    tema: texto,
    dificuldade: z.number().int().min(1),
    cenario: z.enum(['consultorio', 'campo']),
    paciente: z.strictObject({
      nome: texto,
      especie: z.enum(['cão', 'gato', 'bovino', 'equino']),
      raca: texto,
      sexo: texto,
      idade: texto,
      pesoKg: z.number().positive(),
      sprite: texto,
      postura: z.enum(['em-pe', 'deitado']).optional(),
    }),
    tutor: z.strictObject({ nome: texto, sprite: texto }),
    chegada: fala,
    etapas: z.array(z.discriminatedUnion('tipo', [coleta, escolha, calculo, receita, retorno])).min(1),
    resumo: z.array(texto).min(1),
    referencias: z.array(texto).min(1),
    revisado: z.boolean(),
  })
  .superRefine((caso, ctx) => {
    const erro = (path: (string | number)[], message: string) => ctx.addIssue({ code: 'custom', path, message })

    const especies: readonly string[] = ESPECIES[caso.cenario]
    if (!especies.includes(caso.paciente.especie)) {
      erro(['paciente', 'especie'], `${caso.paciente.especie} não é atendido no cenário ${caso.cenario}`)
    }

    caso.etapas.forEach((etapa, i) => {
      const p = ['etapas', i]
      switch (etapa.tipo) {
        case 'coleta': {
          const importantes = etapa.itens.filter((it) => it.importante)
          if (importantes.length === 0) erro(p, 'a coleta precisa de pelo menos um item importante')
          if ((etapa.limite === undefined) === (etapa.orcamento === undefined)) {
            erro(p, 'a coleta precisa de limite ou de orcamento, e só de um deles')
          }
          if (etapa.limite !== undefined && etapa.limite < importantes.length) {
            erro([...p, 'limite'], `o limite (${etapa.limite}) é menor que o número de itens importantes (${importantes.length})`)
          }
          if (etapa.orcamento !== undefined) {
            if (etapa.itens.some((it) => it.custo === undefined)) erro(p, 'com orcamento, todo item precisa de custo')
            const custo = importantes.reduce((soma, it) => soma + (it.custo ?? 0), 0)
            if (etapa.orcamento < custo) {
              erro([...p, 'orcamento'], `o orçamento (${etapa.orcamento}) não paga os itens importantes (${custo})`)
            }
          }
          const comFerramenta = etapa.itens.filter((it) => it.ferramenta).length
          if (comFerramenta > 0 && comFerramenta < etapa.itens.length) {
            erro(p, 'no exame físico, todo item precisa de ferramenta')
          }
          const ids = etapa.itens.map((it) => it.id)
          if (new Set(ids).size < ids.length) erro(p, 'há itens com o mesmo id')
          break
        }
        case 'escolha': {
          const corretas = etapa.opcoes.filter((o) => o.correta).length
          if (corretas !== 1) erro([...p, 'opcoes'], `precisa de exatamente uma opção correta, e tem ${corretas}`)
          break
        }
        case 'receita': {
          const { correto } = etapa
          if (!etapa.farmacos.some((f) => f.id === correto.farmaco)) {
            erro([...p, 'correto', 'farmaco'], `o fármaco "${correto.farmaco}" não está nas opções`)
          }
          if (!etapa.vias.includes(correto.via)) erro([...p, 'correto', 'via'], `a via "${correto.via}" não está nas opções`)
          if (!etapa.frequencias.includes(correto.frequencia)) {
            erro([...p, 'correto', 'frequencia'], `a frequência "${correto.frequencia}" não está nas opções`)
          }
          break
        }
        case 'retorno': {
          if (i !== caso.etapas.length - 1) erro(p, 'o retorno precisa ser a última etapa')
          if (!caso.etapas.slice(0, i).some((e) => 'critica' in e && e.critica)) {
            erro(p, 'o retorno precisa de uma etapa crítica antes dele')
          }
          break
        }
      }
    })
  })

export type Caso = z.infer<typeof casoSchema>
