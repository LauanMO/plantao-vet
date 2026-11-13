// Valida os casos de conteudo/casos/ e imprime a conta de cada dose para alguém conferir. Uso: npm run validar
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { validarBanco, type ArquivoCaso } from '../src/modelo/validar.ts'

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
const erros = [...errosDeJson, ...resultado.erros]

for (const dose of resultado.doses) console.log(`dose  ${dose}`)
for (const erro of erros) console.error(`erro  ${erro}`)
console.log(`\n${arquivos.length + errosDeJson.length} casos, ${resultado.revisados} revisados, ${erros.length} erros`)
process.exitCode = erros.length > 0 ? 1 : 0
