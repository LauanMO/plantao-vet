import type { ReactNode } from 'react'
import type { Caso } from '../modelo/caso'
import type { EtapaDo, RespostaDo } from '../motor/pontuacao'
import { tocar } from '../som/som'

export type TipoPontuado = 'coleta' | 'escolha' | 'calculo' | 'receita'

export interface PropsEtapa<T extends TipoPontuado> {
  caso: Caso
  etapa: EtapaDo<T>
  /** undefined até ela responder; na coleta, cresce a cada item */
  resposta: RespostaDo<T> | undefined
  responder: (r: RespostaDo<T>) => void
  seguir: () => void
}

export function Fala({ quem, children }: { quem: string; children: ReactNode }) {
  return (
    <section className="caixa balao" aria-live="polite" aria-label={`Fala de ${quem}`}>
      <span className="rotulo">{quem}</span>
      <p className="fala">“{children}”</p>
    </section>
  )
}

/** A correção que aparece na hora, logo depois da resposta. */
export function Correcao({ certo, titulo, children }: { certo: boolean; titulo?: string; children: ReactNode }) {
  return (
    <section className={certo ? 'caixa correcao' : 'caixa correcao errou'} role="status">
      <span className="rotulo">{titulo ?? (certo ? 'Certo!' : 'Não é isso')}</span>
      {children}
    </section>
  )
}

export function Seguir({ seguir, texto = 'Seguir' }: { seguir: () => void; texto?: string }) {
  return (
    <button
      type="button"
      className="principal"
      onClick={() => {
        tocar('clique')
        seguir()
      }}
    >
      {texto}
    </button>
  )
}
