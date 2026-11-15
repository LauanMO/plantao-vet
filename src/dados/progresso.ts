import { progressoSchema, type Progresso } from '../modelo/progresso.ts'
import { progressoVazio } from '../motor/repeticao.ts'

const CHAVE = 'plantao-vet:progresso:v1'

/** Lê o progresso salvo ou um arquivo de backup; undefined quando não é um progresso do jogo. */
export function lerProgresso(texto: string): Progresso | undefined {
  try {
    const lido = progressoSchema.safeParse(JSON.parse(texto))
    return lido.success ? lido.data : undefined
  } catch {
    return undefined // não é JSON
  }
}

export function carregarProgresso(): Progresso {
  try {
    const texto = localStorage.getItem(CHAVE)
    if (texto === null) return progressoVazio()
    const progresso = lerProgresso(texto)
    if (progresso) return progresso
    // um progresso estragado não se perde: fica guardado ao lado, e o jogo começa do zero
    localStorage.setItem(`${CHAVE}:estragado`, texto)
  } catch {
    // sem localStorage (navegação privada ou dados bloqueados): o progresso fica só na memória
  }
  return progressoVazio()
}

export function salvarProgresso(progresso: Progresso) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(progresso))
  } catch {
    // sem localStorage: o jogo segue com o progresso na memória
  }
}
