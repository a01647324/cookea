export const LIMITES = {
  busqueda: 60,
  comentario: 500,
  cantidadMax: 100000,
  url: 300,
} as const;

export type Resultado<T> = { ok: true; valor: T } | { ok: false; error: string };

// Caracteres de control (menos tabulador y salto de línea), invisibles de ancho cero y
// marcas que cambian la dirección del texto (se usan para disfrazar texto).
const INVISIBLES =
 
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F​-‏‪-‮⁠-⁤⁦-⁩﻿]/g;

const longitud = (texto: string) => Array.from(texto).length; // cuenta emojis como 1

export function limpiarTexto(texto: string, max: number, opciones: { multilinea?: boolean } = {}): string {
  let t = String(texto ?? '').normalize('NFC').replace(/\r\n?/g, '\n').replace(INVISIBLES, '');

  if (opciones.multilinea) {
    t = t
      .replace(/[^\S\n]+/g, ' ')
      .replace(/ ?\n ?/g, '\n')
      .replace(/\n{3,}/g, '\n\n');
  } else {
    t = t.replace(/\s+/g, ' ');
  }

  t = t.trim();

  return Array.from(t).slice(0, max).join('').trim();
}

export function limpiarBusqueda(texto: string): string {
  const base = limpiarTexto(texto, LIMITES.busqueda);
  return base.replace(/[%_*\\,()]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function validarComentario(texto: string): Resultado<string> {
  const limpio = limpiarTexto(texto, LIMITES.comentario, { multilinea: true });
  if (limpio.length === 0) return { ok: false, error: 'Escribe un comentario.' };
  return { ok: true, valor: limpio };
}

export function validarTextoLibre(
  texto: string,
  campo: string,
  min: number,
  max: number,
  opciones: { multilinea?: boolean } = {}
): Resultado<string> {
  const limpio = limpiarTexto(texto, max, opciones);
  const n = longitud(limpio);
  if (n < min) {
    return { ok: false, error: min <= 1 ? `Escribe ${campo}.` : `${campo} debe tener al menos ${min} caracteres.` };
  }
  return { ok: true, valor: limpio };
}

export function validarCantidad(entrada: string | number, opciones: { max?: number } = {}): Resultado<number> {
  const max = opciones.max ?? LIMITES.cantidadMax;

  let texto: string;
  if (typeof entrada === 'number') {
    if (!Number.isFinite(entrada)) return { ok: false, error: 'Escribe una cantidad válida.' };
    texto = String(Math.round(entrada * 100) / 100);
  } else {
    texto = String(entrada ?? '').trim();
  }

  if (!/^\d{1,7}([.,]\d{1,2})?$/.test(texto)) {
    return { ok: false, error: 'Escribe una cantidad válida, por ejemplo 2 o 1.5.' };
  }
  const valor = Number(texto.replace(',', '.'));
  if (valor <= 0) return { ok: false, error: 'La cantidad debe ser mayor que 0.' };
  if (valor > max) return { ok: false, error: 'Esa cantidad es demasiado grande.' };
  return { ok: true, valor };
}

export function esEnlaceVideoSeguro(url: string | null | undefined): boolean {
  if (!url || url.length > LIMITES.url) return false;
  return /^https:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\/[^\s]*$/i.test(url.trim());
}