import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { obtenerIdsRecetasConAlergia } from '../lib/alergias';
import { RecetaDetalle } from '../types/database';

export interface ExtrasComunidad {
  autorAlias: string;
  promedio: number | null;
  total: number;
  etiquetas: string[];
  faltanElectrodomesticos: string[];
  tieneAlergeno: boolean;
  alacena: Record<number, number>;
  esMia: boolean;
}

const EXTRAS_VACIOS: ExtrasComunidad = {
  autorAlias: '',
  promedio: null,
  total: 0,
  etiquetas: [],
  faltanElectrodomesticos: [],
  tieneAlergeno: false,
  alacena: {},
  esMia: false,
};

const CONSULTA_RECETA = `id, nombre, descripcion, tiempo_min, porciones_base, foto_url, video_url, autor_id, visible,
  receta_ingredientes(cantidad, cantidad_texto, opcional, ingredientes(id, nombre, categoria, unidad)),
  pasos_receta(orden, texto, temporizador_seg),
  receta_etiquetas(etiquetas(nombre)),
  receta_electrodomesticos(electrodomestico_id, electrodomesticos(nombre))`;

export function useRecetaComunidad(recetaId: number | undefined) {
  const [receta, setReceta] = useState<RecetaDetalle | null>(null);
  const [extras, setExtras] = useState<ExtrasComunidad>(EXTRAS_VACIOS);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarExtras = useCallback(async (datos: any) => {
    try {
      const [sesion, autor, calificacion, misElectro, alacena, idsConAlergia] = await Promise.all([
        supabase.auth.getSession(),
        datos.autor_id
          ? supabase.from('perfiles_publicos').select('alias').eq('id', datos.autor_id).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from('recetas_calificacion').select('promedio, total').eq('receta_id', datos.id).maybeSingle(),
        supabase.from('usuario_electrodomesticos').select('electrodomestico_id'),
        supabase.from('alacena_items').select('ingrediente_id, cantidad'),
        obtenerIdsRecetasConAlergia(true).catch(() => [] as number[]),
      ]);

      const tengo = new Set((misElectro.data ?? []).map((e) => e.electrodomestico_id as number));
      const faltan: string[] =
        tengo.size === 0
          ? []
          : (datos.receta_electrodomesticos ?? [])
              .filter((e: any) => !tengo.has(e.electrodomestico_id))
              .map((e: any) => e.electrodomesticos?.nombre)
              .filter(Boolean);

      const mapaAlacena: Record<number, number> = {};
      (alacena.data ?? []).forEach((a) => {
        mapaAlacena[a.ingrediente_id as number] = Number(a.cantidad);
      });

      setExtras({
        autorAlias: (autor.data as any)?.alias ?? '',
        promedio: calificacion.data?.promedio ?? null,
        total: calificacion.data?.total ?? 0,
        etiquetas: (datos.receta_etiquetas ?? []).map((e: any) => e.etiquetas?.nombre).filter(Boolean),
        faltanElectrodomesticos: faltan,
        tieneAlergeno: idsConAlergia.includes(datos.id),
        alacena: mapaAlacena,
        esMia: !!datos.autor_id && sesion.data.session?.user.id === datos.autor_id,
      });
    } catch {
      // Los extras son complementarios: si fallan, la receta se sigue mostrando
    }
  }, []);

  const cargar = useCallback(async () => {
    if (recetaId == null) {
      setError('No encontramos esta receta.');
      setCargando(false);
      return;
    }

    setCargando(true);
    setError(null);
    try {
      const { data, error: errorConsulta } = await supabase
        .from('recetas')
        .select(CONSULTA_RECETA)
        .eq('id', recetaId)
        .order('orden', { referencedTable: 'pasos_receta' })
        .maybeSingle();

      if (errorConsulta || !data) {
        setReceta(null);
        setError(data === null && !errorConsulta ? 'Receta no encontrada.' : 'No pudimos cargar la receta.');
        return;
      }

      setReceta(data as unknown as RecetaDetalle);
      cargarExtras(data);
    } catch {
      setError('No pudimos cargar la receta. Revisa tu conexión.');
    } finally {
      setCargando(false);
    }
  }, [recetaId, cargarExtras]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const eliminar = useCallback(async () => {
    const { error: errorBorrar } = await supabase.from('recetas').delete().eq('id', recetaId);
    return !errorBorrar;
  }, [recetaId]);

  return {
    receta,
    extras,
    cargando,
    error,
    recargar: cargar,
    recargarExtras: () => (receta ? cargarExtras(receta) : Promise.resolve()),
    eliminar,
  };
}