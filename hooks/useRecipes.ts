import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { obtenerIdsRecetasConAlergia } from '../lib/alergias';
import { RecetaResumen } from '../types/database';

interface OpcionesRecetas {
  busqueda?: string; // texto que escribió el usuario en la barra de búsqueda
  modoHogar?: boolean; // true = también filtra alergias del hogar (default de la app)
}

export function useRecipes({ busqueda = '', modoHogar = true }: OpcionesRecetas) {
  const [recetas, setRecetas] = useState<RecetaResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const idsExcluidos = await obtenerIdsRecetasConAlergia(modoHogar);
      console.log('[useRecipes] ids excluidos por alergia:', idsExcluidos);

      let consulta = supabase
        .from('recetas')
        .select('id, nombre, tiempo_min, foto_url')
        // `visible = false` significa que la receta llegó a 3 reportes y se
        // ocultó sola (ver tabla `reportes` en la guía). El autor la sigue
        // viendo en su propia pantalla de "mis recetas" (fuera de este
        // stage), pero en el buscador general nunca debe aparecer.
        .eq('visible', true)
        .order('nombre');

      const texto = busqueda.trim();
      if (texto.length > 0) {
        consulta = consulta.ilike('nombre', `%${texto}%`);
      }

      if (idsExcluidos.length > 0) {
        consulta = consulta.not('id', 'in', `(${idsExcluidos.join(',')})`);
      }

      const { data, error: errorConsulta } = await consulta;
      console.log('[useRecipes] error de la consulta:', errorConsulta);
      console.log('[useRecipes] recetas recibidas:', data?.length, data);
      if (errorConsulta) throw errorConsulta;

      setRecetas((data ?? []) as RecetaResumen[]);
    } catch (e: any) {
      console.log('[useRecipes] excepción atrapada:', e);
      setError(e.message ?? 'No se pudieron cargar las recetas');
    } finally {
      setCargando(false);
    }
  }, [busqueda, modoHogar]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { recetas, cargando, error, recargar: cargar };
}