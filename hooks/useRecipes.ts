import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { obtenerIdsRecetasConAlergia } from '../lib/alergias';
import { textoErrorGeneral } from '../lib/errores';
import { limpiarBusqueda } from '../lib/entradas';
import { RecetaResumen } from '../types/database';
import { log } from '../lib/log';

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
      log('[useRecipes] ids excluidos por alergia:', idsExcluidos);

      let consulta = supabase
        .from('recetas')
        .select('id, nombre, tiempo_min, foto_url')
        .eq('visible', true)
        .order('nombre');

      const texto = limpiarBusqueda(busqueda);
      if (texto.length > 0) {
        consulta = consulta.ilike('nombre', `%${texto}%`);
      }

      if (idsExcluidos.length > 0) {
        consulta = consulta.not('id', 'in', `(${idsExcluidos.join(',')})`);
      }
      
      const { data, error: errorConsulta } = await consulta;
      if (errorConsulta) throw errorConsulta;
      
      setRecetas((data ?? []) as RecetaResumen[]);
    } catch (e: any) {
      setError(textoErrorGeneral(e));
    } finally {
      setCargando(false);
    }
    }, [busqueda, modoHogar]);
      
    useEffect(() => {
      void cargar();
    }, [cargar]);
      
    return { recetas, cargando, error, recargar: cargar };
  }
      