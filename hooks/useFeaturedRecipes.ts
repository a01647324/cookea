import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { obtenerIdsRecetasConAlergia } from '../lib/alergias';
import { RecetaResumen } from '../types/database';

export function useFeaturedRecipes(limite: number = 6) {
  const [recetas, setRecetas] = useState<RecetaResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const idsExcluidos = await obtenerIdsRecetasConAlergia();

      let consulta = supabase
        .from('recetas_calificacion')
        .select('receta_id, promedio, total, recetas!inner(id, nombre, tiempo_min, foto_url, visible)')
        .eq('recetas.visible', true)
        .order('promedio', { ascending: false })
        .limit(limite);

      if (idsExcluidos.length > 0) {
        consulta = consulta.not('receta_id', 'in', `(${idsExcluidos.join(',')})`);
      }

      const { data, error: errorConsulta } = await consulta;
      if (errorConsulta) throw errorConsulta;

      const resumen = (data ?? [])
        .map((fila: any) => fila.recetas as RecetaResumen)
        .filter(Boolean);

      setRecetas(resumen);
    } catch (e: any) {
      setError(e.message ?? 'No se pudieron cargar las recomendaciones');
    } finally {
      setCargando(false);
    }
  }, [limite]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { recetas, cargando, error, recargar: cargar };
}