import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function usePreparadasHoy() {
  const [ids, setIds] = useState<Set<number>>(new Set());

  const cargar = useCallback(async () => {
    try {
      const { data: album, error: errorAlbum } = await supabase
        .from('albumes')
        .select('id')
        .eq('tipo', 'ya_preparadas')
        .maybeSingle();
      if (errorAlbum || !album) return;

      const inicioDelDia = new Date();
      inicioDelDia.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('album_recetas')
        .select('receta_id')
        .eq('album_id', album.id)
        .gte('agregado_en', inicioDelDia.toISOString());
      if (error) return;

      setIds(new Set((data ?? []).map((fila) => fila.receta_id as number)));
    } catch {
      // Si falla, la tarjeta simplemente no muestra la palomita
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { ids, recargar: cargar };
}
