// Valida os casos de conteudo/casos/ e as bulas de conteudo/bulario/, e imprime a conta de cada dose para alguém
// conferir. Uso: npm run validar
// Com --publicar, também falha se nenhum caso estiver revisado: o jogo publicado sairia vazio.
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { validarBanco, validarBulario, type ArquivoBula, type ArquivoCaso } from '../src/modelo/validar.ts'

// todo fármaco das receitas precisa de bula: é ela que a estudante abre na receita
const EXIGIR_BULA_DE_TODO_FARMACO = true

const pasta = join('conteudo', 'casos')
const errosDeJson: string[] = []

const arquivos = readdirSync(pasta, { recursive: true, encoding: 'utf8' })
  .map((caminho) => caminho.replaceAll('\\', '/'))
  .filter((caminho) => caminho.endsWith('.json'))
  .sort()
  .flatMap((caminho): ArquivoCaso[] => {
    try {
      return [{ caminho, conteudo: JSON.parse(readFileSync(join(pasta, caminho), 'utf8')) }]
    } catch (e) {
      errosDeJson.push(`${caminho}: JSON inválido (${(e as Error).message})`)
      return []
    }
  })

const lerJson = (caminho: string): unknown => JSON.parse(readFileSync(join('conteudo', caminho), 'utf8'))
const resultado = validarBanco(arquivos, lerJson('materias.json'), lerJson(join('arte', 'sprites.json')))
const pastaDoBulario = join('conteudo', 'bulario')
const bulas = (existsSync(pastaDoBulario) ? readdirSync(pastaDoBulario) : [])
  .filter((arquivo) => arquivo.endsWith('.json'))
  .sort()
  .flatMap((arquivo): ArquivoBula[] => {
    try {
      return [{ arquivo, conteudo: JSON.parse(readFileSync(join(pastaDoBulario, arquivo), 'utf8')) }]
    } catch (e) {
      errosDeJson.push(`bulario/${arquivo}: JSON inválido (${(e as Error).message})`)
      return []
    }
  })
const bulario = validarBulario(bulas, resultado.farmacos, EXIGIR_BULA_DE_TODO_FARMACO)
const erros = [...errosDeJson, ...resultado.erros, ...bulario.erros]
if (process.argv.includes('--publicar') && resultado.revisados === 0)
  erros.push('nenhum caso revisado: o jogo publicado leva só os casos com revisado: true')

for (const dose of resultado.doses) console.log(`dose  ${dose}`)
for (const erro of erros) console.error(`erro  ${erro}`)
console.log(`\n${arquivos.length + errosDeJson.length} casos, ${resultado.revisados} revisados, ${erros.length} erros`)
console.log(`${bulas.length} bulas, ${bulario.revisadas} revisadas, ${bulario.semBula.length} fármacos sem bula`)
process.exitCode = erros.length > 0 ? 1 : 0
