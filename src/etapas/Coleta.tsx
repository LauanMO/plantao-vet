import { useState } from 'react'
import { faltaram } from '../motor/pontuacao'
import { tocar } from '../som/som'
import { Correcao, Fala, Seguir, type PropsEtapa } from './comum'
import { numero } from './texto'

/** Anamnese (perguntas ao tutor), exame físico (ferramentas) ou exames complementares (com orçamento). */
export function Coleta({ caso, etapa, resposta, responder, seguir }: PropsEtapa<'coleta'>) {
  const escolhidos = resposta?.escolhidos ?? []
  const [visto, setVisto] = useState<string>()
  const [concluida, setConcluida] = useState(false)

  const { limite, orcamento = 0 } = etapa
  const exame = etapa.itens.some((it) => it.ferramenta)
  const anamnese = limite !== undefined && !exame
  const gasto = etapa.itens.filter((it) => escolhidos.includes(it.id)).reduce((soma, it) => soma + (it.custo ?? 0), 0)
  const cabe = (custo = 0) => (limite !== undefined ? escolhidos.length < limite : gasto + custo <= orcamento)
  const falta = faltaram(etapa, escolhidos)
  const item = etapa.itens.find((it) => it.id === visto)

  const pergunta =
    limite === undefined
      ? `${caso.cenario === 'consultorio' ? 'Computador' : 'Tablet'}: que exames você pede?`
      : anamnese
        ? 'O que você pergunta?'
        : 'O que você examina?'
  const contador =
    limite === undefined
      ? `Restam R$ ${numero(orcamento - gasto)} de R$ ${numero(orcamento)}`
      : `${anamnese ? 'Perguntas' : 'Ações'} ${escolhidos.length}/${limite}`

  return (
    <>
      {item &&
        (anamnese ? (
          <Fala quem={caso.tutor.nome}>{item.resultado}</Fala>
        ) : (
          <section className="caixa balao" aria-live="polite">
            <span className="rotulo">{item.rotulo}</span>
            <p className="fala">{item.resultado}</p>
          </section>
        ))}
      <section className="caixa" aria-label={etapa.titulo}>
        <div className="topo">
          <h2>{pergunta}</h2>
          <span className="rotulo">{contador}</span>
        </div>
        <div className="opcoes">
          {etapa.itens.map((it) => {
            const feito = escolhidos.includes(it.id)
            return (
              <button
                key={it.id}
                type="button"
                aria-pressed={feito}
                disabled={!feito && (concluida || !cabe(it.custo))}
                onClick={() => {
                  tocar('clique')
                  setVisto(it.id)
                  if (!feito) responder({ tipo: 'coleta', escolhidos: [...escolhidos, it.id] })
                }}
              >
                {it.ferramenta && <img className="icone" src={`arte/icone-${it.ferramenta}.png`} alt="" />}
                {it.rotulo}
                {it.custo !== undefined && <span className="custo">R$ {numero(it.custo)}</span>}
              </button>
            )
          })}
        </div>
      </section>
      {concluida ? (
        <>
          <Correcao certo={falta.length === 0} titulo={falta.length ? 'Faltou' : 'Achou tudo'}>
            {falta.length ? (
              <ul>
                {falta.map((it) => (
                  <li key={it.id}>{it.rotulo}</li>
                ))}
              </ul>
            ) : (
              <p>Você encontrou todos os achados importantes.</p>
            )}
          </Correcao>
          <Seguir seguir={seguir} />
        </>
      ) : (
        <button
          type="button"
          className="principal"
          onClick={() => {
            setConcluida(true)
            tocar(falta.length ? 'erro' : 'acerto')
          }}
        >
          Concluir
        </button>
      )}
    </>
  )
}
