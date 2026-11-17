import { useEffect, useRef, useState } from 'react'
import { bulasPorClasse } from '../dados/bulario'
import type { Bula } from '../modelo/bula'
import { NaFachada } from './Fachada'

/** O texto de uma bula: o que o fármaco faz, para que serve e os cuidados. O foco vai para o nome ao abrir. */
export function FichaDaBula({ bula }: { bula: Bula }) {
  const nome = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    nome.current?.focus()
  }, [bula])

  const lista = (titulo: string, itens: string[]) => (
    <>
      <h3>{titulo}</h3>
      <ul>
        {itens.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </>
  )

  return (
    <section className="caixa" aria-label={`Bula de ${bula.nome}`}>
      <span className="rotulo">{bula.classe}</span>
      <h2 ref={nome} tabIndex={-1}>
        {bula.nome}
      </h2>
      {!bula.revisado && <p className="detalhe">Em revisão: esta bula ainda não foi conferida.</p>}
      <h3>Como age</h3>
      <p>{bula.comoAge}</p>
      {lista('Para que serve', bula.paraQueServe)}
      {lista('Efeitos adversos', bula.efeitosAdversos)}
      {lista('Cuidados e contraindicações', bula.cuidados)}
      {lista('Referências', bula.referencias)}
    </section>
  )
}

/** O bulário da clínica: as bulas por classe, e uma de cada vez aberta. */
export function Bulario({ voltar }: { voltar: () => void }) {
  const [aberta, setAberta] = useState<Bula>()
  const [ultima, setUltima] = useState<string>()
  // ao fechar a bula, o foco volta para o botão dela na lista
  useEffect(() => {
    if (!aberta && ultima) document.querySelector<HTMLElement>(`[data-bula="${ultima}"]`)?.focus()
  }, [aberta, ultima])

  if (aberta)
    return (
      <NaFachada titulo="Bulário">
        <FichaDaBula bula={aberta} />
        <button type="button" onClick={() => setAberta(undefined)}>
          Voltar ao bulário
        </button>
      </NaFachada>
    )

  return (
    <NaFachada titulo="Bulário">
      <section className="caixa">
        <h2>O que cada remédio faz</h2>
        <p>Como age, para que serve, efeitos adversos e cuidados. As doses ficam para a conta da receita.</p>
      </section>
      {bulasPorClasse.map(({ classe, bulas }) => (
        <section key={classe} className="caixa" aria-label={classe}>
          <span className="rotulo">{classe}</span>
          <div className="opcoes">
            {bulas.map((b) => (
              <button
                key={b.id}
                type="button"
                data-bula={b.id}
                onClick={() => {
                  setUltima(b.id)
                  setAberta(b)
                }}
              >
                <span>
                  <strong>{b.nome}</strong>
                  {!b.revisado && <span className="detalhe"> · em revisão</span>}
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
      <button type="button" onClick={voltar}>
        Voltar à fachada
      </button>
    </NaFachada>
  )
}
