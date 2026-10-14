// Transferencia de una sola lectura; nunca almacena contraseñas ni persiste datos.
let correoPendiente = '';
export function prepararCorreoAcceso(correo: string) { correoPendiente = correo; }
export function consumirCorreoAcceso() { const correo = correoPendiente; correoPendiente = ''; return correo; }
