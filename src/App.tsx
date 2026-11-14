import { useState } from 'react'
import { casos } from './dados/casos'
import type { Caso } from './modelo/caso'
import { Palco, Sprite } from './palco/Palco'
import { tocar } from './som/som'
import { Atendimento } from './telas/Atendimento'

// shortcut: tela inicial provisória, com um botão por caso; a fachada com menu, crachá e modos chega na Fase 4
export default function App() {
  const [caso, setCaso] = useState<Caso>()
  if (caso) return <Atendimento key={caso.id} caso={caso} sair={() => setCaso(undefined)} />

  return (
    <Palco cena={<Sprite src="arte/fachada.png" alt="Fachada da clínica à noite" x={0} y={0} largura={320} altura={180} />}>
      <section className="caixa">
        <h1 className="titulo">Plantão Vet</h1>
        <p>Quem você atende agora?</p>
      </section>
      <div className="opcoes">
        {casos.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              tocar(c.cenario === 'consultorio' ? 'porta' : 'clique')
              setCaso(c)
            }}
          >
            Atender {c.paciente.nome} ({c.paciente.especie}, {c.cenario === 'consultorio' ? 'consultório' : 'campo'})
          </button>
        ))}
      </div>
    </Palco>
  )
}
