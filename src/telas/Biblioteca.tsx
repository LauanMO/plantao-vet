import { casos, materias } from '../dados/casos'
import type { Caso } from '../modelo/caso'
import type { Progresso } from '../motor/repeticao'
import { NaFachada } from './Fachada'

/** Arquivo de prontuários: qualquer caso, na hora, sem regra de sorteio. */
export function Biblioteca({ progresso, abrir, voltar }: { progresso: Progresso; abrir: (c: Caso) => void; voltar: () => void }) {
  return (
    <NaFachada titulo="Arquivo de prontuários">
      {materias.map((m) => {
        const daMateria = casos.filter((c) => c.materia === m.id)
        if (daMateria.length === 0) return null
        return (
          <section key={m.id} className="caixa" aria-label={m.nome}>
            <span className="rotulo">{m.nome}</span>
            <div className="opcoes">
              {daMateria.map((c) => {
                const jogado = progresso.casos[c.id]
                return (
                  <button key={c.id} type="button" onClick={() => abrir(c)}>
                    <span>
                      <strong>{c.paciente.nome}</strong> <span className="detalhe">{c.paciente.especie} · {c.tema}</span>
                      {jogado && (
                        <span className="detalhe">
                          {' '}
                          · jogado {jogado.vezes}× · última nota {Math.round(jogado.ultimaNota * 100)}%
                        </span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}
      <button type="button" onClick={voltar}>
        Voltar à fachada
      </button>
    </NaFachada>
  )
}
