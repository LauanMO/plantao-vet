import { describe, expect, it } from 'vitest'
import sprites from '../../conteudo/arte/sprites.json'
import materias from '../../conteudo/materias.json'
import mimosaJson from '../../conteudo/casos/clinica-geral/clin-hipocalcemia-01.json'
import pipocaJson from '../../conteudo/casos/clinica-geral/clin-parvovirose-01.json'
import { casoSchema, type Caso } from './caso.ts'
import { validarBanco } from './validar.ts'

type Etapa = Caso['etapas'][number]

const pipoca = () => structuredClone(casoSchema.parse(pipocaJson))
const mimosa = () => structuredClone(casoSchema.parse(mimosaJson))
const caminho = (c: Caso) => `${c.materia}/${c.id}.json`
const erros = (...casos: Caso[]) =>
  validarBanco(casos.map((c) => ({ caminho: caminho(c), conteudo: c })), materias, sprites).erros

/** primeira etapa do tipo pedido, já com o tipo certo */
function etapa<T extends Etapa['tipo']>(c: Caso, tipo: T, titulo?: string) {
  return c.etapas.find((e) => e.tipo === tipo && (!titulo || e.titulo === titulo)) as Extract<Etapa, { tipo: T }>
}

describe('os casos do kit', () => {
  it('passam sem erro e mostram a conta das doses', () => {
    const r = validarBanco(
      [pipoca(), mimosa()].map((c) => ({ caminho: caminho(c), conteudo: c })),
      materias,
      sprites,
    )
    expect(r.erros).toEqual([])
    expect(r.revisados).toBe(0)
    expect(r.doses).toEqual([
      'clin-parvovirose-01: Maropitant, 1 mg/kg × 5 kg = 5 mg; ÷ 10 mg/mL = 0,5 mL',
      'clin-hipocalcemia-01: Borogluconato de cálcio 23%, 22,2 mg/kg × 500 kg = 11.100 mg; ÷ 21,4 mg/mL = 518,69 mL',
    ])
  })
})

// [regra, como quebrar o caso, trecho esperado no erro]
const quebrados: [string, (c: Caso) => Caso[], string][] = [
  ['1: id repetido no banco', (c) => [Object.assign(c, { id: 'clin-parvovirose-01' }), pipoca()], 'já é usado'],
  ['2: matéria que não existe', (c) => [Object.assign(c, { materia: 'cirurgia' })], 'não existe em materias.json'],
  ['2: tema fora da lista da matéria', (c) => [Object.assign(c, { tema: 'Tema inventado' })], 'não está entre os temas'],
  ['2: sem chegada', (c) => [Object.assign(c, { chegada: '' })], 'chegada'],
  ['3: coleta sem item importante', (c) => (etapa(c, 'coleta').itens.forEach((it) => (it.importante = false)), [c]), 'pelo menos um item importante'],
  ['3: limite menor que os importantes', (c) => ((etapa(c, 'coleta').limite = 2), [c]), 'menor que o número de itens importantes'],
  ['3: orçamento que não paga os importantes', (c) => ((etapa(c, 'coleta', 'Exames complementares').orcamento = 50), [c]), 'não paga os itens importantes'],
  ['3: limite e orçamento juntos', (c) => ((etapa(c, 'coleta').orcamento = 100), [c]), 'só de um deles'],
  ['4: duas opções corretas', (c) => (etapa(c, 'escolha').opcoes.forEach((o) => (o.correta = true)), [c]), 'exatamente uma opção correta'],
  ['4: opção sem explicação', (c) => ((etapa(c, 'escolha').opcoes[1].explicacao = ''), [c]), 'explicacao'],
  ['5: fármaco fora das opções', (c) => ((etapa(c, 'receita').correto.farmaco = 'dipirona'), [c]), 'o fármaco "dipirona"'],
  ['5: via fora das opções', (c) => ((etapa(c, 'receita').correto.via = 'Retal'), [c]), 'a via "Retal"'],
  ['5: frequência fora das opções', (c) => ((etapa(c, 'receita').correto.frequencia = 'A cada 6 horas'), [c]), 'a frequência'],
  ['6: tolerância do cálculo acima de 0,2', (c) => ((etapa(c, 'calculo').tolerancia = 0.3), [c]), 'tolerancia'],
  ['7: retorno antes do fim', (c) => (c.etapas.reverse(), [c]), 'última etapa'],
  ['7: sem etapa crítica antes do retorno', (c) => (c.etapas.forEach((e) => 'critica' in e && delete e.critica), [c]), 'etapa crítica'],
  ['8: espécie que o cenário não atende', (c) => ((c.cenario = 'consultorio'), [c]), 'não é atendido no cenário consultorio'],
  ['8: ferramenta que o jogo não tem', (c) => (Object.assign(etapa(c, 'coleta', 'Exame físico').itens[0], { ferramenta: 'otoscopio' }), [c]), 'ferramenta'],
  ['8: paciente com sprite fora do manifesto', (c) => ((c.paciente.sprite = 'vaca-jersey'), [c]), 'o sprite "vaca-jersey" não está'],
  ['8: tutor com sprite fora do manifesto', (c) => ((c.tutor.sprite = 'produtor-9'), [c]), 'o sprite "produtor-9" não está'],
  ['8: paciente deitado sem o estado deitado', (c) => ((c.paciente.sprite = 'cao-pequeno-caramelo'), [c]), 'não tem o estado "deitado"'],
  ['8: item do exame sem ferramenta', (c) => (delete etapa(c, 'coleta', 'Exame físico').itens[0].ferramenta, [c]), 'todo item precisa de ferramenta'],
  ['9: rótulo com mais de 45 caracteres', (c) => ((etapa(c, 'coleta').itens[0].rotulo = 'x'.repeat(46)), [c]), 'rotulo'],
  ['9: fala com mais de 160 caracteres', (c) => ((c.chegada = 'x'.repeat(161)), [c]), 'chegada'],
  ['campo com nome errado', (c) => (Object.assign(etapa(c, 'coleta').itens[0], { importnte: true }), [c]), 'importnte'],
]

describe('recusa casos quebrados de propósito', () => {
  it.each(quebrados)('regra %s', (_regra, quebrar, esperado) => {
    const resultado = erros(...quebrar(mimosa()))
    expect(resultado.length).toBeGreaterThan(0)
    expect(resultado.join('\n')).toContain(esperado)
  })

  it('regra 1: id que não bate com o nome do arquivo', () => {
    const c = pipoca()
    const r = validarBanco([{ caminho: 'clinica-geral/outro-nome.json', conteudo: c }], materias, sprites)
    expect(r.erros.join('\n')).toContain('não bate com o nome do arquivo')
  })

  it('regra 2: caso na pasta de outra matéria', () => {
    const c = pipoca()
    const r = validarBanco([{ caminho: `anatomia/${c.id}.json`, conteudo: c }], materias, sprites)
    expect(r.erros.join('\n')).toContain('está na pasta "anatomia"')
  })

  it('regra 8: manifesto de sprites quebrado', () => {
    const quebrado = { ...sprites, 'tutora-1': { ...sprites['tutora-1'], estados: [] } }
    const r = validarBanco([{ caminho: caminho(pipoca()), conteudo: pipoca() }], materias, quebrado)
    expect(r.erros.join('\n')).toContain('sprites.json: tutora-1.estados')
  })
})
