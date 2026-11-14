import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import type { Caso } from '../src/modelo/caso.ts'
import { quantidadeCerta } from '../src/motor/pontuacao.ts'

// As respostas certas saem do próprio caso, então o teste não carrega conteúdo veterinário.
const ler = (id: string): Caso => JSON.parse(readFileSync(`conteudo/casos/clinica-geral/${id}.json`, 'utf8'))
const CASOS = [ler('clin-parvovirose-01'), ler('clin-hipocalcemia-01')]

const comVirgula = (x: number) => String(Math.round(x * 100) / 100).replace('.', ',')

async function jogarAcertandoTudo(page: Page, caso: Caso) {
  const botao = (nome: string, exact = false) => page.getByRole('button', { name: nome, exact })
  const correcao = page.getByRole('status')

  await page.goto('/')
  await botao(`Atender ${caso.paciente.nome}`).click()
  await botao('Atender', true).click()

  for (const etapa of caso.etapas) {
    await expect(page.locator('.etapa-atual')).toContainText(etapa.titulo)
    switch (etapa.tipo) {
      case 'coleta':
        for (const it of etapa.itens.filter((i) => i.importante)) await botao(it.rotulo).click()
        await botao('Concluir').click()
        await expect(correcao).toContainText('Achou tudo')
        break
      case 'escolha':
        await botao(etapa.opcoes.find((o) => o.correta)!.texto).click()
        await expect(correcao).toContainText('Certo!')
        break
      case 'calculo':
        await page.getByLabel('Sua resposta').fill(comVirgula(etapa.resposta))
        await botao('Conferir').click()
        await expect(correcao).toContainText('Certo!')
        break
      case 'receita':
        await botao(etapa.farmacos.find((f) => f.id === etapa.correto.farmaco)!.nome).click()
        await page.getByLabel('Quantidade por aplicação').fill(comVirgula(quantidadeCerta(etapa, caso.paciente.pesoKg)))
        await botao(etapa.correto.via, true).click()
        await botao(etapa.correto.frequencia, true).click()
        await botao('Assinar a receita').click()
        await expect(correcao).toContainText('Receita 100%')
        break
      case 'retorno':
        await expect(page.getByText(etapa.falaBom)).toBeVisible()
        await botao('Ver o resultado').click()
        continue
    }
    await botao('Seguir').click()
  }

  await expect(page.getByRole('img', { name: '3 de 3 estrelas' })).toBeVisible()
  await expect(page.locator('.nota')).toContainText('100%')
  await expect(page.getByText('Caso acertado.')).toBeVisible()
}

for (const caso of CASOS) {
  test(`joga ${caso.paciente.nome} do começo ao fim acertando tudo`, async ({ page }) => {
    const erros: Error[] = []
    page.on('pageerror', (e) => erros.push(e))
    await jogarAcertandoTudo(page, caso)
    expect(erros).toEqual([])
  })
}
