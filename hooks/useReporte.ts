import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';

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
      const texto = detalle.trim().slice(0, MAX_DETALLE_REPORTE);

      setEnviando(true);
      const { error } = await supabase.from('reportes').insert({
        receta_id: recetaId,
        motivo,
        detalle: motivo === 'otro' && texto ? texto : null,
      });
      setEnviando(false);

      if (!error) return 'ok';
      if (error.code === '23505') return 'repetido';
      return 'error';
    },
    [recetaId]
  );

  return { enviando, reportar };
}