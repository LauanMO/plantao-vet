import { useRef, useState } from 'react'
import { casos, materias } from '../dados/casos'
import { lerProgresso } from '../dados/progresso'
import type { Progresso } from '../modelo/progresso'
import { NaFachada } from './Fachada'
import { TemasEmRevisao } from './FimDoPlantao'

const materiaDoCaso = new Map(casos.map((c) => [c.id, c.materia]))

interface PropsProgresso {
  progresso: Progresso
  trocar: (p: Progresso) => void
  voltar: () => void
}

/** Acertos por matéria, temas em revisão e o backup em arquivo, porque o navegador pode apagar o que fica salvo. */
export function TelaDeProgresso({ progresso, trocar, voltar }: PropsProgresso) {
  const arquivo = useRef<HTMLInputElement>(null)
  const [aviso, setAviso] = useState('')

  const porMateria = materias
    .map((m) => {
      const jogados = Object.entries(progresso.casos).filter(([id]) => materiaDoCaso.get(id) === m.id)
      return { nome: m.nome, vezes: jogados.reduce((s, [, c]) => s + c.vezes, 0), acertos: jogados.reduce((s, [, c]) => s + c.acertos, 0) }
    })
    .filter((m) => m.vezes > 0)

  const baixar = () => {
    const a = document.createElement('a')
    // não revoga a URL: num clique só, o Safari pode cancelar o download; são poucos KB até recarregar
    a.href = URL.createObjectURL(new Blob([JSON.stringify(progresso, null, 2)], { type: 'application/json' }))
    // sv-SE dá a data como AAAA-MM-DD, no fuso do aparelho
    a.download = `plantao-vet-backup-${new Date().toLocaleDateString('sv-SE')}.json`
    a.click()
  }

  const abrir = async (escolhido: File) => {
    const lido = lerProgresso(await escolhido.text())
    if (!lido) return setAviso('Esse arquivo não é um backup do Plantão Vet.')
    if (!confirm('Trocar o progresso deste aparelho pelo do backup?')) return
    trocar(lido)
    setAviso(`Backup aberto: ${lido.jogados} ${lido.jogados === 1 ? 'caso jogado' : 'casos jogados'}.`)
  }

  return (
    <NaFachada titulo="Progresso">
      <section className="caixa" aria-label="Acertos por matéria">
        <span className="rotulo">Acertos por matéria</span>
        <p className="nota">
          {progresso.jogados} {progresso.jogados === 1 ? 'caso jogado' : 'casos jogados'}
        </p>
        {porMateria.length > 0 && (
          <ul className="linhas">
            {porMateria.map((m) => (
              <li key={m.nome}>
                <span>{m.nome}</span>
                <span>
                  {m.acertos} de {m.vezes} · {Math.round((m.acertos / m.vezes) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <TemasEmRevisao progresso={progresso} />
      <section className="caixa">
        <span className="rotulo">Backup</span>
        <p>O progresso fica salvo neste aparelho e se perde se os dados do navegador forem apagados. Baixe um backup de vez em quando.</p>
        <div className="opcoes">
          <button type="button" onClick={baixar}>
            Baixar backup
          </button>
          <button type="button" onClick={() => arquivo.current?.click()}>
            Abrir backup
          </button>
        </div>
        <input
          ref={arquivo}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            const escolhido = e.target.files?.[0]
            e.target.value = '' // para dar para abrir o mesmo arquivo de novo
            if (escolhido) void abrir(escolhido)
          }}
        />
        <p role="status">{aviso}</p>
      </section>
      <button type="button" onClick={voltar}>
        Voltar à fachada
      </button>
    </NaFachada>
  )
}
