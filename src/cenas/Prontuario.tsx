import { ficha } from '../etapas/texto'
import type { Caso } from '../modelo/caso'
import type { Resposta } from '../motor/pontuacao'

/** Tudo o que ela já descobriu nas coletas, na ordem do caso. */
export function Prontuario({ caso, respostas, fechar }: { caso: Caso; respostas: (Resposta | undefined)[]; fechar?: () => void }) {
  const anotacoes = caso.etapas.flatMap((etapa, i) => {
    const r = respostas[i]
    if (etapa.tipo !== 'coleta' || r?.tipo !== 'coleta' || r.escolhidos.length === 0) return []
    return [{ titulo: etapa.titulo, itens: etapa.itens.filter((it) => r.escolhidos.includes(it.id)) }]
  })

  return (
    <section className="caixa" aria-label={`Prontuário de ${caso.paciente.nome}`}>
      <span className="rotulo">Prontuário</span>
      <p>
        <strong>{caso.paciente.nome}</strong> · {ficha(caso)}
      </p>
      {anotacoes.length === 0 && <p>Nada anotado ainda.</p>}
      {anotacoes.map((a) => (
        <div key={a.titulo}>
          <h3>{a.titulo}</h3>
          <ul>
            {a.itens.map((it) => (
              <li key={it.id}>
                <strong>{it.rotulo}</strong> {it.resultado}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {fechar && (
        <button type="button" className="principal" onClick={fechar}>
          Fechar o prontuário
        </button>
      )}
    </section>
  )
}
