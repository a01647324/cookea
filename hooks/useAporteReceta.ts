import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { log } from '../lib/log';
import { obtenerNombresIngredientesConAlergia } from '../lib/alergias';
import { aportePlato, AportePlato } from '../lib/recomendador/salud';
import { GrupoAlimenticio } from '../lib/recomendador/tipos';

export function useAporteReceta(recetaId: number | null | undefined) {
  const [aporte, setAporte] = useState<AportePlato | null>(null);
  const [excluidos, setExcluidos] = useState<Set<string> | null>(null);

  useEffect(() => {
    if (recetaId == null) return;
    let vigente = true;

    (async () => {
      // En paralelo: los ingredientes de la receta y los ingredientes que te dan alergia.
      const [{ data, error }, nombresAlergia] = await Promise.all([
        supabase
          .from('receta_ingredientes')
          .select('opcional, ingredientes ( nombre, grupo_alimenticio )')
          .eq('receta_id', recetaId),
        obtenerNombresIngredientesConAlergia(true).catch((e) => {
          log('[plato] no se pudieron leer las alergias:', e?.code);
          return null;
        }),
      ]);

      if (!vigente) return;
      setExcluidos(nombresAlergia);
      if (error || !data) {
        log('[plato] no se pudo calcular el aporte:', error?.code);
        setAporte(null);
        return;
      }

      const ingredientes = data
        .map((fila: any) => {
          const ing = Array.isArray(fila.ingredientes) ? fila.ingredientes[0] : fila.ingredientes;
          if (!ing) return null;
          return {
            nombre: String(ing.nombre),
            opcional: !!fila.opcional,
            grupo: (ing.grupo_alimenticio ?? null) as GrupoAlimenticio | null,
          };
        })
        .filter((x): x is { nombre: string; opcional: boolean; grupo: GrupoAlimenticio | null } => x !== null);

      const resultado = aportePlato(ingredientes);
      setAporte(resultado.hayDatos ? resultado : null);
    })();

    return () => {
      vigente = false;
    };
  }, [recetaId]);

  return { aporte, excluidos };
}