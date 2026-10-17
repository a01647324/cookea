import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { obtenerIdsRecetasConAlergia } from '../lib/alergias';
import { RecetaResumen } from '../types/database';
import { limpiarBusqueda } from '../lib/entradas';

export interface Categoria {
  id: number;
  nombre: string;
}

export interface RecetaRecetario extends RecetaResumen {
  porciones_base: number;
  etiquetas: Categoria[];
  faltan: number | null;
}

const ETIQUETAS_OCULTAS = ['Comunidad BAMX'];


export function useRecetario(busqueda: string) {
  const [recetas, setRecetas] = useState<RecetaRecetario[]>([]);
  const [alacenaVacia, setAlacenaVacia] = useState(true);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const peticion = useRef(0);

  const cargar = useCallback(async () => {
    const numero = ++peticion.current;
    setCargando(true);
    setError(null);

    try {
      let consulta = supabase
        .from('recetas')
        .select(
          `id, nombre, tiempo_min, foto_url, porciones_base,
           receta_ingredientes(cantidad, opcional, ingredientes(id)),
           receta_etiquetas(etiquetas(id, nombre))`
        )
        .eq('visible', true)
        .order('nombre');

      const texto = limpiarBusqueda(busqueda);
      if (texto.length > 0) consulta = consulta.ilike('nombre', `%${texto}%`);

      const [respuesta, alacena, idsConAlergia] = await Promise.all([
        consulta,
        supabase.from('alacena_items').select('ingrediente_id, cantidad'),
        obtenerIdsRecetasConAlergia(true),
      ]);

      if (numero !== peticion.current) return;
      if (respuesta.error) throw respuesta.error;

      const mapa: Record<number, number> = {};
      (alacena.data ?? []).forEach((a) => {
        mapa[a.ingrediente_id as number] = Number(a.cantidad);
      });
      const sinAlacena = Object.keys(mapa).length === 0;
      const excluidas = new Set(idsConAlergia);

      const lista: RecetaRecetario[] = (respuesta.data ?? [])
        .filter((r: any) => !excluidas.has(r.id))
        .map((r: any) => {
          const obligatorios = (r.receta_ingredientes ?? []).filter((ri: any) => !ri.opcional);
          const faltan = sinAlacena
            ? null
            : obligatorios.filter((ri: any) => (mapa[ri.ingredientes?.id] ?? 0) < Number(ri.cantidad)).length;
          const etiquetas: Categoria[] = (r.receta_etiquetas ?? [])
            .map((e: any) => e.etiquetas)
            .filter((e: any) => e && !ETIQUETAS_OCULTAS.includes(e.nombre));
          return {
            id: r.id,
            nombre: r.nombre,
            tiempo_min: r.tiempo_min,
            foto_url: r.foto_url,
            porciones_base: r.porciones_base,
            etiquetas,
            faltan,
          };
        });

      setAlacenaVacia(sinAlacena);
      setRecetas(lista);
    } catch (e: any) {
      if (numero !== peticion.current) return;
      setError('No pudimos cargar las recetas. Revisa tu conexión.');
    } finally {
      if (numero === peticion.current) setCargando(false);
    }
  }, [busqueda]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { recetas, alacenaVacia, cargando, error, recargar: cargar };
}
