import { useCallback, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { textoError } from '../lib/errores';
import { AlacenaItem, EntradaAlacena, ResultadoAccion } from '../types/alacena';

export function useAlacena() {
  const [items, setItems] = useState<AlacenaItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const yaCargoUnaVez = useRef(false);

  const cargar = useCallback(async () => {
    if (!yaCargoUnaVez.current) setCargando(true);
    setError(null);

    const { data, error: errorConsulta } = await supabase
      .from('alacena_items')
      .select(
        'id, ingrediente_id, cantidad, agregado_en, usar_pronto, ingredientes(id, nombre, categoria, unidad, imagen_url)'
      )
      .order('agregado_en', { ascending: false });

    if (errorConsulta) {
      setError(textoError(errorConsulta));
    } else {
      setItems(
        ((data ?? []) as unknown as AlacenaItem[]).map((i) => ({ ...i, cantidad: Number(i.cantidad) }))
      );
      yaCargoUnaVez.current = true;
    }
    setCargando(false);
  }, []);

  const agregarVarios = useCallback(
    async (entradas: EntradaAlacena[]): Promise<ResultadoAccion> => {
      if (entradas.length === 0) return { ok: true };

      const combinadas = new Map<number, number>();
      for (const e of entradas) {
        combinadas.set(e.ingrediente_id, (combinadas.get(e.ingrediente_id) ?? 0) + e.cantidad);
      }

      const { data: actuales, error: errorLeer } = await supabase
        .from('alacena_items')
        .select('id, ingrediente_id, cantidad');
      if (errorLeer) return { ok: false, mensaje: textoError(errorLeer) };

      const existentes = new Map<number, { id: number; cantidad: number }>(
        (actuales ?? []).map((a: any) => [a.ingrediente_id, { id: a.id, cantidad: Number(a.cantidad) }])
      );

      const paraInsertar: EntradaAlacena[] = [];
      const paraSumar: { id: number; cantidad: number }[] = [];
      combinadas.forEach((cantidad, ingrediente_id) => {
        const ya = existentes.get(ingrediente_id);
        if (ya) paraSumar.push({ id: ya.id, cantidad: ya.cantidad + cantidad });
        else paraInsertar.push({ ingrediente_id, cantidad });
      });

      if (paraInsertar.length > 0) {
        const { error: errorInsertar } = await supabase.from('alacena_items').insert(paraInsertar);
        if (errorInsertar) return { ok: false, mensaje: textoError(errorInsertar) };
      }

      for (const s of paraSumar) {
        const { error: errorSumar } = await supabase
          .from('alacena_items')
          .update({ cantidad: s.cantidad })
          .eq('id', s.id);
        if (errorSumar) return { ok: false, mensaje: textoError(errorSumar) };
      }

      await cargar();
      return { ok: true };
    },
    [cargar]
  );

  const cambiarCantidad = useCallback(
    async (item: AlacenaItem, nuevaCantidad: number): Promise<ResultadoAccion> => {
      const anterior = item.cantidad;
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, cantidad: nuevaCantidad } : i)));

      const { data: actualizados, error: errorUpdate } = await supabase
        .from('alacena_items')
        .update({ cantidad: nuevaCantidad })
        .eq('id', item.id)
        .select('id');

      if (errorUpdate || !actualizados || actualizados.length === 0) {
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, cantidad: anterior } : i)));
        return { ok: false, mensaje: errorUpdate ? textoError(errorUpdate) : 'No se pudo actualizar la cantidad.' };
      }
      return { ok: true };
    },
    []
  );

  const fijarUsarPronto = useCallback(
    async (item: AlacenaItem, valor: boolean): Promise<ResultadoAccion> => {
      const anterior = item.usar_pronto;
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, usar_pronto: valor } : i)));

      const { data: actualizados, error: errorUpdate } = await supabase
        .from('alacena_items')
        .update({ usar_pronto: valor })
        .eq('id', item.id)
        .select('id');

      if (errorUpdate || !actualizados || actualizados.length === 0) {
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, usar_pronto: anterior } : i)));
        return { ok: false, mensaje: errorUpdate ? textoError(errorUpdate) : 'No se pudo actualizar.' };
      }
      return { ok: true };
    },
    []
  );

  const eliminar = useCallback(
    async (item: AlacenaItem): Promise<ResultadoAccion> => {
      const copia = items;
      setItems((prev) => prev.filter((i) => i.id !== item.id));

      const { data: borrados, error: errorDelete } = await supabase
        .from('alacena_items')
        .delete()
        .eq('id', item.id)
        .select('id');

      if (errorDelete || !borrados || borrados.length === 0) {
        setItems(copia); 
        return {
          ok: false,
          mensaje: errorDelete ? textoError(errorDelete) : 'No se pudo eliminar. Inténtalo de nuevo.',
        };
      }
      return { ok: true };
    },
    [items]
  );

  return { items, cargando, error, cargar, agregarVarios, cambiarCantidad, fijarUsarPronto, eliminar };
}