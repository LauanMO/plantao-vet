import { z } from 'zod'

z.config(z.locales.ptBR())

/** As classes do bulário, na ordem em que a tela mostra. */
export const CLASSES = [
  'Antibióticos',
  'Antifúngicos',
  'Antiparasitários',
  'Anti-inflamatórios não esteroides (AINEs)',
  'Analgésicos não opioides',
  'Corticoides',
  'Opioides',
  'Sedativos e reversores',
  'Sistema nervoso autônomo',
  'Antieméticos e digestivos',
  'Hormônios',
  'Diuréticos',
  'Fluidos, eletrólitos e energia',
  'Antídotos',
  'Minerais',
] as const

const texto = z.string().min(1)
// cada item de lista cabe em poucas linhas no celular
const item = texto.max(200)

/** Uma bula de conteudo/bulario/<id>.json: o que o fármaco faz, sem doses (a dose é a conta da receita). */
export const bulaSchema = z.strictObject({
  id: texto,
  nome: texto.max(45),
  classe: z.enum(CLASSES),
  /** ids dos fármacos dos casos que esta bula cobre: o mesmo princípio ativo em apresentações diferentes */
  farmacos: z.array(texto).min(1),
  comoAge: texto.max(400),
  paraQueServe: z.array(item).min(1),
  efeitosAdversos: z.array(item).min(1),
  /** contraindicações, cuidados e diferenças entre espécies */
  cuidados: z.array(item).min(1),
  referencias: z.array(texto).min(1),
  revisado: z.boolean(),
})

export type Bula = z.infer<typeof bulaSchema>
