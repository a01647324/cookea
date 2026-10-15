import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { RecetaResumen } from '../types/database';

export interface RecetaGuardada extends RecetaResumen {
  album_id: number;
}

export function useRecetasGuardadas(idsAlbumes: number[]) {
  const [porAlbum, setPorAlbum] = useState<Record<number, RecetaGuardada[]>>({});
  const clave = idsAlbumes.join(',');

  const cargar = useCallback(async () => {
    if (!clave) {
      setPorAlbum({});
      return;
    }
    const { data, error } = await supabase
      .from('album_recetas')
      .select('album_id, agregado_en, recetas(id, nombre, tiempo_min, foto_url)')
      .in('album_id', clave.split(',').map(Number))
      .order('agregado_en', { ascending: false });
    if (error) return;

    const mapa: Record<number, RecetaGuardada[]> = {};
    (data ?? []).forEach((fila: any) => {
      if (!fila.recetas) return;
      (mapa[fila.album_id] ??= []).push({ ...fila.recetas, album_id: fila.album_id });
    });
    setPorAlbum(mapa);
  }, [clave]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { porAlbum, recargar: cargar };
}
