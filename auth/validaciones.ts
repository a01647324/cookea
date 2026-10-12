// validaciones.ts: funciones puras para los formularios de contraseña.
// "Puras" quiere decir que no llaman a Supabase ni guardan estado: reciben
// texto y regresan un resultado. Así son fáciles de leer y de probar con Jest.
// Cada una recorre el texto una sola vez: O(n) en tiempo y O(1) de espacio extra.

// Datos de la configuración de Supabase (Authentication > Email).
// Si se cambian allá, hay que cambiarlos aquí también.
export const LONGITUD_CODIGO = 8; // cuántos números trae el código del correo
export const MINUTOS_CODIGO = 60; // cuánto dura el código (3600 segundos)
export const MINIMO_CONTRASENA = 8; // largo mínimo de contraseña

// Quita los espacios del principio y del final y pasa todo a minúsculas.
// Ejemplo: "  Ana@Correo.com " -> "ana@correo.com"
export function normalizarCorreo(texto: string): string {
  return texto.trim().toLowerCase();
}

// (nuevo) Expresión regular sencilla: algo@algo.algo, sin espacios.
// La parte después de la @ no puede tener punto antes del primer ".", así la
// expresión nunca duda dónde cortar y no puede tardar de más con textos
// raros (ReDoS). No revisa todo lo que permite un correo: eso lo hace Supabase.
const FORMATO_CORREO = /^[^\s@]+@[^\s@.]+\.[^\s@]+$/;

export function esCorreoValido(correo: string): boolean {
  return FORMATO_CORREO.test(correo);
}

// Deja solo los números del código. Sirve cuando la persona pega algo como
// "1234 5678" o "1234-5678". También corta lo que sobre.
export function limpiarCodigo(texto: string): string {
  return texto.replace(/\D/g, "").slice(0, LONGITUD_CODIGO);
}

// Lo que regresa una validación cuando algo está mal:
// en qué campo va el error y qué mensaje mostrar debajo de él.
export type ErrorDeCampo = {
  campo: "nueva" | "confirmacion";
  mensaje: string;
};

// Revisa la nueva contraseña y su confirmación antes de llamar al servidor.
// Regresa null si todo está bien.
export function validarNuevaContrasena(
  nueva: string,
  confirmacion: string
): ErrorDeCampo | null {
  if (nueva === "") {
    return { campo: "nueva", mensaje: "Escribe tu nueva contraseña." };
  }
  if (nueva.length < MINIMO_CONTRASENA) {
    return {
      campo: "nueva",
      mensaje: `La contraseña debe tener al menos ${MINIMO_CONTRASENA} caracteres.`,
    };
  }
  if (confirmacion === "") {
    return { campo: "confirmacion", mensaje: "Escribe otra vez tu nueva contraseña." };
  }
  if (nueva !== confirmacion) {
    return {
      campo: "confirmacion",
      mensaje: "Las contraseñas no son iguales. Escríbela otra vez.",
    };
  }
  return null;
}
