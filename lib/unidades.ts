export type UnidadBD = 'g' | 'ml' | 'pieza';
export type UnidadUI = 'pza' | 'g' | 'kg' | 'ml' | 'l';

export function opcionesUnidad(base: UnidadBD): UnidadUI[] {
  if (base === 'g') return ['kg', 'g'];
  if (base === 'ml') return ['l', 'ml'];
  return ['pza'];
}

export function pasoUI(unidad: UnidadUI): number {
  switch (unidad) {
    case 'kg':
    case 'l':
      return 0.5;
    case 'g':
    case 'ml':
      return 100;
    default:
      return 1;
  }
}

//valor predeterminado al elegir un ingrediente nuevo.
export function valorInicialUI(unidad: UnidadUI): number {
  switch (unidad) {
    case 'kg':
    case 'l':
      return 1;
    case 'g':
    case 'ml':
      return 500;
    default:
      return 1;
  }
}

export function etiquetaUnidadUI(unidad: UnidadUI): string {
  return unidad === 'pza' ? 'pzas' : unidad === 'l' ? 'L' : unidad;
}

export function aBase(valor: number, unidad: UnidadUI): number {
  if (unidad === 'kg' || unidad === 'l') return Math.round(valor * 1000 * 100) / 100;
  return valor;
}

export function desdeBase(cantidad: number, base: UnidadBD): { valor: number; unidad: UnidadUI } {
  if (base === 'g') {
    return cantidad >= 1000
      ? { valor: cantidad / 1000, unidad: 'kg' }
      : { valor: cantidad, unidad: 'g' };
  }
  if (base === 'ml') {
    return cantidad >= 1000
      ? { valor: cantidad / 1000, unidad: 'l' }
      : { valor: cantidad, unidad: 'ml' };
  }
  return { valor: cantidad, unidad: 'pza' };
}

function limpiar(n: number): string {
  return Number(n.toFixed(2)).toString(); 
}

export function formatearCantidad(cantidad: number, base: UnidadBD): string {
  const { valor, unidad } = desdeBase(cantidad, base);
  if (unidad === 'pza') return `${limpiar(valor)} ${valor === 1 ? 'pza' : 'pzas'}`;
  return `${limpiar(valor)} ${etiquetaUnidadUI(unidad)}`;
}

export function pasoBase(cantidad: number, base: UnidadBD, subiendo: boolean): number {
  if (base === 'pieza') return 1;
  if (subiendo) return cantidad >= 1000 ? 500 : 100;
  return cantidad > 1000 ? 500 : 100;
}
export function cantidadMinima(base: UnidadBD): number {
  return base === 'pieza' ? 1 : 100;
}


export function formatearUI(valor: number, unidad: UnidadUI): string {
  return `${limpiar(valor)} ${etiquetaUnidadUI(unidad)}`;
}

export function convertirUI(valor: number, de: UnidadUI, a: UnidadUI): number {
  const enBase = aBase(valor, de);
  return a === 'kg' || a === 'l' ? enBase / 1000 : enBase;
}