import { useState, type ReactNode } from 'react'
import { notaDaEtapa, partesDaReceita, quantidadeCerta } from '../motor/pontuacao'
import { tocar } from '../som/som'
import { Correcao, Seguir, type PropsEtapa } from './comum'
import { lerNumero, numero } from './texto'

/** Receituário: fármaco da gaveta (ou da maleta, no campo), quantidade por aplicação, via e frequência. */
export function Receita({ caso, etapa, resposta, responder, seguir }: PropsEtapa<'receita'>) {
  const [farmaco, setFarmaco] = useState<string>()
  const [texto, setTexto] = useState('')
  const [via, setVia] = useState<string>()
  const [frequencia, setFrequencia] = useState<string>()

  const peso = caso.paciente.pesoKg
  const quantidade = lerNumero(texto)
  const escolhido = etapa.farmacos.find((f) => f.id === farmaco)
  const certo = etapa.farmacos.find((f) => f.id === etapa.correto.farmaco)!
  const assinada = resposta !== undefined
  const nota = resposta ? notaDaEtapa(etapa, peso, resposta)! : 0

  // um grupo de botões em que só um fica marcado
  const grupo = (titulo: string, opcoes: { valor: string; texto: ReactNode }[], atual: string | undefined, escolher: (v: string) => void) => (
    <section className="caixa" role="group" aria-label={titulo}>
      <span className="rotulo">{titulo}</span>
      <div className="opcoes">
        {opcoes.map((o) => (
          <button
            key={o.valor}
            type="button"
            aria-pressed={o.valor === atual}
            disabled={assinada}
            onClick={() => {
              tocar('clique')
              escolher(o.valor)
            }}
          >
            <span>{o.texto}</span>
          </button>
        ))}
      </div>
    </section>
  )

  return (
    <>
      <section className="caixa">
        <span className="rotulo">Receituário</span>
        <h2>{etapa.instrucao}</h2>
      </section>
      {grupo(
        caso.cenario === 'consultorio' ? 'Gaveta de fármacos' : 'Maleta de fármacos',
        etapa.farmacos.map((f) => ({
          valor: f.id,
          texto: (
            <>
              <strong>{f.nome}</strong> <span className="detalhe">{f.apresentacao}</span>
            </>
          ),
        })),
        farmaco,
        setFarmaco,
      )}
      <section className="caixa">
        <label className="linha">
          Quantidade por aplicação
          <input
            inputMode="decimal"
            autoComplete="off"
            value={texto}
            disabled={assinada}
            onChange={(ev) => setTexto(ev.target.value)}
          />
          {escolhido?.unidade}
        </label>
      </section>
      {grupo('Via', etapa.vias.map((v) => ({ valor: v, texto: v })), via, setVia)}
      {grupo('Frequência', etapa.frequencias.map((f) => ({ valor: f, texto: f })), frequencia, setFrequencia)}
      {!resposta && (
        <button
          type="button"
          className="principal"
          disabled={!farmaco || Number.isNaN(quantidade) || !via || !frequencia}
          onClick={() => {
            responder({ tipo: 'receita', farmaco: farmaco!, quantidade, via: via!, frequencia: frequencia! })
            tocar('carimbo')
          }}
        >
          Assinar a receita
        </button>
      )}
      {resposta && escolhido && (
        <Correcao certo={nota === 1} titulo={`Receita ${Math.round(nota * 100)}%`}>
          <ul>
            {Object.entries(partesDaReceita(etapa, peso, resposta)).map(([parte, ok]) => (
              <li key={parte}>
                {ok ? '✓' : '✗'} {NOMES_DAS_PARTES[parte as keyof typeof NOMES_DAS_PARTES]}
              </li>
            ))}
          </ul>
          <p>
            <strong>Receita certa:</strong> {certo.nome} · {numero(quantidadeCerta(etapa, peso))} {certo.unidade} por aplicação ·{' '}
            {etapa.correto.via} · {etapa.correto.frequencia}
          </p>
          <p>{etapa.explicacao}</p>
          {escolhido !== certo && (
            <p>
              <strong>{escolhido.nome}:</strong> {escolhido.explicacao}
            </p>
          )}
        </Correcao>
      )}
      {resposta && <Seguir seguir={seguir} />}
    </>
  )
}

const NOMES_DAS_PARTES = { farmaco: 'Fármaco', dose: 'Dose', via: 'Via', frequencia: 'Frequência' }
