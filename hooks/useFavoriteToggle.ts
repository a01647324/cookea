import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useFavoriteToggle(recetaId: number | null) {
  const [esFavorita, setEsFavorita] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const verificarEstado = useCallback(async () => {
    if (recetaId == null) return;
    setCargando(true);
    setError(null);

    const { data: album, error: errorAlbum } = await supabase
      .from('albumes')
      .select('id')
      .eq('tipo', 'favoritos')
      .single();

    if (errorAlbum) {
      setError(errorAlbum.message);
      setCargando(false);
      return;
    }

    const { data: relacion, error: errorRelacion } = await supabase
      .from('album_recetas')
      .select('receta_id')
      .eq('album_id', album.id)
      .eq('receta_id', recetaId)
      .maybeSingle(); // .maybeSingle() no truena si no hay ningún renglón

    if (errorRelacion) {
      setError(errorRelacion.message);
    } else {
      setEsFavorita(relacion != null);
    }
    setCargando(false);
  }, [recetaId]);

  useEffect(() => {
    verificarEstado();
  }, [verificarEstado]);

  const alternar = useCallback(async () => {
    if (recetaId == null) return;

    const { data: album, error: errorAlbum } = await supabase
      .from('albumes')
      .select('id')
      .eq('tipo', 'favoritos')
      .single();

    if (errorAlbum) {
      setError(errorAlbum.message);
      return;
    }
    
    const valorAnterior = esFavorita;
    setEsFavorita(!valorAnterior);

    if (valorAnterior) {
      const { error: errorBorrar } = await supabase
        .from('album_recetas')
        .delete()
        .eq('album_id', album.id)
        .eq('receta_id', recetaId);
      if (errorBorrar) {
        setEsFavorita(valorAnterior);
        setError(errorBorrar.message);
      }
    } else {
      const { error: errorInsertar } = await supabase
        .from('album_recetas')
        .insert({ album_id: album.id, receta_id: recetaId });
      // Código 23505 = ya estaba en el álbum: lo tratamos como éxito, no error
      if (errorInsertar && errorInsertar.code !== '23505') {
        setEsFavorita(valorAnterior);
        setError(errorInsertar.message);
      }
    }
  }, [recetaId, esFavorita]);

  return { esFavorita, cargando, error, alternar };
}