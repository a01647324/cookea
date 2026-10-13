import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { textoError } from '../lib/errores';
import { PaqueteBamx } from '../types/alacena';

export function usePaquetesBamx(activo: boolean) {
  const [paquetes, setPaquetes] = useState<PaqueteBamx[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    const { data, error: errorConsulta } = await supabase
      .from('paquetes_bamx')
      .select(
        `id, nombre, descripcion,
         paquete_bamx_ingredientes(ingrediente_id, cantidad, variable, ingredientes(id, nombre, categoria, unidad, imagen_url))`
      )
      .eq('activo', true)
      .order('nombre');

    if (errorConsulta) setError(textoError(errorConsulta));
    else {
      const limpio = ((data ?? []) as unknown as PaqueteBamx[]).map((p) => ({
        ...p,
        paquete_bamx_ingredientes: (p.paquete_bamx_ingredientes ?? []).map((pi) => ({
          ...pi,
          cantidad: Number(pi.cantidad),
        })),
      }));
      setPaquetes(limpio);
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    if (activo) cargar();
  }, [activo, cargar]);

  return { paquetes, cargando, error, recargar: cargar };
}