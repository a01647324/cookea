import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { obtenerIdsRecetasConAlergia } from '../lib/alergias';
import { RecetaResumen } from '../types/database';

export interface RecetaDestacada extends RecetaResumen {
  etiqueta: string | null;
  ingredientes: number;
}

const ETIQUETAS_OCULTAS = ['Comunidad BAMX'];

export function useFeaturedRecipes(limite: number = 6) {
  const [recetas, setRecetas] = useState<RecetaDestacada[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const idsExcluidos = await obtenerIdsRecetasConAlergia();

      let consulta = supabase
        .from('recetas')
        .select('id, nombre, tiempo_min, foto_url, receta_etiquetas(etiquetas(nombre)), receta_ingredientes(count)')
        .eq('visible', true)
        .is('autor_id', null)
        .order('id', { ascending: false })
        .limit(limite);

      if (idsExcluidos.length > 0) {
        consulta = consulta.not('id', 'in', `(${idsExcluidos.join(',')})`);
      }

      const { data, error: errorConsulta } = await consulta;
      if (errorConsulta) throw errorConsulta;

      const lista = (data ?? []).map((fila: any) => {
        const { receta_etiquetas, receta_ingredientes, ...resto } = fila;
        const etiqueta =
          (receta_etiquetas ?? [])
            .map((e: any) => e.etiquetas?.nombre)
            .find((n: string | undefined) => n && !ETIQUETAS_OCULTAS.includes(n)) ?? null;
        return {
          ...resto,
          etiqueta,
          ingredientes: receta_ingredientes?.[0]?.count ?? 0,
        } as RecetaDestacada;
      });

      setRecetas(lista);
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
