import materiasJson from '../../conteudo/materias.json'
import { casoSchema, materiasSchema } from '../modelo/caso'

// Todos de uma vez: 60 casos dão uns 100 KB compactados. O npm run validar já recusa caso quebrado no CI;
// aqui o mesmo schema confere de novo no carregamento.
const arquivos = import.meta.glob('../../conteudo/casos/*/*.json', { eager: true, import: 'default' })
const todos = Object.values(arquivos).map((json) => casoSchema.parse(json))

// O jogo publicado (npm run build) leva só os casos que ela revisou. O npm run dev e o build de teste do
// Playwright (--mode teste) levam todos, para ela revisar jogando e os testes terem casos para jogar.
export const casos = import.meta.env.MODE === 'production' ? todos.filter((c) => c.revisado) : todos

export const materias = materiasSchema.parse(materiasJson).materias
export type Materia = (typeof materias)[number]
