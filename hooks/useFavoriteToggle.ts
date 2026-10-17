import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { log } from '../lib/log'; // STORAGE-2

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
      log('[favoritos] buscar álbum:', errorAlbum);
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
      log('[favoritos] buscar relación:', errorRelacion);
      setError('No se pudo verificar tus favoritos.');
    } else {
      setEsFavorita(relacion != null);
    }
    setCargando(false);
  }, [recetaId]);

  useEffect(() => {
    const ejecutarVerificacion = async () => {
      await verificarEstado();
    };
  
    void ejecutarVerificacion();
  }, [verificarEstado]);

  const alternar = useCallback(async () => {
    if (recetaId == null) return;

    const { data: album, error: errorAlbum } = await supabase
      .from('albumes')
      .select('id')
      .eq('tipo', 'favoritos')
      .single();

    if (errorAlbum) {
      log('[favoritos] buscar álbum:', errorAlbum);
      setError('No se pudo actualizar tus favoritos.');
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
        log('[favoritos] quitar:', errorBorrar);
        setError('No se pudo quitar la receta de tus favoritos.');
      }
    } else {
      const { error: errorInsertar } = await supabase
        .from('album_recetas')
        .insert({ album_id: album.id, receta_id: recetaId });
      // Código 23505 = ya estaba en el álbum: lo tratamos como éxito, no error
      if (errorInsertar && errorInsertar.code !== '23505') {
        setEsFavorita(valorAnterior);
        log('[favoritos] agregar:', errorInsertar);
        setError('No se pudo agregar la receta a tus favoritos.');
      }
    }
  }, [recetaId, esFavorita]);

  return { esFavorita, cargando, error, alternar };
}