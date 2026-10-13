import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { obtenerIdsRecetasConAlergia } from '../lib/alergias';
import { useRecipeDetail } from './useRecipeDetail';

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

export function useRecetaComunidad(recetaId: number) {
  const { receta, cargando, error, recargar } = useRecipeDetail(recetaId);
  const [extras, setExtras] = useState<ExtrasComunidad>(EXTRAS_VACIOS);

  const autorId = receta?.autor_id ?? null;

  const cargarExtras = useCallback(async () => {
    if (!receta) return;

    const [usuario, autor, calificacion, relaciones, misElectro, alacena, idsConAlergia] =
      await Promise.all([
        supabase.auth.getUser(),
        autorId
          ? supabase.from('perfiles_publicos').select('alias').eq('id', autorId).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase
          .from('recetas_calificacion')
          .select('promedio, total')
          .eq('receta_id', recetaId)
          .maybeSingle(),
        supabase
          .from('recetas')
          .select(
            'receta_etiquetas(etiquetas(nombre)), receta_electrodomesticos(electrodomestico_id, electrodomesticos(nombre))'
          )
          .eq('id', recetaId)
          .maybeSingle(),
        supabase.from('usuario_electrodomesticos').select('electrodomestico_id'),
        supabase.from('alacena_items').select('ingrediente_id, cantidad'),
        obtenerIdsRecetasConAlergia(true).catch(() => [] as number[]),
      ]);

    const rel = relaciones.data as any;
    const etiquetas: string[] = (rel?.receta_etiquetas ?? []).map((e: any) => e.etiquetas.nombre);

    const tengo = new Set((misElectro.data ?? []).map((e) => e.electrodomestico_id as number));
    const faltan: string[] =
      tengo.size === 0
        ? []
        : (rel?.receta_electrodomesticos ?? [])
            .filter((e: any) => !tengo.has(e.electrodomestico_id))
            .map((e: any) => e.electrodomesticos.nombre);

    const mapaAlacena: Record<number, number> = {};
    (alacena.data ?? []).forEach((a) => {
      mapaAlacena[a.ingrediente_id as number] = Number(a.cantidad);
    });

    setExtras({
      autorAlias: (autor.data as any)?.alias ?? '',
      promedio: calificacion.data?.promedio ?? null,
      total: calificacion.data?.total ?? 0,
      etiquetas,
      faltanElectrodomesticos: faltan,
      tieneAlergeno: idsConAlergia.includes(recetaId),
      alacena: mapaAlacena,
      esMia: !!autorId && usuario.data.user?.id === autorId,
    });
  }, [receta, autorId, recetaId]);

  useEffect(() => {
    cargarExtras();
  }, [cargarExtras]);

  const eliminar = useCallback(async () => {
    const { error } = await supabase.from('recetas').delete().eq('id', recetaId);
    return !error;
  }, [recetaId]);

  return {
    receta,
    extras,
    cargando,
    error: error ? 'No pudimos cargar la receta.' : null,
    recargar: async () => {
      await recargar();
      await cargarExtras();
    },
    recargarExtras: cargarExtras,
    eliminar,
  };
}