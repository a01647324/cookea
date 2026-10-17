import {
    useCallback,
    useEffect,
    useState,
  } from 'react';
  import { log } from '../lib/log';
  import { supabase } from '../lib/supabase';
  
  import {
    RecetaResumen,
  } from '../types/database';
  
  
  export function useAlbumRecipes(
    albumId: number
  ) {
  
    const [recetas, setRecetas] =
      useState<RecetaResumen[]>([]);
  
    const [cargando, setCargando] =
      useState(true);
  
    const [error, setError] =
      useState<string | null>(null);
  
  
    const cargar = useCallback(async () => {
  
      setCargando(true);
      setError(null);
  
      try {
  
        const {
          data,
          error: errorConsulta,
        } = await supabase
          .from('album_recetas')
          .select(`
            receta_id,
            agregado_en,
            recetas(
              id,
              nombre,
              tiempo_min,
              foto_url
            )
          `)
          .eq('album_id', albumId)
          .order(
            'agregado_en',
            {
              ascending: false,
            }
          );
  
  
        if (errorConsulta) {
          throw errorConsulta;
        }
  
  
        const resultado =
          (data ?? [])
            .map(
              (fila: any) =>
                fila.recetas
            )
            .filter(
              (receta): receta is RecetaResumen =>
                receta != null
            );
  
  
        setRecetas(resultado);
  
      } catch (e: any) {
  
        log('[album] cargar recetas:', e);
setError('No se pudieron cargar las recetas.');
        
  
      } finally {
  
        setCargando(false);
  
      }
  
    }, [albumId]);
  
  
    useEffect(() => {
  
      const ejecutarCarga =
        async () => {
          await cargar();
        };
  
      void ejecutarCarga();
  
    }, [cargar]);
  
  
    async function agregarReceta(
      recetaId: number
    ) {
  
      setError(null);
  
      try {
  
        const {
          error: errorInsertar,
        } = await supabase
          .from('album_recetas')
          .insert({
            album_id: albumId,
            receta_id: recetaId,
          });
  
  
        // Ya estaba en la colección
        if (
          errorInsertar &&
          errorInsertar.code !== '23505'
        ) {
          throw errorInsertar;
        }
  
  
        await cargar();
  
        return true;
  
      } catch (e: any) {
  
  
        log('[album] agregar receta:', e);
setError('No se pudo agregar la receta');
  
        return false;
      }
    }
  
  
    async function quitarReceta(
      recetaId: number
    ) {
  
      setError(null);
  
      try {
  
        const {
          error: errorEliminar,
        } = await supabase
          .from('album_recetas')
          .delete()
          .eq(
            'album_id',
            albumId
          )
          .eq(
            'receta_id',
            recetaId
          );
  
  
        if (errorEliminar) {
          throw errorEliminar;
        }
  
  
        await cargar();
  
        return true;
  
      } catch (e: any) {
  
        log('[album] quitar receta:', e);
setError('No se pudo quitar la receta.');
  
        return false;
      }
    }
  
  
    return {
      recetas,
      cargando,
      error,
  
      recargar: cargar,
      agregarReceta,
      quitarReceta,
    };
  }