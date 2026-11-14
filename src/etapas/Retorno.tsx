import type { Caso } from '../modelo/caso'
import type { EtapaDo } from '../motor/pontuacao'
import { Fala, Seguir } from './comum'

/** O tutor volta com o paciente: melhor se todas as etapas críticas ficaram certas. */
export function Retorno({ caso, etapa, bom, seguir }: { caso: Caso; etapa: EtapaDo<'retorno'>; bom: boolean; seguir: () => void }) {
  return (
    <>
      <Fala quem={caso.tutor.nome}>{bom ? etapa.falaBom : etapa.falaRuim}</Fala>
      <section className="caixa">
        <span className="rotulo">{etapa.titulo}</span>
        <p>{bom ? etapa.bom : etapa.ruim}</p>
      </section>
      <Seguir seguir={seguir} texto="Ver o resultado" />
    </>
  )
}
