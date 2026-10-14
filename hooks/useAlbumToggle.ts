import {
    useCallback,
    useEffect,
    useState,
  } from 'react';
  
  import { supabase } from '../lib/supabase';
  
  type TipoAlbumToggle =
    | 'favoritos'
    | 'hacer_despues';
  
  export function useAlbumToggle(
    recetaId: number | null,
    tipo: TipoAlbumToggle
  ) {
    const [activo, setActivo] =
      useState(false);
  
    const [cargando, setCargando] =
      useState(true);
  
    const [error, setError] =
      useState<string | null>(null);
  
  
    const verificarEstado =
      useCallback(async () => {
        if (recetaId == null) {
          setCargando(false);
          return;
        }
  
        setCargando(true);
        setError(null);
  
        try {
          const {
            data: album,
            error: errorAlbum,
          } = await supabase
            .from('albumes')
            .select('id')
            .eq('tipo', tipo)
            .maybeSingle();
  
          if (errorAlbum) {
            throw errorAlbum;
          }
  
          if (!album) {
            throw new Error(
              `No encontramos el álbum "${tipo}".`
            );
          }
  
          const {
            data: relacion,
            error: errorRelacion,
          } = await supabase
            .from('album_recetas')
            .select('receta_id')
            .eq('album_id', album.id)
            .eq('receta_id', recetaId)
            .maybeSingle();
  
          if (errorRelacion) {
            throw errorRelacion;
          }
  
          setActivo(
            relacion != null
          );
        } catch (e: any) {
          setError(
            e.message ??
              'No se pudo verificar el álbum.'
          );
        } finally {
          setCargando(false);
        }
      }, [recetaId, tipo]);
  
  
    useEffect(() => {
      const ejecutarVerificacion =
        async () => {
          await verificarEstado();
        };
  
      void ejecutarVerificacion();
    }, [verificarEstado]);
  
  
    const alternar =
      useCallback(async () => {
        if (recetaId == null) {
          return;
        }
  
        setError(null);
  
        const {
          data: album,
          error: errorAlbum,
        } = await supabase
          .from('albumes')
          .select('id')
          .eq('tipo', tipo)
          .maybeSingle();
  
        if (errorAlbum) {
          setError(
            errorAlbum.message
          );
          return;
        }
  
        if (!album) {
          setError(
            `No encontramos el álbum "${tipo}".`
          );
          return;
        }
  
        const valorAnterior =
          activo;
  
        // Cambio visual inmediato
        setActivo(
          !valorAnterior
        );
  
        if (valorAnterior) {
          const {
            error: errorBorrar,
          } = await supabase
            .from('album_recetas')
            .delete()
            .eq(
              'album_id',
              album.id
            )
            .eq(
              'receta_id',
              recetaId
            );
  
          if (errorBorrar) {
            setActivo(
              valorAnterior
            );
  
            setError(
              errorBorrar.message
            );
          }
        } else {
          const {
            error: errorInsertar,
          } = await supabase
            .from('album_recetas')
            .insert({
              album_id: album.id,
              receta_id: recetaId,
            });
  
          if (
            errorInsertar &&
            errorInsertar.code !==
              '23505'
          ) {
            setActivo(
              valorAnterior
            );
  
            setError(
              errorInsertar.message
            );
          }
        }
      }, [
        recetaId,
        tipo,
        activo,
      ]);
  
  
    return {
      activo,
      cargando,
      error,
      alternar,
      recargar:
        verificarEstado,
    };
  }