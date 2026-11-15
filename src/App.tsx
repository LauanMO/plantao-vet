import { useEffect, useRef, useState } from 'react'
import { casos, type Materia } from './dados/casos'
import { carregarProgresso, salvarProgresso } from './dados/progresso'
import type { Caso } from './modelo/caso'
import type { ResultadoCaso } from './motor/pontuacao'
import { TURNO, proximoDoEstudo, proximoDoPlantao, registrar } from './motor/repeticao'
import { tocar } from './som/som'
import { Atendimento } from './telas/Atendimento'
import { Biblioteca } from './telas/Biblioteca'
import { Configuracoes } from './telas/Configuracoes'
import { QuadroDeAvisos } from './telas/Estudo'
import { Fachada } from './telas/Fachada'
import { FimDoPlantao, type Paciente } from './telas/FimDoPlantao'
import { TelaDeProgresso } from './telas/Progresso'

type Modo = { tipo: 'plantao' } | { tipo: 'estudo'; materia: Materia } | { tipo: 'biblioteca' }
type Menu = 'fachada' | 'quadro' | 'biblioteca' | 'fim-do-plantao' | 'progresso' | 'configuracoes'
type Tela =
  | { nome: Menu }
  /** `vez` remonta o atendimento mesmo quando o próximo caso é o mesmo, num banco pequeno */
  | { nome: 'caso'; caso: Caso; modo: Modo; vez: number }

export default function App() {
  const [progresso, setProgresso] = useState(carregarProgresso)
  const [tela, setTela] = useState<Tela>({ nome: 'fachada' })
  const [turno, setTurno] = useState<Paciente[]>([])
  const vez = useRef(0)
  useEffect(() => salvarProgresso(progresso), [progresso])

  const ir = (nome: Menu) => () => setTela({ nome })
  const atender = (caso: Caso, modo: Modo) => {
    tocar(caso.cenario === 'consultorio' ? 'porta' : 'clique')
    vez.current++
    setTela({ nome: 'caso', caso, modo, vez: vez.current })
  }
  const proximoPaciente = (anteriores: Paciente[]) => {
    const { caso, revisao } = proximoDoPlantao(progresso, casos, anteriores.map((p) => p.revisao))
    setTurno([...anteriores, { caso, revisao }])
    atender(caso, { tipo: 'plantao' })
  }
  const estudar = (materia: Materia) =>
    atender(proximoDoEstudo(progresso, casos.filter((c) => c.materia === materia.id), materia.temas), { tipo: 'estudo', materia })

  switch (tela.nome) {
    case 'fachada':
      return (
        <Fachada
          nome={progresso.nome?.trim() ?? ''}
          plantao={() => proximoPaciente([])}
          estudo={ir('quadro')}
          biblioteca={ir('biblioteca')}
          progresso={ir('progresso')}
          configuracoes={ir('configuracoes')}
        />
      )
    case 'quadro':
      return <QuadroDeAvisos progresso={progresso} estudar={estudar} voltar={ir('fachada')} />
    case 'biblioteca':
      return <Biblioteca progresso={progresso} abrir={(c) => atender(c, { tipo: 'biblioteca' })} voltar={ir('fachada')} />
    case 'fim-do-plantao':
      return <FimDoPlantao turno={turno} progresso={progresso} novo={() => proximoPaciente([])} voltar={ir('fachada')} />
    case 'progresso':
      return <TelaDeProgresso progresso={progresso} trocar={setProgresso} voltar={ir('fachada')} />
    case 'configuracoes':
      return <Configuracoes nome={progresso.nome ?? ''} mudarNome={(nome) => setProgresso((p) => ({ ...p, nome }))} voltar={ir('fachada')} />
  }

  const { caso, modo } = tela
  const revisao = caso.revisado ? '' : ' · em revisão'
  // tudo o que ela joga, em qualquer modo, atualiza o progresso e a revisão
  const concluir = (r: ResultadoCaso) => {
    setProgresso((p) => registrar(p, caso, r))
    if (modo.tipo === 'plantao') setTurno((t) => t.with(-1, { ...t.at(-1)!, resultado: r }))
  }
  let contexto: string
  let proximo: { texto: string; ir: () => void }
  switch (modo.tipo) {
    case 'plantao': {
      const n = turno.length
      contexto = `Paciente ${n} de ${TURNO}${turno.at(-1)?.revisao ? ' · revisão' : ''}${revisao}`
      proximo =
        n < TURNO
          ? { texto: `Próximo paciente (${n + 1} de ${TURNO})`, ir: () => proximoPaciente(turno) }
          : { texto: 'Ver o resumo do plantão', ir: ir('fim-do-plantao') }
      break
    }
    case 'estudo':
      contexto = `Estudo · ${modo.materia.nome}${revisao}`
      proximo = { texto: 'Próximo caso', ir: () => estudar(modo.materia) }
      break
    case 'biblioteca':
      contexto = `Biblioteca${revisao}`
      proximo = { texto: 'Voltar ao arquivo', ir: ir('biblioteca') }
  }

  return <Atendimento key={tela.vez} caso={caso} contexto={contexto} concluir={concluir} proximo={proximo} sair={ir('fachada')} />
}
