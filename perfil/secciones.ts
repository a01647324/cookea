// (nuevo) Sección del módulo por usuario, sin añadir parámetros al navegador compartido.
export type SeccionPreferencias = 'restricciones' | 'hogar' | 'cocina';
const secciones = new Map<string, SeccionPreferencias>();
export function seleccionarSeccion(id: string, seccion: SeccionPreferencias) { secciones.set(id,seccion); }
export function obtenerSeccion(id: string): SeccionPreferencias { return secciones.get(id) ?? 'restricciones'; }
