import type { Caso } from '../modelo/caso'
import { Personagem, Sprite } from '../palco/Palco'

// Onde fica o pé de cada um, em pixels de arte, dentro da faixa x 70 a 250 que sempre aparece.
// O tutor entra pela porta do consultório (x 48 a 88) ou pela esquerda do curral.
const LUGARES = {
  consultorio: { fundo: 'consultorio', tutor: [100, 128], paciente: [158, 102], preceptora: [222, 128], entraDe: -32 },
  campo: { fundo: 'curral', tutor: [84, 140], paciente: [152, 146], preceptora: [234, 146], entraDe: -96 },
} as const

export type Momento = 'chegada' | 'atendimento' | 'retorno'

interface PropsCena {
  caso: Caso
  momento: Momento
  /** no retorno, o paciente volta melhor */
  bom: boolean
  preceptora: boolean
}

export function Cena({ caso, momento, bom, preceptora }: PropsCena) {
  const l = LUGARES[caso.cenario]
  const { paciente, tutor } = caso
  const deitado = paciente.postura === 'deitado'
  const melhor = momento === 'retorno' && bom
  // a porta fica aberta enquanto o tutor entra, na chegada e no retorno
  const fundo = caso.cenario === 'consultorio' && momento !== 'atendimento' ? 'consultorio-porta-aberta' : l.fundo
  // trocar a key no retorno faz o tutor e o paciente entrarem de novo
  const vez = momento === 'retorno' ? 'retorno' : 'ida'

  return (
    <>
      <Sprite src={`arte/${fundo}.png`} alt="" x={0} y={0} largura={320} altura={180} />
      <Personagem key={`tutor-${vez}`} id={tutor.sprite} estado="parado" alt={tutor.nome} x={l.tutor[0]} y={l.tutor[1]} entraDe={l.entraDe} />
      <Personagem
        key={`paciente-${vez}`}
        id={paciente.sprite}
        estado={melhor ? 'feliz' : deitado ? 'deitado' : 'doente'}
        alt={`${paciente.nome}, ${melhor ? 'já melhor' : 'doente'}`}
        x={l.paciente[0]}
        y={l.paciente[1]}
        // deitado, o paciente já está no lugar; em pé, entra junto com o tutor
        entraDe={deitado ? undefined : l.entraDe}
      />
      {preceptora && (
        <Personagem id="preceptora" estado="parado" alt="Preceptora" x={l.preceptora[0]} y={l.preceptora[1]} entraDe={100} />
      )}
    </>
  )
}
