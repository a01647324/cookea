import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { RecetaDetalle } from '../types/database';


export function useRecipeDetail(recetaId: number | null) {
  const [receta, setReceta] = useState<RecetaDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (recetaId == null) return;
    setCargando(true);
    setError(null);

    const { data, error: errorConsulta } = await supabase
      .from('recetas')
      .select(
        `id, nombre, descripcion, tiempo_min, porciones_base, foto_url, video_url, autor_id, visible,
         receta_ingredientes(cantidad, cantidad_texto, opcional, ingredientes(id, nombre, categoria, unidad)),
         pasos_receta(orden, texto, temporizador_seg)`
      )
      .eq('id', recetaId)
      .order('orden', { referencedTable: 'pasos_receta' })
      .single();

    if (errorConsulta) {
      // PGRST116 = .single() no encontró ningún renglón (ver tabla de errores de la guía)
      if (errorConsulta.code === 'PGRST116') {
        setError('Receta no encontrada.');
      } else {
        setError(errorConsulta.message);
      }
      setReceta(null);
    } else {
      setReceta(data as unknown as RecetaDetalle);
    }
    setCargando(false);
  }, [recetaId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { receta, cargando, error, recargar: cargar };
}