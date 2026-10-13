import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { textoError } from '../lib/errores';
import { ordenPasillo } from '../constants/categorias';
import { IngredienteCatalogo } from '../types/alacena';


export function useIngredientes(activo: boolean) {
  const [ingredientes, setIngredientes] = useState<IngredienteCatalogo[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    const { data, error: errorConsulta } = await supabase
      .from('ingredientes')
      .select('id, nombre, categoria, unidad, imagen_url')
      .order('nombre');
    if (errorConsulta) setError(textoError(errorConsulta));
    else setIngredientes((data ?? []) as IngredienteCatalogo[]);
    setCargando(false);
  }, []);

  
  useEffect(() => {
    if (activo && ingredientes.length === 0 && !cargando) cargar();
  }, [activo]);

  const categorias = useMemo(() => {
    const set = new Set<string>();
    ingredientes.forEach((i) => set.add(i.categoria ?? 'Otros'));
    return Array.from(set).sort(
      (a, b) => ordenPasillo(a) - ordenPasillo(b) || a.localeCompare(b, 'es')
    );
  }, [ingredientes]);

  return { ingredientes, categorias, cargando, error, recargar: cargar };
}