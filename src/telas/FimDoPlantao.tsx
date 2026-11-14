import { casos, materias } from '../dados/casos'
import { Estrelas } from '../etapas/comum'
import type { Caso } from '../modelo/caso'
import type { ResultadoCaso } from '../motor/pontuacao'
import { chaveDoTema, type Progresso } from '../motor/repeticao'
import { NaFachada } from './Fachada'

export interface Paciente {
  caso: Caso
  revisao: boolean
  /** undefined até ela terminar o caso */
  resultado?: ResultadoCaso
}

/** Resumo do turno: a nota de cada paciente, quantos ela acertou e os temas que estão em revisão. */
export function FimDoPlantao({ turno, progresso, novo, voltar }: { turno: Paciente[]; progresso: Progresso; novo: () => void; voltar: () => void }) {
  const acertados = turno.filter((p) => p.resultado?.acertou).length
  // o nome do tema vem dos casos, porque a chave guarda só o slug
  const nomes = new Map(casos.map((c) => [chaveDoTema(c), `${materias.find((m) => m.id === c.materia)?.nome}: ${c.tema}`]))
  const emRevisao = Object.entries(progresso.temas).filter(([, t]) => t.emRevisao).map(([chave]) => nomes.get(chave) ?? chave)

  return (
    <NaFachada titulo="Fim do plantão">
      <section className="caixa" aria-label="Resumo do plantão">
        <span className="rotulo">Plantão encerrado</span>
        <p className="nota">
          {acertados} de {turno.length} casos acertados
        </p>
        <ul className="linhas">
          {turno.map((p, i) => (
            <li key={i}>
              <span>
                {i + 1}. {p.caso.paciente.nome}
                {p.revisao && ' (revisão)'}
              </span>
              {p.resultado && (
                <span>
                  <Estrelas quantas={p.resultado.estrelas} /> {Math.round(p.resultado.nota * 100)}%
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
      <section className="caixa">
        <span className="rotulo">Temas em revisão</span>
        {emRevisao.length === 0 ? (
          <p>Nenhum. Os temas que você errar voltam nos próximos plantões.</p>
        ) : (
          <ul>
            {emRevisao.map((nome) => (
              <li key={nome}>{nome}</li>
            ))}
          </ul>
        )}
      </section>
      <button type="button" className="principal" onClick={novo}>
        Novo plantão
      </button>
      <button type="button" onClick={voltar}>
        Voltar à fachada
      </button>
    </NaFachada>
  )
}
