import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function useAccionesAlbum(albumId: number) {
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function renombrar(nombre: string) {
    const limpio = nombre.trim();
    if (!limpio) {
      setError('Escribe un nombre para la colección.');
      return false;
    }
    setOcupado(true);
    setError(null);
    const { error: errorCambio } = await supabase.from('albumes').update({ nombre: limpio }).eq('id', albumId);
    setOcupado(false);
    if (errorCambio) {
      setError('No pudimos cambiar el nombre. Inténtalo de nuevo.');
      return false;
    }
    return true;
  }

  async function eliminar() {
    setOcupado(true);
    setError(null);
    const { error: errorRecetas } = await supabase.from('album_recetas').delete().eq('album_id', albumId);
    const { error: errorAlbum } = errorRecetas
      ? { error: errorRecetas }
      : await supabase.from('albumes').delete().eq('id', albumId);
    setOcupado(false);
    if (errorAlbum) {
      setError('No pudimos eliminar la colección. Inténtalo de nuevo.');
      return false;
    }
    return true;
  }

  return { renombrar, eliminar, ocupado, error, limpiarError: () => setError(null) };
}
