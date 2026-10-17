import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Perfil } from '../types/database';
import { log } from '../lib/log'; 

/**
 * useUserProfile
 * da la bienvenida al usuario
 */
export function useUserProfile() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);

    const {
      data: { user },
      error: errorSesion,
    } = await supabase.auth.getUser();

    if (errorSesion || !user) {
      setError('No hay una sesión activa.');
      setCargando(false);
      return;
    }

    const { data, error: errorPerfil } = await supabase
      .from('perfiles')
      .select('id, alias, nombre, personas_hogar')
      .eq('id', user.id)
      .single();

    if (errorPerfil) {
      log('[perfil] cargar:', errorPerfil); setError('No pudimos cargar tu perfil.');
    } else {
      setPerfil(data as Perfil);
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { perfil, cargando, error, recargar: cargar };
}