import { useSyncExternalStore } from 'react'
import { definirMudo, estaMudo, ouvirMudo } from '../som/som'
import { NaFachada } from './Fachada'

interface PropsConfiguracoes {
  nome: string
  mudarNome: (nome: string) => void
  voltar: () => void
}

/** O nome do crachá, que vai junto com o progresso, e o som, que é do aparelho. */
export function Configuracoes({ nome, mudarNome, voltar }: PropsConfiguracoes) {
  const mudo = useSyncExternalStore(ouvirMudo, estaMudo)
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
