import { casos, materias, type Materia } from '../dados/casos'
import type { Progresso } from '../motor/repeticao'
import { NaFachada } from './Fachada'

const quantos = (m: Materia) => casos.filter((c) => c.materia === m.id).length
// as matérias que já têm casos vêm primeiro, para não ficarem no fim da lista no celular
const ORDEM = materias.toSorted((a, b) => Number(quantos(b) > 0) - Number(quantos(a) > 0))

/** Quadro de avisos: um cartão por matéria; os casos vêm em sequência até ela sair. */
export function QuadroDeAvisos({ progresso, estudar, voltar }: { progresso: Progresso; estudar: (m: Materia) => void; voltar: () => void }) {
  return (
    <NaFachada titulo="Quadro de avisos">
      <section className="caixa">
        <h2>Que matéria você quer estudar?</h2>
        <p>Os casos vêm por tema, com os temas que você errou primeiro.</p>
      </section>
      <div className="opcoes">
        {ORDEM.map((m) => {
          const n = quantos(m)
          const emRevisao = Object.entries(progresso.temas).filter(([chave, t]) => chave.startsWith(`${m.id}/`) && t.emRevisao).length
          return (
            <button key={m.id} type="button" disabled={n === 0} onClick={() => estudar(m)}>
              <span>
                <strong>{m.nome}</strong>{' '}
                <span className="detalhe">
                  {n === 0 ? 'sem casos ainda' : `${n} ${n === 1 ? 'caso' : 'casos'}`}
                  {emRevisao > 0 && ` · ${emRevisao} em revisão`}
                </span>
              </span>
            </button>
          )
        })}
      </div>
      <button type="button" onClick={voltar}>
        Voltar à fachada
      </button>
    </NaFachada>
  )
}
