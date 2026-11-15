import type { Caso } from '../modelo/caso'
import { numero } from '../modelo/validar'

export { numero }

/** Aceita vírgula, como se digita no Brasil; vazio vira NaN. */
export const lerNumero = (texto: string) => (texto.trim() === '' ? NaN : Number(texto.replace(',', '.')))

export const ficha = ({ paciente: p }: Caso) =>
  `${p.especie} · ${p.raca} · ${p.sexo} · ${p.idade} · ${numero(p.pesoKg)} kg`
