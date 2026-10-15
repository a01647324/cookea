import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { obtenerIdsRecetasConAlergia } from '../lib/alergias';
import { textoError } from '../lib/errores';
import { recomendar } from '../lib/recomendador/recomendar';
import {
  GrupoAlimenticio,
  Historial,
  IngredienteReceta,
  ItemAlacena,
  Nutricion,
  RecetaParaRecomendar,
  ResultadoRecomendacion,
  UnidadBase,
} from '../lib/recomendador/tipos';
import { COBERTURA_MINIMA_HOME } from '../constants/recomendador';

const COLUMNAS_BASE = 'id, nombre, unidad';
const COLUMNAS_SALUD =
  'id, nombre, unidad, grupo_alimenticio, kcal_100, azucares_anadidos_100, grasa_sat_100, sodio_mg_100, gramos_por_pieza';

const unoSolo = <T,>(x: T | T[] | null | undefined): T | null => (Array.isArray(x) ? x[0] ?? null : x ?? null);
const numeroONull = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));

function aReceta(fila: any): RecetaParaRecomendar {
  const ingredientes: IngredienteReceta[] = (fila.receta_ingredientes ?? [])
    .map((ri: any): IngredienteReceta | null => {
      const ing = unoSolo<any>(ri.ingredientes);
      if (!ing) return null;
      const nutricion: Nutricion | null =
        'kcal_100' in ing
          ? {
              kcal_100: numeroONull(ing.kcal_100),
              azucares_anadidos_100: numeroONull(ing.azucares_anadidos_100),
              grasa_sat_100: numeroONull(ing.grasa_sat_100),
              sodio_mg_100: numeroONull(ing.sodio_mg_100),
              gramos_por_pieza: numeroONull(ing.gramos_por_pieza),
            }
          : null;
      return {
        ingrediente_id: Number(ri.ingrediente_id),
        nombre: ing.nombre,
        unidad: ing.unidad as UnidadBase,
        cantidad: Number(ri.cantidad),
        opcional: !!ri.opcional,
        grupo: (ing.grupo_alimenticio ?? null) as GrupoAlimenticio | null,
        nutricion,
      };
    })
    .filter((x: IngredienteReceta | null): x is IngredienteReceta => x !== null);

  return {
    id: Number(fila.id),
    nombre: fila.nombre,
    tiempo_min: Number(fila.tiempo_min),
    foto_url: fila.foto_url ?? null,
    porciones_base: Number(fila.porciones_base) || 1,
    ingredientes,
  };
}

export async function cargarRecetas(): Promise<RecetaParaRecomendar[]> {
  const consulta = (columnasIngrediente: string) =>
    supabase
      .from('recetas')
      .select(
        `id, nombre, tiempo_min, foto_url, porciones_base,
         receta_ingredientes ( ingrediente_id, cantidad, opcional, ingredientes ( ${columnasIngrediente} ) )`
      )
      .eq('visible', true)
      .limit(500);

  let { data, error } = await consulta(COLUMNAS_SALUD);
  if (error) {
    if (__DEV__) console.log('[recomendador] sin columnas de salud, reintento básico:', error.code, error.message);
    ({ data, error } = await consulta(COLUMNAS_BASE));
  }
  if (error) throw error;
  return (data ?? []).map(aReceta);
}

export async function cargarAlacena(): Promise<ItemAlacena[]> {
  const { data, error } = await supabase.from('alacena_items').select('ingrediente_id, cantidad, usar_pronto');
  if (error) throw error;
  return (data ?? []).map((f: any) => ({
    ingrediente_id: Number(f.ingrediente_id),
    cantidad: Number(f.cantidad),
    usar_pronto: !!f.usar_pronto,
  }));
}

export async function cargarHistorial(): Promise<Historial> {
  const historial: Historial = {
    favoritas: new Set(),
    hacerDespues: new Set(),
    preparadas: new Set(),
    calificaciones: new Map(),
  };

  try {
    const { data, error } = await supabase.from('albumes').select('tipo, album_recetas ( receta_id )');
    if (error) throw error;
    for (const album of data ?? []) {
      const destino =
        album.tipo === 'favoritos'
          ? historial.favoritas
          : album.tipo === 'hacer_despues'
            ? historial.hacerDespues
            : album.tipo === 'ya_preparadas'
              ? historial.preparadas
              : null;
      if (!destino) continue;
      for (const fila of (album as any).album_recetas ?? []) destino.add(Number(fila.receta_id));
    }
  } catch (e: any) {
    textoError(e); 
  }

  try {
    const { data: sesion } = await supabase.auth.getSession();
    const usuarioId = sesion.session?.user.id;
    if (usuarioId) {
      const { data, error } = await supabase
        .from('calificaciones')
        .select('receta_id, estrellas')
        .eq('usuario_id', usuarioId);
      if (error) throw error;
      for (const f of data ?? []) historial.calificaciones.set(Number(f.receta_id), Number(f.estrellas));
    }
  } catch (e: any) {
    textoError(e);
  }

  return historial;
}

export function useRecomendaciones(limite?: number, soloPreferirCocinables = false) {
  const [resultado, setResultado] = useState<ResultadoRecomendacion>({ alacenaVacia: true, items: [] });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const yaCargo = useRef(false);
  const idPeticion = useRef(0); 

  const recargar = useCallback(async () => {
    const miId = ++idPeticion.current;
    if (!yaCargo.current) setCargando(true); 

    try {
      const [recetas, alacena, historial, idsExcluidos] = await Promise.all([
        cargarRecetas(),
        cargarAlacena(),
        cargarHistorial(),
        obtenerIdsRecetasConAlergia(true),
      ]);
      if (miId !== idPeticion.current) return;

      setResultado(
        recomendar(
          recetas,
          { alacena, historial, idsExcluidos: new Set(idsExcluidos) },
          { limite, minCobertura: soloPreferirCocinables ? COBERTURA_MINIMA_HOME : undefined }
        )
      );
      setError(null);
      yaCargo.current = true;
    } catch (e: any) {
      if (miId !== idPeticion.current) return;
      setError(textoError(e));
    } finally {
      if (miId === idPeticion.current) setCargando(false);
    }
  }, [limite, soloPreferirCocinables]);

  useFocusEffect(
    useCallback(() => {
      recargar();
    }, [recargar])
  );

  return { items: resultado.items, alacenaVacia: resultado.alacenaVacia, cargando, error, recargar };
}