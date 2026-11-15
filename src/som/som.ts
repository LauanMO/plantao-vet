// Efeitos 8 bits sintetizados com Web Audio: cada som é uma sequência de notas, sem arquivo de áudio.

interface Nota {
  freq: number
  /** frequência no fim da nota, para os sons que deslizam */
  ate?: number
  /** segundos */
  dur: number
  onda?: OscillatorType
}

const SONS = {
  clique: [{ freq: 880, dur: 0.03 }],
  porta: [
    { freq: 300, ate: 180, dur: 0.22, onda: 'sawtooth' },
    { freq: 90, dur: 0.06 },
  ],
  carimbo: [{ freq: 160, ate: 45, dur: 0.12 }],
  acerto: [
    { freq: 523, dur: 0.08 },
    { freq: 659, dur: 0.08 },
    { freq: 784, dur: 0.16 },
  ],
  erro: [
    { freq: 196, dur: 0.12 },
    { freq: 147, dur: 0.22 },
  ],
} satisfies Record<string, Nota[]>

export type Som = keyof typeof SONS

const VOLUME = 0.15
const CHAVE_MUDO = 'plantao-vet:mudo'
let contexto: AudioContext | undefined
let mudo = lerMudo()
/** o atalho do canto e as configurações mostram o mesmo mudo */
const ouvintes = new Set<() => void>()

function lerMudo() {
  try {
    return localStorage.getItem(CHAVE_MUDO) === 'sim'
  } catch {
    return false // sem localStorage, o som começa ligado, como o padrão
  }
}

// O navegador só libera o áudio depois de um toque ou tecla, e o iPhone suspende o áudio quando a aba
// sai de cena; por isso cada gesto cria ou retoma o contexto. Em captura, roda antes do clique do botão.
function destravar() {
  contexto ??= new AudioContext()
  if (contexto.state !== 'running') void contexto.resume()
}
for (const evento of ['click', 'keydown']) window.addEventListener(evento, destravar, { capture: true })

export function definirMudo(valor: boolean) {
  mudo = valor
  try {
    localStorage.setItem(CHAVE_MUDO, valor ? 'sim' : 'nao')
  } catch {
    // sem localStorage, o mudo vale só até recarregar
  }
  for (const avisar of ouvintes) avisar()
}

export const estaMudo = () => mudo

/** Para o useSyncExternalStore: avisa quando o mudo muda. */
export function ouvirMudo(avisar: () => void) {
  ouvintes.add(avisar)
  return () => {
    ouvintes.delete(avisar)
  }
}

export function tocar(som: Som) {
  if (mudo || !contexto) return
  const notas: Nota[] = SONS[som]
  let t = contexto.currentTime
  for (const { freq, ate = freq, dur, onda = 'square' } of notas) {
    const osc = contexto.createOscillator()
    const ganho = contexto.createGain()
    osc.type = onda
    osc.frequency.setValueAtTime(freq, t)
    osc.frequency.exponentialRampToValueAtTime(ate, t + dur)
    ganho.gain.setValueAtTime(VOLUME, t)
    ganho.gain.exponentialRampToValueAtTime(0.001, t + dur)
    osc.connect(ganho).connect(contexto.destination)
    osc.start(t)
    osc.stop(t + dur)
    t += dur
  }
}
