import { useEffect, useRef, useState } from 'react'
import { Cena } from '../cenas/Cena'
import { Prontuario } from '../cenas/Prontuario'
import { Calculo } from '../etapas/Calculo'
import { Coleta } from '../etapas/Coleta'
import { BotaoMudo, Fala, Seguir } from '../etapas/comum'
import { Escolha } from '../etapas/Escolha'
import { Receita } from '../etapas/Receita'
import { Retorno } from '../etapas/Retorno'
import { ficha } from '../etapas/texto'
import type { Caso } from '../modelo/caso'
import { resultadoDoCaso, type Resposta, type ResultadoCaso } from '../motor/pontuacao'
import { Palco } from '../palco/Palco'
import { tocar } from '../som/som'
import { Resultado } from './Resultado'

interface PropsAtendimento {
  caso: Caso
  /** de onde o caso veio, no cabeçalho: "Paciente 2 de 5", "Estudo · Clínica Geral" */
  contexto: string
  /** chamado uma vez, quando ela chega ao resultado */
  concluir: (r: ResultadoCaso) => void
  /** o botão principal do resultado: próximo paciente, próximo caso ou voltar ao arquivo */
  proximo: { texto: string; ir: () => void }
  sair: () => void
}

/** Um caso do começo ao fim: chegada, as etapas na ordem do arquivo, retorno e resultado. */
export function Atendimento({ caso, contexto, concluir, proximo, sair }: PropsAtendimento) {
  // -1 é a chegada, depois cada etapa, e o passo depois da última é o resultado
  const [passo, setPasso] = useState(-1)
  const [respostas, setRespostas] = useState<(Resposta | undefined)[]>(() => caso.etapas.map(() => undefined))
  const [vendoProntuario, setVendoProntuario] = useState(false)
  const titulo = useRef<HTMLParagraphElement>(null)

  // a cada passo, o foco vai para o nome da etapa: o leitor de tela anuncia, e em retrato a interface volta ao topo
  useEffect(() => {
    titulo.current?.focus()
  }, [passo])

  const etapa = caso.etapas[passo]
  const { criticasCertas } = resultadoDoCaso(caso, respostas)
  const momento = passo === -1 ? 'chegada' : !etapa || etapa.tipo === 'retorno' ? 'retorno' : 'atendimento'
  const responder = (r: Resposta) => setRespostas((rs) => rs.with(passo, r))
  const seguir = () => {
    if (passo + 1 === caso.etapas.length) concluir(resultadoDoCaso(caso, respostas))
    if (caso.etapas[passo + 1]?.tipo === 'retorno' && caso.cenario === 'consultorio') tocar('porta')
    setVendoProntuario(false)
    setPasso(passo + 1)
  }
  const comum = { caso, responder, seguir }

  let conteudo
  if (!etapa)
    conteudo =
      passo === -1 ? (
        <>
          <section className="caixa" aria-label="Ficha do paciente">
            <span className="rotulo">Paciente</span>
            <p>
              <strong>{caso.paciente.nome}</strong> · {ficha(caso)}
            </p>
          </section>
          <Fala quem={caso.tutor.nome}>{caso.chegada}</Fala>
          <Seguir seguir={seguir} texto="Atender" />
        </>
      ) : (
        <Resultado caso={caso} respostas={respostas} proximo={proximo} sair={sair} />
      )
  else {
    const r = respostas[passo]
    switch (etapa.tipo) {
      case 'coleta':
        conteudo = <Coleta {...comum} etapa={etapa} resposta={r?.tipo === 'coleta' ? r : undefined} />
        break
      case 'escolha':
        conteudo = (
          <>
            {etapa.quem === 'prontuario' && <Prontuario caso={caso} respostas={respostas} />}
            <Escolha {...comum} etapa={etapa} resposta={r?.tipo === 'escolha' ? r : undefined} />
          </>
        )
        break
      case 'calculo':
        conteudo = <Calculo {...comum} etapa={etapa} resposta={r?.tipo === 'calculo' ? r : undefined} />
        break
      case 'receita':
        conteudo = <Receita {...comum} etapa={etapa} resposta={r?.tipo === 'receita' ? r : undefined} />
        break
      case 'retorno':
        conteudo = <Retorno caso={caso} etapa={etapa} bom={criticasCertas} seguir={seguir} />
    }
  }

  return (
    <Palco
      cena={
        <Cena
          caso={caso}
          momento={momento}
          bom={criticasCertas}
          preceptora={etapa?.tipo === 'escolha' && etapa.quem === 'preceptora'}
        />
      }
    >
      <header className="cabecalho">
        <p className="contexto">{contexto}</p>
        <p className="etapa-atual" ref={titulo} tabIndex={-1}>
          {etapa ? `${etapa.titulo} · ${passo + 1}/${caso.etapas.length}` : passo === -1 ? 'Chegada' : 'Resultado'}
        </p>
        <div className="acoes">
          {passo >= 0 && (
            <button type="button" aria-pressed={vendoProntuario} onClick={() => setVendoProntuario(!vendoProntuario)}>
              Prontuário
            </button>
          )}
          <BotaoMudo />
          <button type="button" onClick={sair}>
            Sair
          </button>
        </div>
      </header>
      {vendoProntuario && <Prontuario caso={caso} respostas={respostas} fechar={() => setVendoProntuario(false)} />}
      {/* escondida, e não desmontada, para não perder o que ela já marcou na etapa */}
      {/* a key zera o estado da etapa quando duas etapas seguidas são do mesmo tipo */}
      <div className="conteudo" hidden={vendoProntuario} key={passo}>
        {conteudo}
      </div>
    </Palco>
  )
}
