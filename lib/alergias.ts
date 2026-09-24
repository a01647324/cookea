import { supabase } from './supabase';

/**
 * obtenerIdsRecetasConAlergia
 * 1. Lee los alérgenos del usuario (siempre) y, si `modoHogar` es true (que debe
 *    ser el default), también los del hogar.
 * 2. Si no tiene alergias registradas, regresa un arreglo vacío (no hay nada que
 *    excluir) sin gastar una consulta extra.
 * 3. Si tiene alergias, busca en `receta_ingredientes -> ingredientes ->
 *    ingrediente_alergenos` qué recetas usan alguno de esos alérgenos.
 *    IMPORTANTE: aquí NO filtramos por `opcional`, es decir, incluimos también
 *    los ingredientes opcionales de la receta. La guía es explícita en esto:
 *    "Incluyan los ingredientes opcionales al filtrar" (ej. el consomé del
 *    arroz rojo es opcional y tiene gluten, pero igual debe excluirse si el
 *    usuario es alérgico).
 *
 * ¿Por qué no hacerlo con una sola consulta gigante (join de 4 tablas)?
 * Porque Supabase-js arma URLs de PostgREST, y las relaciones anidadas con
 * filtros (`!inner` + `.in()` sobre una columna de una tabla de tercer nivel)
 * son propensas a errores de sintaxis difíciles de depurar para un equipo que
 * apenas está aprendiendo PostgREST. Dos consultas simples, encadenadas, son
 * más fáciles de leer, de loguear y de arreglar si algo sale mal — y con solo
 * 21 recetas (ver 05_datos_iniciales.sql) el costo extra es insignificante.
 */
export async function obtenerIdsRecetasConAlergia(modoHogar: boolean = true): Promise<number[]> {
  // Paso 1: alergias propias (siempre se filtran)
  const { data: propias, error: errorPropias } = await supabase
    .from('usuario_alergias')
    .select('alergeno_id');

  if (errorPropias) throw errorPropias;

  let alergenoIds = (propias ?? []).map((fila) => fila.alergeno_id as number);

  // Paso 2: alergias del hogar (solo si estamos en modo "Para mi hogar")
  if (modoHogar) {
    const { data: hogar, error: errorHogar } = await supabase
      .from('hogar_alergias')
      .select('alergeno_id');

    if (errorHogar) throw errorHogar;

    alergenoIds = [...alergenoIds, ...(hogar ?? []).map((fila) => fila.alergeno_id as number)];
  }

  // Quitamos duplicados (ej. si el usuario y su hogar comparten una alergia)
  const idsUnicos = [...new Set(alergenoIds)];

  if (idsUnicos.length === 0) {
    return []; // Sin alergias registradas: no hay nada que excluir
  }

  // Paso 3: ¿qué ingredientes tienen alguno de esos alérgenos?
  const { data: ingredientesConAlergeno, error: errorIngredientes } = await supabase
    .from('ingrediente_alergenos')
    .select('ingrediente_id')
    .in('alergeno_id', idsUnicos);

  if (errorIngredientes) throw errorIngredientes;

  const ingredienteIds = [
    ...new Set((ingredientesConAlergeno ?? []).map((fila) => fila.ingrediente_id as number)),
  ];

  if (ingredienteIds.length === 0) return [];

  // Paso 4: ¿qué recetas usan alguno de esos ingredientes? (sin filtrar `opcional`)
  const { data: recetasConIngrediente, error: errorRecetas } = await supabase
    .from('receta_ingredientes')
    .select('receta_id')
    .in('ingrediente_id', ingredienteIds);

  if (errorRecetas) throw errorRecetas;

  return [...new Set((recetasConIngrediente ?? []).map((fila) => fila.receta_id as number))];
}