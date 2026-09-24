 /**
 * tips.ts
 *
 * ⚠️ NOTA: falta agregar tabla tips en supabase pero lo hacemoe ñuego
 */
export const TIPS_SALUDABLES: string[] = [
  'Los frijoles y lentejas son una excelente fuente de proteína y fibra.',
  'Cocinar en casa ayuda a controlar cuánta sal y azúcar consumes.',
  'Aprovecha las verduras antes de que se echen a perder: se pueden congelar cocidas.',
  'Combina cereales con leguminosas (como arroz con frijoles) para una proteína más completa.',
  'Guarda el agua de cocción de las verduras, sirve como base para sopas.',
];

// Elige un tip distinto cada día del año, sin necesidad de guardar estado.
export function obtenerTipDelDia(): string {
  const diaDelAnio = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return TIPS_SALUDABLES[diaDelAnio % TIPS_SALUDABLES.length];
}