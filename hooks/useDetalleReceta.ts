import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { obtenerIdsRecetasConAlergia } from '../lib/alergias';
import { RecetaDetalle } from '../types/database';

export interface Utensilio {
  id: number;
  nombre: string;
  loTienes: boolean | null;
}

export interface ExtrasReceta {
  etiquetas: string[];
  utensilios: Utensilio[];
  alacena: Record<number, number>;
  tieneAlergeno: boolean;
}

const EXTRAS_VACIOS: ExtrasReceta = {
  etiquetas: [],
  utensilios: [],
  alacena: {},
  tieneAlergeno: false,
};

const ETIQUETAS_OCULTAS = ['Comunidad BAMX'];

const CONSULTA = `id, nombre, descripcion, tiempo_min, porciones_base, foto_url, video_url, autor_id, visible,
  receta_ingredientes(cantidad, cantidad_texto, opcional, ingredientes(id, nombre, categoria, unidad, imagen_url)),
  pasos_receta(orden, texto, temporizador_seg),
  receta_etiquetas(etiquetas(nombre)),
  receta_electrodomesticos(electrodomestico_id, electrodomesticos(nombre))`;

export function useDetalleReceta(recetaId: number | undefined) {
  const [receta, setReceta] = useState<RecetaDetalle | null>(null);
  const [extras, setExtras] = useState<ExtrasReceta>(EXTRAS_VACIOS);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarExtras = useCallback(async (datos: any) => {
    try {
      const [misElectro, alacena, idsConAlergia] = await Promise.all([
        supabase.from('usuario_electrodomesticos').select('electrodomestico_id'),
        supabase.from('alacena_items').select('ingrediente_id, cantidad'),
        obtenerIdsRecetasConAlergia(true).catch(() => [] as number[]),
      ]);

      const tengo = new Set((misElectro.data ?? []).map((e) => e.electrodomestico_id as number));
      const utensilios: Utensilio[] = (datos.receta_electrodomesticos ?? []).map((e: any) => ({
        id: e.electrodomestico_id,
        nombre: e.electrodomesticos?.nombre ?? 'Utensilio',
        loTienes: tengo.size === 0 ? null : tengo.has(e.electrodomestico_id),
      }));

      const mapaAlacena: Record<number, number> = {};
      (alacena.data ?? []).forEach((a) => {
        mapaAlacena[a.ingrediente_id as number] = Number(a.cantidad);
      });

      setExtras({
        etiquetas: (datos.receta_etiquetas ?? [])
          .map((e: any) => e.etiquetas?.nombre)
          .filter((n: string | undefined) => n && !ETIQUETAS_OCULTAS.includes(n)),
        utensilios,
        alacena: mapaAlacena,
        tieneAlergeno: idsConAlergia.includes(datos.id),
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
        .select(CONSULTA)
        .eq('id', recetaId)
        .order('orden', { referencedTable: 'pasos_receta' })
        .maybeSingle();

      if (errorConsulta || !data) {
        setReceta(null);
        setError(!errorConsulta ? 'Receta no encontrada.' : 'No pudimos cargar la receta.');
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

  return {
    receta,
    extras,
    cargando,
    error,
    recargar: cargar,
    recargarExtras: () => (receta ? cargarExtras(receta) : Promise.resolve()),
  };
}
