import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Perfil } from '../types/database';

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
      setError(errorPerfil.message);
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