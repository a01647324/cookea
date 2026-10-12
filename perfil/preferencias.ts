// preferencias.ts: funciones puras para Perfil y Preferencias.
// "Puras" quiere decir que no llaman a Supabase ni guardan estado: reciben
// datos y regresan un resultado. Así son fáciles de leer y de probar con Jest.

// Estas reglas copian las de la base de datos (tabla perfiles).
// Si se cambian allá, hay que cambiarlas aquí también.
export const ALIAS_MIN = 3;
export const ALIAS_MAX = 30;
export const NOMBRE_MIN = 2;
export const NOMBRE_MAX = 80;
export const PERSONAS_MIN = 1;
export const PERSONAS_MAX = 20;

// Regresa el mensaje de error del alias, o null si está bien.
// Le quitamos los espacios del inicio y del final antes de contar.
export function validarAlias(texto: string): string | null {
  const limpio = texto.trim();
  if (limpio.length < ALIAS_MIN || limpio.length > ALIAS_MAX) {
    return `Tu alias debe tener de ${ALIAS_MIN} a ${ALIAS_MAX} letras.`;
  }
  return null;
}

// Regresa el mensaje de error del nombre, o null si está bien.
export function validarNombre(texto: string): string | null {
  const limpio = texto.trim();
  if (limpio.length < NOMBRE_MIN || limpio.length > NOMBRE_MAX) {
    return `Tu nombre debe tener de ${NOMBRE_MIN} a ${NOMBRE_MAX} letras.`;
  }
  return null;
}

// (nuevo) Compara lo que ya está guardado con lo que la persona marcó ahora,
// y regresa solo lo que hay que agregar y lo que hay que quitar.
// Recorre cada Set una vez: O(n + m) en tiempo y en espacio.
// (nuevo) Set.has() revisa si un id está en el Set en O(1).
export function calcularCambios(
  guardados: Set<number>,
  seleccionados: Set<number>
): { agregar: number[]; quitar: number[] } {
  const agregar: number[] = [];
  const quitar: number[] = [];

  // Marcados ahora que no estaban guardados -> agregar
  for (const id of seleccionados) {
    if (!guardados.has(id)) agregar.push(id);
  }
  // Guardados que ya no están marcados -> quitar
  for (const id of guardados) {
    if (!seleccionados.has(id)) quitar.push(id);
  }

  return { agregar, quitar };
}
