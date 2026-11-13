import { useState } from 'react'
import caso from '../conteudo/casos/clinica-geral/clin-parvovirose-01.json'
import { Palco, Sprite } from './palco/Palco'

// Tela de teste da Fase 0: a cena da anamnese com textos reais do caso, para conferir escala e legibilidade.
const perguntas = caso.etapas[0].itens?.slice(0, 4) ?? []

export default function App() {
  const [fala, setFala] = useState(caso.chegada)

  return (
    <Palco
      cena={
        <>
          <Sprite src="arte/consultorio.png" alt="" x={0} y={0} largura={320} altura={180} />
          <Sprite src="arte/tutora-1-parado.png" alt="Tutora em pé ao lado da mesa" x={88} y={66} largura={24} altura={64} />
          <Sprite src="arte/cao-pequeno-caramelo-doente.png" alt="Pipoca abatida em cima da mesa de exame" x={142} y={79} largura={38} altura={26} />
        </>
      }
    >
      <section className="caixa" aria-live="polite" aria-label={`Fala de ${caso.tutor.nome}`}>
        <span className="rotulo">{caso.tutor.nome}</span>
        <p className="fala">“{fala}”</p>
      </section>
      <div className="opcoes">
        {perguntas.map((p) => (
          <button key={p.id} type="button" onClick={() => setFala(p.resultado)}>
            {p.rotulo}
          </button>
        ))}
      </div>
    </Palco>
  )
}
