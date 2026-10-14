import {
    useCallback,
    useEffect,
    useState,
  } from 'react';
  
  import { supabase } from '../lib/supabase';
  
  import {
    AlbumConConteo,
  } from '../types/database';
  
  
  export function useAlbums() {
    const [albumes, setAlbumes] =
      useState<AlbumConConteo[]>([]);
  
    const [cargando, setCargando] =
      useState(true);
  
    const [error, setError] =
      useState<string | null>(null);
  
  
    const cargar = useCallback(async () => {
      setCargando(true);
      setError(null);
  
      try {
  
        // Usuario actual
        const {
          data: usuarioData,
          error: errorUsuario,
        } = await supabase.auth.getUser();
  
        if (errorUsuario) {
          throw errorUsuario;
        }
  
        const usuario = usuarioData.user;
  
        if (!usuario) {
          throw new Error(
            'No hay una sesión activa.'
          );
        }
  
  
        // Traer álbumes del usuario
        const {
          data: albumesData,
          error: errorAlbumes,
        } = await supabase
          .from('albumes')
          .select(`
            id,
            usuario_id,
            nombre,
            tipo,
            creado_en
          `)
          .eq('usuario_id', usuario.id)
          .order('creado_en', {
            ascending: true,
          });
  
        if (errorAlbumes) {
          throw errorAlbumes;
        }
  
  
        const idsAlbumes =
          (albumesData ?? []).map(
            (album) => album.id
          );
  
  
        let relaciones: {
          album_id: number;
          receta_id: number;
        }[] = [];
  
  
        // Contar recetas de cada álbum
        if (idsAlbumes.length > 0) {
  
          const {
            data: relacionesData,
            error: errorRelaciones,
          } = await supabase
            .from('album_recetas')
            .select(
              'album_id, receta_id'
            )
            .in(
              'album_id',
              idsAlbumes
            );
  
          if (errorRelaciones) {
            throw errorRelaciones;
          }
  
          relaciones =
            relacionesData ?? [];
        }
  
  
        const resultado =
          (albumesData ?? []).map(
            (album) => {
  
              const cantidad =
                relaciones.filter(
                  (relacion) =>
                    relacion.album_id ===
                    album.id
                ).length;
  
              return {
                ...album,
                cantidad_recetas: cantidad,
              };
  
            }
          ) as AlbumConConteo[];
  
  
        setAlbumes(resultado);
  
      } catch (e: any) {
  
        setError(
          e.message ??
          'No se pudieron cargar tus colecciones.'
        );
  
      } finally {
  
        setCargando(false);
  
      }
  
    }, []);
  
  
    useEffect(() => {
  
      const ejecutarCarga =
        async () => {
          await cargar();
        };
  
      void ejecutarCarga();
  
    }, [cargar]);
  
  
    // Crear colección personalizada
    async function crearAlbum(
      nombre: string
    ) {
  
      setError(null);
  
      try {
  
        const nombreLimpio =
          nombre.trim();
  
        if (!nombreLimpio) {
          setError(
            'Escribe un nombre para la colección.'
          );
  
          return false;
        }
  
  
        const {
          data: usuarioData,
          error: errorUsuario,
        } = await supabase.auth.getUser();
  
        if (errorUsuario) {
          throw errorUsuario;
        }
  
        const usuario =
          usuarioData.user;
  
        if (!usuario) {
          throw new Error(
            'No hay una sesión activa.'
          );
        }
  
  
        const {
            data: albumCreado,
            error: errorInsertar,
          } = await supabase
            .from('albumes')
            .insert({
              usuario_id: usuario.id,
              nombre: nombreLimpio,
              tipo: 'propio',
            })
            .select(`
              id,
              usuario_id,
              nombre,
              tipo,
              creado_en
            `)
            .single();
          
          if (errorInsertar) {
            throw errorInsertar;
          }
          
          await cargar();
          
          return albumCreado;
  
      } catch (e: any) {
  
        setError(
          e.message ??
          'No se pudo crear la colección.'
        );
  
        return null;
      }
    }

    async function agregarRecetaAAlbum(
        albumId: number,
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
      
          // 23505 significa que ya estaba
          // dentro de esa colección.
          if (
            errorInsertar &&
            errorInsertar.code !== '23505'
          ) {
            throw errorInsertar;
          }
      
          await cargar();
      
          return true;
        } catch (e: any) {
          setError(
            e.message ??
              'No se pudo agregar la receta a la colección.'
          );
      
          return false;
        }
      }
  
  
    return {
      albumes,
      cargando,
      error,
  
      recargar: cargar,
      crearAlbum,
      agregarRecetaAAlbum,
    };
  }