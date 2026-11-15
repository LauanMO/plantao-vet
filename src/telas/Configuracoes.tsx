import { useSyncExternalStore } from 'react'
import { casos, materias } from '../dados/casos'
import { definirMudo, estaMudo, ouvirMudo } from '../som/som'
import { NaFachada } from './Fachada'

// só dá para marcar as matérias que já têm casos
const COM_CASOS = materias.filter((m) => casos.some((c) => c.materia === m.id))

interface PropsConfiguracoes {
  nome: string
  mudarNome: (nome: string) => void
  /** sem a lista, entram todas */
  materiasDoPlantao?: string[]
  mudarMateriasDoPlantao: (ids: string[]) => void
  voltar: () => void
}

/** O nome do crachá e as matérias do plantão, que vão junto com o progresso, e o som, que é do aparelho. */
export function Configuracoes({ nome, mudarNome, materiasDoPlantao, mudarMateriasDoPlantao, voltar }: PropsConfiguracoes) {
  const mudo = useSyncExternalStore(ouvirMudo, estaMudo)
  const marcadas = materiasDoPlantao ?? COM_CASOS.map((m) => m.id)
  return (
    <NaFachada titulo="Configurações">
      <section className="caixa">
        <label htmlFor="cracha" className="rotulo">
          Nome no crachá
        </label>
        <input
          id="cracha"
          className="largo"
          value={nome}
          maxLength={40}
          placeholder="Dra. Fulana"
          autoComplete="off"
          onChange={(e) => mudarNome(e.target.value)}
        />
      </section>
      <section className="caixa">
        <span id="rotulo-materias" className="rotulo">
          Matérias do plantão
        </span>
        <div className="opcoes" role="group" aria-labelledby="rotulo-materias">
          {COM_CASOS.map((m) => {
            const marcada = marcadas.includes(m.id)
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={marcada}
                // a última marcada não sai: o plantão precisa de pelo menos uma matéria
                disabled={marcada && marcadas.length === 1}
                onClick={() => mudarMateriasDoPlantao(marcada ? marcadas.filter((id) => id !== m.id) : [...marcadas, m.id])}
              >
                {m.nome}
              </button>
            )
          })}
        </div>
      </section>
      <section className="caixa">
        <span id="rotulo-som" className="rotulo">
          Som
        </span>
        <button type="button" className="largo" role="switch" aria-checked={!mudo} aria-labelledby="rotulo-som" onClick={() => definirMudo(!mudo)}>
          {mudo ? 'Desligado' : 'Ligado'}
        </button>
      </section>
      <button type="button" onClick={voltar}>
        Voltar à fachada
      </button>
    </NaFachada>
  )
}
