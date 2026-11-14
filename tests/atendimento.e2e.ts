import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import type { Caso } from '../src/modelo/caso.ts'
import { quantidadeCerta } from '../src/motor/pontuacao.ts'
import { TURNO } from '../src/motor/repeticao.ts'

// As respostas certas saem do próprio caso, então o teste não carrega conteúdo veterinário.
const ler = (id: string): Caso => JSON.parse(readFileSync(`conteudo/casos/clinica-geral/${id}.json`, 'utf8'))
const CASOS = [ler('clin-parvovirose-01'), ler('clin-hipocalcemia-01')]

const comVirgula = (x: number) => String(Math.round(x * 100) / 100).replace('.', ',')
const botao = (page: Page, nome: string, exact = false) => page.getByRole('button', { name: nome, exact })

/** Da chegada ao resultado, acertando tudo. */
async function jogarAcertandoTudo(page: Page, caso: Caso) {
  const correcao = page.getByRole('status')
  await botao(page, 'Atender', true).click()

  for (const etapa of caso.etapas) {
    await expect(page.locator('.etapa-atual')).toContainText(etapa.titulo)
    switch (etapa.tipo) {
      case 'coleta':
        for (const it of etapa.itens.filter((i) => i.importante)) await botao(page, it.rotulo).click()
        await botao(page, 'Concluir').click()
        await expect(correcao).toContainText('Achou tudo')
        break
      case 'escolha':
        await botao(page, etapa.opcoes.find((o) => o.correta)!.texto).click()
        await expect(correcao).toContainText('Certo!')
        break
      case 'calculo':
        await page.getByLabel('Sua resposta').fill(comVirgula(etapa.resposta))
        await botao(page, 'Conferir').click()
        await expect(correcao).toContainText('Certo!')
        break
      case 'receita':
        await botao(page, etapa.farmacos.find((f) => f.id === etapa.correto.farmaco)!.nome).click()
        await page.getByLabel('Quantidade por aplicação').fill(comVirgula(quantidadeCerta(etapa, caso.paciente.pesoKg)))
        await botao(page, etapa.correto.via, true).click()
        await botao(page, etapa.correto.frequencia, true).click()
        await botao(page, 'Assinar a receita').click()
        await expect(correcao).toContainText('Receita 100%')
        break
      case 'retorno':
        await expect(page.getByText(etapa.falaBom)).toBeVisible()
        await botao(page, 'Ver o resultado').click()
        continue
    }
    await botao(page, 'Seguir').click()
  }

  await expect(page.getByRole('img', { name: '3 de 3 estrelas' })).toBeVisible()
  await expect(page.locator('.nota')).toContainText('100%')
  await expect(page.getByText('Caso acertado.')).toBeVisible()
}

/** Junta os erros da página: o teste falha se o jogo der erro no meio do caminho. */
function vigiarErros(page: Page) {
  const erros: Error[] = []
  page.on('pageerror', (e) => erros.push(e))
  return erros
}

for (const caso of CASOS) {
  test(`abre ${caso.paciente.nome} na biblioteca e joga do começo ao fim acertando tudo`, async ({ page }) => {
    const erros = vigiarErros(page)
    await page.goto('/')
    await botao(page, 'Biblioteca').click()
    await botao(page, caso.paciente.nome).click()
    await jogarAcertandoTudo(page, caso)
    await expect(botao(page, 'Voltar ao arquivo')).toBeVisible()
    expect(erros).toEqual([])
  })
}

test('joga um plantão de 5 pacientes acertando tudo e vê o resumo', async ({ page }) => {
  const erros = vigiarErros(page)
  await page.goto('/')
  await botao(page, 'Começar o plantão').click()
  for (let i = 1; i <= TURNO; i++) {
    await expect(page.locator('.contexto')).toContainText(`Paciente ${i} de ${TURNO}`)
    const nome = await page.getByRole('region', { name: 'Ficha do paciente' }).locator('strong').textContent()
    await jogarAcertandoTudo(page, CASOS.find((c) => c.paciente.nome === nome)!)
    await botao(page, i < TURNO ? 'Próximo paciente' : 'Ver o resumo do plantão').click()
  }
  await expect(page.getByText(`${TURNO} de ${TURNO} casos acertados`)).toBeVisible()
  expect(erros).toEqual([])
})
