import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { log } from '../lib/log'; 
import { limpiarTexto } from '../lib/entradas';

export type MotivoReporte =
  | 'contenido_inapropiado'
  | 'informacion_peligrosa'
  | 'alergenos_incorrectos'
  | 'spam'
  | 'otro';

export type ResultadoReporte = 'ok' | 'repetido' | 'error';

export const MAX_DETALLE_REPORTE = 200;

export function useReporte(recetaId: number) {
  const [enviando, setEnviando] = useState(false);

  const reportar = useCallback(
    async (motivo: MotivoReporte, detalle: string): Promise<ResultadoReporte> => {
      const texto = limpiarTexto(detalle, MAX_DETALLE_REPORTE, { multilinea: true });;

      setEnviando(true);
      const { error } = await supabase.from('reportes').insert({
        receta_id: recetaId,
        motivo,
        detalle: motivo === 'otro' && texto ? texto : null,
      });
      setEnviando(false);

      if (!error) return 'ok';
      if (error.code === '23505') return 'repetido';
        log('[reporte] error:', error);
      return 'error';
    },
    [recetaId]
  );

  return { enviando, reportar };
}