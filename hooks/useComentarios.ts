import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Comentario } from '../types/database';

export const MAX_COMENTARIO = 500;

export function useComentarios(recetaId: number) {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);

    const { data, error: errorConsulta } = await supabase
      .from('comentarios')
      .select('id, texto, creado_en, usuario_id')
      .eq('receta_id', recetaId)
      .eq('visible', true)
      .order('creado_en', { ascending: false })
      .limit(50);

    if (errorConsulta || !data) {
      setError('No pudimos cargar los comentarios.');
      setCargando(false);
      return;
    }

    // Los alias vienen de la vista pública, nunca de "perfiles"
    const ids = [...new Set(data.map((c) => c.usuario_id as string))];
    let alias = new Map<string, string>();
    if (ids.length > 0) {
      const { data: autores } = await supabase
        .from('perfiles_publicos')
        .select('id, alias')
        .in('id', ids);
      alias = new Map((autores ?? []).map((a) => [a.id as string, a.alias as string]));
    }

    setComentarios(
      data.map((c) => ({
        id: c.id,
        texto: c.texto,
        creado_en: c.creado_en,
        usuario_id: c.usuario_id,
        alias: alias.get(c.usuario_id) ?? 'Usuario',
      }))
    );
    setCargando(false);
  }, [recetaId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const publicar = useCallback(
    async (texto: string) => {
      const limpio = texto.trim();
      if (!limpio || limpio.length > MAX_COMENTARIO) return false;

      setEnviando(true);
      const { error: errorInsertar } = await supabase
        .from('comentarios')
        .insert({ receta_id: recetaId, texto: limpio });
      setEnviando(false);

      if (errorInsertar) {
        setError('No pudimos publicar tu comentario.');
        return false;
      }
      await cargar();
      return true;
    },
    [recetaId, cargar]
  );

  const borrar = useCallback(async (id: number) => {
    const { error: errorBorrar } = await supabase.from('comentarios').delete().eq('id', id);
    if (!errorBorrar) setComentarios((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { comentarios, cargando, enviando, error, publicar, borrar, recargar: cargar };
}