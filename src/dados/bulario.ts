import { CLASSES, bulaSchema } from '../modelo/bula'

// Todas as bulas de uma vez, como os casos; o npm run validar já confere o formato no CI.
const arquivos = import.meta.glob('../../conteudo/bulario/*.json', { eager: true, import: 'default' })

export const bulas = Object.values(arquivos)
  .map((json) => bulaSchema.parse(json))
  .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

/** A bula de cada fármaco das receitas, pelo id do fármaco no caso. */
export const bulaDoFarmaco = new Map(bulas.flatMap((b) => b.farmacos.map((id) => [id, b] as const)))

/** As bulas agrupadas na ordem das classes, sem as classes vazias. */
export const bulasPorClasse = CLASSES.map((classe) => ({ classe, bulas: bulas.filter((b) => b.classe === classe) })).filter(
  (g) => g.bulas.length > 0,
)
