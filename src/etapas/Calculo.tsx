import { useState } from 'react'
import { dentro } from '../motor/pontuacao'
import { tocar } from '../som/som'
import { Correcao, Seguir, type PropsEtapa } from './comum'
import { lerNumero, numero } from './texto'

// shortcut: a calculadora é o teclado numérico do aparelho (inputmode decimal), sem teclas desenhadas
export function Calculo({ etapa, resposta, responder, seguir }: PropsEtapa<'calculo'>) {
  const [texto, setTexto] = useState('')
  const valor = lerNumero(texto)
  const certo = (v: number) => dentro(v, etapa.resposta, etapa.tolerancia)

  return (
    <>
      <section className="caixa">
        <span className="rotulo">Calculadora</span>
        <h2>{etapa.pergunta}</h2>
      </section>
      <form
        className="caixa linha"
        onSubmit={(ev) => {
          ev.preventDefault()
          responder({ tipo: 'calculo', valor })
          tocar(certo(valor) ? 'acerto' : 'erro')
        }}
      >
        <label className="linha">
          Sua resposta
          <input
            inputMode="decimal"
            autoComplete="off"
            value={texto}
            disabled={!!resposta}
            onChange={(ev) => setTexto(ev.target.value)}
          />
          {etapa.unidade}
        </label>
        {!resposta && (
          <button type="submit" className="principal" disabled={Number.isNaN(valor)}>
            Conferir
          </button>
        )}
      </form>
      {resposta && (
        <>
          <Correcao certo={certo(resposta.valor)}>
            <p>
              <strong>
                Resposta: {numero(etapa.resposta)} {etapa.unidade}.
              </strong>{' '}
              {etapa.explicacao}
            </p>
          </Correcao>
          <Seguir seguir={seguir} />
        </>
      )}
    </>
  )
}
