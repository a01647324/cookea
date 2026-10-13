import { supabase } from './supabase';
import { textoError } from './errores';

export interface Descuento {
  ingrediente_id: number;
  cantidad: number;
}

export interface StockAlacena {
  id: number; 
  cantidad: number;
}

export interface ResultadoPreparada {
  ok: boolean;
  mensaje?: string;
  descontados: number; 
  agotados: number; 
  noEstaban: number; 
  alacenaModificada: boolean; 
}

const redondear = (n: number) => Math.round(n * 100) / 100;

function resultadoVacio(): ResultadoPreparada {
  return { ok: false, descontados: 0, agotados: 0, noEstaban: 0, alacenaModificada: false };
}
export async function leerStock(ids: number[]): Promise<Map<number, StockAlacena>> {
  const mapa = new Map<number, StockAlacena>();
  if (ids.length === 0) return mapa;

  const { data, error } = await supabase
    .from('alacena_items')
    .select('id, ingrediente_id, cantidad')
    .in('ingrediente_id', ids);

  if (error) {
    textoError(error); 
    return mapa;
  }
  (data ?? []).forEach((f: any) => {
    mapa.set(f.ingrediente_id, { id: f.id, cantidad: Number(f.cantidad) });
  });
  return mapa;
}

async function registrarEnAlbum(recetaId: number): Promise<{ ok: boolean; mensaje?: string }> {
  const { data: album, error: errorAlbum } = await supabase
    .from('albumes')
    .select('id')
    .eq('tipo', 'ya_preparadas')
    .maybeSingle();

  if (errorAlbum) return { ok: false, mensaje: textoError(errorAlbum) };
  if (!album) return { ok: false, mensaje: 'No encontramos tu álbum "Ya preparadas".' };

  const { error: errorInsertar } = await supabase
    .from('album_recetas')
    .insert({ album_id: album.id, receta_id: recetaId });

  if (errorInsertar && errorInsertar.code !== '23505') {
    return { ok: false, mensaje: textoError(errorInsertar) };
  }
  return { ok: true };
}


export async function soloRegistrar(recetaId: number): Promise<ResultadoPreparada> {
  const r = await registrarEnAlbum(recetaId);
  return { ...resultadoVacio(), ok: r.ok, mensaje: r.mensaje };
}

export async function descontarYRegistrar(
  recetaId: number,
  descuentos: Descuento[]
): Promise<ResultadoPreparada> {
  const resultado = resultadoVacio();

  if (descuentos.length > 0) {
    const ids = descuentos.map((d) => d.ingrediente_id);
    const { data: filas, error: errorLeer } = await supabase
      .from('alacena_items')
      .select('id, ingrediente_id, cantidad')
      .in('ingrediente_id', ids);

    if (errorLeer) return { ...resultado, mensaje: textoError(errorLeer) };

    const stock = new Map<number, StockAlacena>(
      (filas ?? []).map((f: any) => [f.ingrediente_id, { id: f.id, cantidad: Number(f.cantidad) }])
    );

    for (const d of descuentos) {
      const fila = stock.get(d.ingrediente_id);
      if (!fila) {
        resultado.noEstaban += 1; 
        continue;
      }

      const restante = redondear(fila.cantidad - d.cantidad);

      const { data: afectados, error: errorCambio } =
        restante <= 0
          ? await supabase.from('alacena_items').delete().eq('id', fila.id).select('id')
          : await supabase.from('alacena_items').update({ cantidad: restante }).eq('id', fila.id).select('id');

      if (errorCambio || !afectados || afectados.length === 0) {
        return {
          ...resultado,
          mensaje: errorCambio ? textoError(errorCambio) : 'No se pudo actualizar tu alacena. Inténtalo de nuevo.',
          alacenaModificada: resultado.descontados > 0,
        };
      }

      resultado.descontados += 1;
      if (restante <= 0) resultado.agotados += 1;
      resultado.alacenaModificada = true;
    }
  }

  const album = await registrarEnAlbum(recetaId);
  if (!album.ok) {
    return {
      ...resultado,
      mensaje: resultado.alacenaModificada
        ? `Tu alacena ya se actualizó, pero no pudimos guardar la receta en "Ya preparadas". ${album.mensaje ?? ''}`.trim()
        : album.mensaje,
    };
  }

  return { ...resultado, ok: true };
}