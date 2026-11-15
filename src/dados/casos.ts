import materiasJson from '../../conteudo/materias.json'
import { casoSchema, materiasSchema } from '../modelo/caso'

// Todos de uma vez: 60 casos dão uns 100 KB compactados. O npm run validar já recusa caso quebrado no CI;
// aqui o mesmo schema confere de novo no carregamento.
const arquivos = import.meta.glob('../../conteudo/casos/*/*.json', { eager: true, import: 'default' })
// Entram todos, revisados ou não: ela revisa jogando no site, e os casos com revisado: false aparecem
// com a etiqueta 'em revisão' na Biblioteca, no cabeçalho do caso e no resultado.
export const casos = Object.values(arquivos).map((json) => casoSchema.parse(json))

export const materias = materiasSchema.parse(materiasJson).materias
export type Materia = (typeof materias)[number]
