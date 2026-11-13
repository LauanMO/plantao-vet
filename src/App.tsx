import { useState } from 'react'
import mimosaJson from '../conteudo/casos/clinica-geral/clin-hipocalcemia-01.json'
import pipocaJson from '../conteudo/casos/clinica-geral/clin-parvovirose-01.json'
import { FERRAMENTAS, casoSchema } from './modelo/caso'
import { Palco, Personagem, Sprite } from './palco/Palco'
import { definirMudo, tocar, type Som } from './som/som'

// Tela de teste da Fase 2: o que os dois casos de teste usam, já pelo manifesto, mais os sons.
// As posições são do pé de cada personagem, em pixels de arte.
const CENAS = [
  { caso: casoSchema.parse(pipocaJson), fundo: 'consultorio', tutor: [100, 128], paciente: [158, 102], preceptora: [222, 128] },
  { caso: casoSchema.parse(mimosaJson), fundo: 'curral', tutor: [84, 140], paciente: [152, 146], preceptora: [234, 146] },
] as const
const SONS: Som[] = ['clique', 'porta', 'carimbo', 'acerto', 'erro']

export default function App() {
  const [qual, setQual] = useState(0)
  const [recuperado, setRecuperado] = useState(false)
  const [mudo, setMudo] = useState(false)
  const { caso, fundo, tutor, paciente, preceptora } = CENAS[qual]
  const outro = CENAS[1 - qual].caso.paciente.nome
  const estado = recuperado ? 'feliz' : caso.paciente.postura === 'deitado' ? 'deitado' : 'doente'

  return (
    <Palco
      cena={
        <>
          <Sprite src={`arte/${fundo}.png`} alt="" x={0} y={0} largura={320} altura={180} />
          <Personagem id={caso.tutor.sprite} estado="parado" alt={`${caso.tutor.nome} em pé`} x={tutor[0]} y={tutor[1]} />
          <Personagem
            id={caso.paciente.sprite}
            estado={estado}
            alt={`${caso.paciente.nome} ${recuperado ? 'recuperada' : 'doente'}`}
            x={paciente[0]}
            y={paciente[1]}
          />
          <Personagem id="preceptora" estado="parado" alt="Preceptora de jaleco" x={preceptora[0]} y={preceptora[1]} />
          {FERRAMENTAS.map((f, i) => (
            <Sprite key={f} src={`arte/icone-${f}.png`} alt="" x={115 + i * 20} y={156} largura={18} altura={18} />
          ))}
        </>
      }
    >
      <section className="caixa" aria-live="polite" aria-label={`Fala de ${caso.tutor.nome}`}>
        <span className="rotulo">{caso.tutor.nome}</span>
        <p className="fala">“{caso.chegada}”</p>
      </section>
      <div className="opcoes">
        <button
          type="button"
          onClick={() => {
            setQual(1 - qual)
            setRecuperado(false)
          }}
        >
          Ver {outro}
        </button>
        <button type="button" aria-pressed={recuperado} onClick={() => setRecuperado(!recuperado)}>
          {caso.paciente.nome} recuperada
        </button>
        <button
          type="button"
          aria-pressed={mudo}
          onClick={() => {
            definirMudo(!mudo)
            setMudo(!mudo)
          }}
        >
          Mudo
        </button>
        {SONS.map((s) => (
          <button key={s} type="button" onClick={() => tocar(s)}>
            Som: {s}
          </button>
        ))}
      </div>
    </Palco>
  )
}
