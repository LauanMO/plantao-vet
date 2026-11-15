import { z } from 'zod'

const contagem = z.number().int().min(0)

/** O progresso salvo no aparelho e no arquivo de backup; o formato está em docs/PLANO.md. */
export const progressoSchema = z.object({
  versao: z.literal(1),
  /** o nome do crachá */
  nome: z.string().max(40).optional(),
  /** casos terminados, em qualquer modo */
  jogados: contagem,
  casos: z.record(z.string(), z.object({ vezes: contagem, acertos: contagem, ultimo: contagem, ultimaNota: z.number().min(0).max(1) })),
  /** pela chave do tema: matéria/tema-em-slug */
  temas: z.record(
    z.string(),
    z.object({
      // uma caixa fora de 0 a 4 não tem intervalo de volta em src/motor/repeticao.ts
      caixa: z.number().int().min(0).max(4),
      volta: contagem,
      emRevisao: z.boolean(),
      erros: contagem,
      acertos: contagem,
      ultimoErrado: z.string().optional(),
    }),
  ),
})

export type Progresso = z.infer<typeof progressoSchema>
