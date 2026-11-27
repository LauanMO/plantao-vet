import { expect, test, type Page } from '@playwright/test'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Bula } from '../src/modelo/bula.ts'
import type { Caso } from '../src/modelo/caso.ts'
import { quantidadeCerta } from '../src/motor/pontuacao.ts'
import { TURNO } from '../src/motor/repeticao.ts'

// Todos os casos do banco, revisados ou não, como no jogo publicado.
// As respostas certas saem do próprio caso, então o teste não carrega conteúdo veterinário.
const PASTA = join('conteudo', 'casos')
const CASOS: Caso[] = readdirSync(PASTA, { recursive: true, encoding: 'utf8' })
  .filter((arquivo) => arquivo.endsWith('.json'))
  .sort()
  .map((arquivo) => JSON.parse(readFileSync(join(PASTA, arquivo), 'utf8')))

const comVirgula = (x: number) => String(Math.round(x * 100) / 100).replace('.', ',')
const botao = (page: Page, nome: string, exact = false) => page.getByRole('button', { name: nome, exact })

/** Da chegada ao resultado, acertando tudo. */
async function jogarAcertandoTudo(page: Page, caso: Caso, naReceita?: (etapa: Extract<Caso['etapas'][number], { tipo: 'receita' }>) => Promise<void>) {
  const correcao = page.getByRole('status')
  await botao(page, 'Atender', true).click()

  for (const etapa of caso.etapas) {
    await expect(page.locator('.etapa-atual')).toContainText(etapa.titulo)
    switch (etapa.tipo) {
      case 'coleta':
        for (const it of etapa.itens.filter((i) => i.importante)) {
          await botao(page, it.rotulo).click()
          // a resposta aparece à vista, sem ela precisar rolar a lista de volta até o topo
          await expect(page.getByText(it.resultado)).toBeInViewport()
        }
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
        await naReceita?.(etapa)
        // o botão do fármaco é o que marca; ao lado dele fica o botão da bula
        await page.locator('button[aria-pressed]', { hasText: etapa.farmacos.find((f) => f.id === etapa.correto.farmaco)!.nome }).click()
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
    // o caso que ela ainda não conferiu pede, no resultado, o código para ela mandar as correções
    await expect(page.getByText(caso.id)).toHaveCount(caso.revisado ? 0 : 1)
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

test('o progresso sobrevive a recarregar a página e volta igual pelo backup', async ({ page }) => {
  const erros = vigiarErros(page)
  const salvo = () => page.evaluate(() => JSON.parse(localStorage.getItem('plantao-vet:progresso:v1') ?? 'null'))
  const [caso] = CASOS
  await page.goto('/')
  await botao(page, 'Configurações').click()
  await page.getByLabel('Nome no crachá').fill('Dra. Teste')
  await botao(page, 'Voltar à fachada').click()
  await botao(page, 'Biblioteca').click()
  await botao(page, caso.paciente.nome).click()
  await jogarAcertandoTudo(page, caso)

  await page.reload()
  await expect(page.getByText('Boa noite, Dra. Teste!')).toBeVisible()
  await botao(page, 'Biblioteca').click()
  await expect(botao(page, caso.paciente.nome)).toContainText('jogado 1×')
  await botao(page, 'Voltar à fachada').click()

  await botao(page, 'Progresso').click()
  const [download] = await Promise.all([page.waitForEvent('download'), botao(page, 'Baixar backup').click()])
  const backup = await download.path()
  const antes = await salvo()
  expect(JSON.parse(readFileSync(backup, 'utf8'))).toEqual(antes)

  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await botao(page, 'Progresso').click()
  await expect(page.getByText('0 casos jogados')).toBeVisible()
  page.once('dialog', (d) => d.accept())
  const [escolha] = await Promise.all([page.waitForEvent('filechooser'), botao(page, 'Abrir backup').click()])
  await escolha.setFiles(backup)
  await expect(page.getByRole('status')).toContainText('Backup aberto: 1 caso jogado.')
  expect(await salvo()).toEqual(antes)
  expect(erros).toEqual([])
})

test.describe('jogo instalado', () => {
  // o build de teste que o playwright.config.ts serve na PORTA_DO_BUILD
  test.use({ baseURL: 'http://localhost:5198' })

  test('abre e joga sem internet depois da primeira visita', async ({ page, context }) => {
    const erros = vigiarErros(page)
    const caso = CASOS[1]
    await page.goto('/')
    // o service worker só fica ativo depois de guardar o jogo inteiro. Os trechos que rodam no navegador
    // vão em texto, porque o tsconfig dos testes é o do Node, sem os tipos do navegador.
    await page.evaluate('navigator.serviceWorker.ready.then(() => true)')

    await context.setOffline(true)
    const resposta = await page.reload()
    expect(resposta?.fromServiceWorker()).toBe(true)
    await botao(page, 'Biblioteca').click()
    await botao(page, caso.paciente.nome).click()
    // imagem que falha não dá erro na página, então o teste confere se cada uma carregou
    const imagensCarregadas = () => page.evaluate('[...document.images].every((i) => i.naturalWidth > 0)')
    await expect.poll(imagensCarregadas).toBe(true)
    await jogarAcertandoTudo(page, caso)
    expect(erros).toEqual([])
  })
})

const PASTA_DO_BULARIO = join('conteudo', 'bulario')
const BULAS: Bula[] = (existsSync(PASTA_DO_BULARIO) ? readdirSync(PASTA_DO_BULARIO) : [])
  .filter((arquivo) => arquivo.endsWith('.json'))
  .map((arquivo) => JSON.parse(readFileSync(join(PASTA_DO_BULARIO, arquivo), 'utf8')))

test.describe('bulário', () => {
  test.skip(BULAS.length === 0, 'o banco ainda não tem bulas')

  test('abre uma bula pelo menu e volta para a lista', async ({ page }) => {
    const erros = vigiarErros(page)
    const [bula] = BULAS
    await page.goto('/')
    await botao(page, 'Bulário').click()
    await botao(page, bula.nome).click()
    await expect(page.getByRole('region', { name: `Bula de ${bula.nome}` })).toContainText(bula.comoAge)
    await botao(page, 'Voltar ao bulário').click()
    await expect(botao(page, bula.nome)).toBeFocused()
    expect(erros).toEqual([])
  })

  test('abre a bula na receita sem perder o fármaco já marcado', async ({ page }) => {
    const erros = vigiarErros(page)
    const caso = CASOS.find((c) => c.id === 'clin-parvovirose-01')!
    await page.goto('/')
    await botao(page, 'Biblioteca').click()
    await botao(page, caso.paciente.nome).click()
    await jogarAcertandoTudo(page, caso, async (etapa) => {
      const farmaco = etapa.farmacos.find((f) => f.id === etapa.correto.farmaco)!
      const marcar = page.locator('button[aria-pressed]', { hasText: farmaco.nome })
      await marcar.click()
      await botao(page, `Bula de ${farmaco.nome}`).click()
      await expect(page.getByRole('region', { name: /^Bula de / })).toBeVisible()
      await botao(page, 'Voltar à receita').click()
      await expect(marcar).toHaveAttribute('aria-pressed', 'true')
    })
    expect(erros).toEqual([])
  })

  test('abre o bulário no meio do atendimento e volta para a mesma etapa', async ({ page }) => {
    const erros = vigiarErros(page)
    const caso = CASOS.find((c) => c.id === 'clin-parvovirose-01')!
    const anamnese = caso.etapas[0] as Extract<Caso['etapas'][number], { tipo: 'coleta' }>
    const [bula] = BULAS
    await page.goto('/')
    await botao(page, 'Biblioteca').click()
    await botao(page, caso.paciente.nome).click()
    await botao(page, 'Atender', true).click()
    const pergunta = botao(page, anamnese.itens[0].rotulo)
    await pergunta.click()
    await botao(page, 'Bulário', true).click()
    await botao(page, bula.nome).click()
    await expect(page.getByRole('region', { name: `Bula de ${bula.nome}` })).toBeVisible()
    await botao(page, 'Voltar ao bulário').click()
    await botao(page, 'Voltar ao atendimento').click()
    await expect(pergunta).toHaveAttribute('aria-pressed', 'true')
    await expect(botao(page, 'Bulário', true)).toBeFocused()
    expect(erros).toEqual([])
  })
})
