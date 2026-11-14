import { numero } from '../etapas/texto'
import type { Caso } from '../modelo/caso'
import { faltaram, importantes, resultadoDoCaso, type Resposta } from '../motor/pontuacao'

const escolhidos = (r: Resposta | undefined) => (r?.tipo === 'coleta' ? r.escolhidos : [])

/** Painel de nota: estrelas, cada etapa, o que faltou e o resumo do caso. */
export function Resultado({ caso, respostas, sair }: { caso: Caso; respostas: (Resposta | undefined)[]; sair: () => void }) {
  const r = resultadoDoCaso(caso, respostas)
  const linhas = caso.etapas.flatMap((etapa, i) => {
    const nota = r.notas[i]
    if (nota === null) return []
    let valor = nota === 1 ? 'certo' : 'errado'
    if (etapa.tipo === 'receita') valor = `${Math.round(nota * 100)}%`
    if (etapa.tipo === 'coleta') {
      const total = importantes(etapa).length
      valor = `${total - faltaram(etapa, escolhidos(respostas[i])).length} de ${total}`
    }
    return [{ titulo: etapa.titulo, valor }]
  })
  const faltou = caso.etapas.flatMap((etapa, i) => (etapa.tipo === 'coleta' ? faltaram(etapa, escolhidos(respostas[i])) : []))

  return (
    <>
      <section className="caixa" aria-label="Resultado do caso">
        <span className="rotulo">Caso concluído</span>
        <p className="nota">
          <span className="estrelas" role="img" aria-label={`${r.estrelas} de 3 estrelas`}>
            {'★'.repeat(r.estrelas) + '☆'.repeat(3 - r.estrelas)}
          </span>{' '}
          {numero(Math.round(r.nota * 100))}%
        </p>
        <p>
          {r.acertou
            ? 'Caso acertado.'
            : r.criticasCertas
              ? 'Caso para revisar: a nota ficou abaixo de 70%.'
              : 'Caso para revisar: alguma etapa crítica não ficou certa.'}
        </p>
        <ul className="linhas">
          {linhas.map((l) => (
            <li key={l.titulo}>
              <span>{l.titulo}</span> <span>{l.valor}</span>
            </li>
          ))}
        </ul>
      </section>
      {faltou.length > 0 && (
        <section className="caixa">
          <span className="rotulo">Para a próxima</span>
          <p>Faltou:</p>
          <ul>
            {faltou.map((it, i) => (
              // o mesmo id pode aparecer em duas coletas do caso
              <li key={i}>{it.rotulo}</li>
            ))}
          </ul>
        </section>
      )}
      <section className="caixa">
        <span className="rotulo">Resumo do caso</span>
        <ul>
          {caso.resumo.map((linha) => (
            <li key={linha}>{linha}</li>
          ))}
        </ul>
        <h3>Referências</h3>
        <ul>
          {caso.referencias.map((ref) => (
            <li key={ref}>{ref}</li>
          ))}
        </ul>
      </section>
      <button type="button" className="principal" onClick={sair}>
        Voltar ao início
      </button>
    </>
  )
}
