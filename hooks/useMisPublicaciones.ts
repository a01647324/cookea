import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface MiPublicacion {
  id: number;
  nombre: string;
  foto_url: string | null;
  visible: boolean;
  creado_en: string;
  comentarios: number;
  promedio: number | null;
  total: number;
}

const RUTA_PUBLICA = '/storage/v1/object/public/recetas/';

export function useMisPublicaciones() {
  const [recetas, setRecetas] = useState<MiPublicacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);

  const cargar = useCallback(async (esRefresco = false) => {
    esRefresco ? setRefrescando(true) : setCargando(true);
    setError(null);
    try {
      const { data: sesion } = await supabase.auth.getSession();
      const usuario = sesion.session?.user.id;
      if (!usuario) throw new Error('sin sesión');
      setUid(usuario);

      const { data, error: errorConsulta } = await supabase
        .from('recetas')
        .select('id, nombre, foto_url, visible, creado_en, comentarios(count)')
        .eq('autor_id', usuario)
        .order('creado_en', { ascending: false });
      if (errorConsulta) throw errorConsulta;

      const ids = (data ?? []).map((r) => r.id as number);
      const promedios = new Map<number, { promedio: number; total: number }>();
      if (ids.length > 0) {
        const { data: calificaciones } = await supabase
          .from('recetas_calificacion')
          .select('receta_id, promedio, total')
          .in('receta_id', ids);
        (calificaciones ?? []).forEach((c) => promedios.set(c.receta_id, { promedio: c.promedio, total: c.total }));
      }

      setRecetas(
        (data ?? []).map((r: any) => ({
          id: r.id,
          nombre: r.nombre,
          foto_url: r.foto_url,
          visible: r.visible,
          creado_en: r.creado_en,
          comentarios: r.comentarios?.[0]?.count ?? 0,
          promedio: promedios.get(r.id)?.promedio ?? null,
          total: promedios.get(r.id)?.total ?? 0,
        }))
      );
    } catch {
      setError('No pudimos cargar tus recetas. Revisa tu conexión.');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  const eliminar = useCallback(
    async (receta: MiPublicacion) => {
      const { error: errorBorrar } = await supabase.from('recetas').delete().eq('id', receta.id);
      if (errorBorrar) return false;

      // La foto solo se borra si está en la carpeta del usuario
      const ruta = receta.foto_url?.split(RUTA_PUBLICA)[1];
      if (ruta && uid && ruta.startsWith(`${uid}/`)) {
        await supabase.storage.from('recetas').remove([ruta]).catch(() => {});
      }

      setRecetas((prev) => prev.filter((r) => r.id !== receta.id));
      return true;
    },
    [uid]
  );

  return { recetas, cargando, refrescando, error, cargar, eliminar };
}