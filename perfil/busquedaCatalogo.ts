export function normalizarBusqueda(texto: string): string {
 return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('es');
}
export function indexarCatalogo<T extends { nombre: string }>(opciones: T[]) {
 return opciones.map(opcion => ({ opcion, texto: normalizarBusqueda(opcion.nombre) }));
}
export function buscarCatalogo<T>(indice: { opcion: T; texto: string }[], consulta: string): T[] {
 const texto = normalizarBusqueda(consulta);
 return indice.filter(fila => fila.texto.includes(texto)).map(fila => fila.opcion);
}
