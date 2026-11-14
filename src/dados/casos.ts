import materiasJson from '../../conteudo/materias.json'
import { casoSchema, materiasSchema } from '../modelo/caso'

// Todos de uma vez: 60 casos dão uns 100 KB compactados. O npm run validar já recusa caso quebrado no CI;
// aqui o mesmo schema confere de novo no carregamento.
// shortcut: entram também os casos com revisado: false; o filtro de revisados chega na publicação (Fase 7).
const arquivos = import.meta.glob('../../conteudo/casos/*/*.json', { eager: true, import: 'default' })

export const casos = Object.values(arquivos).map((json) => casoSchema.parse(json))

export const materias = materiasSchema.parse(materiasJson).materias
export type Materia = (typeof materias)[number]
