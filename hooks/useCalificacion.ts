import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { MAX_COMENTARIO } from './useComentarios';

export function useCalificacion(recetaId: number) {
  const [miCalificacion, setMiCalificacion] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(async () => {
    const { data: sesion } = await supabase.auth.getSession();
    const usuario = sesion.session?.user;
    if (!usuario) return;

    const { data } = await supabase
      .from('calificaciones')
      .select('estrellas')
      .eq('receta_id', recetaId)
      .eq('usuario_id', usuario.id)
      .maybeSingle();

    setMiCalificacion(data?.estrellas ?? null);
  }, [recetaId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const enviar = useCallback(
    async (estrellas: number, comentario: string) => {
      const { data: sesion } = await supabase.auth.getSession();
      const usuario = sesion.session?.user;
      if (!usuario || estrellas < 1 || estrellas > 5) return false;

      setEnviando(true);
      const { error } = await supabase
        .from('calificaciones')
        .upsert(
          { usuario_id: usuario.id, receta_id: recetaId, estrellas },
          { onConflict: 'usuario_id,receta_id' }
        );

      let ok = !error;
      const texto = comentario.trim().slice(0, MAX_COMENTARIO);
      if (ok && texto) {
        const resultado = await supabase.from('comentarios').insert({ receta_id: recetaId, texto });
        ok = !resultado.error;
      }

      setEnviando(false);
      if (ok) setMiCalificacion(estrellas);
      return ok;
    },
    [recetaId]
  );

  return { miCalificacion, enviando, enviar };
}