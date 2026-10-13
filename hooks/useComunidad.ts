import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { RecetaComunidad } from '../types/database';

export type OrdenComunidad = 'recientes' | 'mejor_calificadas';

const TAMANO_PAGINA = 10;

export function useComunidad(orden: OrdenComunidad, busqueda: string) {
  const [recetas, setRecetas] = useState<RecetaComunidad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [hayMas, setHayMas] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pagina = useRef(0);
  const peticionActual = useRef(0);

  const consultar = useCallback(
    (numPagina: number) => {
      const desde = numPagina * TAMANO_PAGINA;
      let consulta = supabase
        .from('recetas_comunidad')
        .select('*')
        .range(desde, desde + TAMANO_PAGINA - 1);

      const texto = busqueda.trim();
      if (texto) consulta = consulta.ilike('nombre', `%${texto}%`);

      if (orden === 'mejor_calificadas') {
        consulta = consulta
          .order('promedio', { ascending: false, nullsFirst: false })
          .order('total', { ascending: false });
      }

      return consulta.order('creado_en', { ascending: false });
    },
    [orden, busqueda]
  );

  const cargarInicio = useCallback(
    async (esRefresco = false) => {
      const id = ++peticionActual.current;
      esRefresco ? setRefrescando(true) : setCargando(true);
      setError(null);

      const { data, error } = await consultar(0);
      if (id !== peticionActual.current) return;

      if (error) {
        setError('No pudimos cargar las recetas. Intenta de nuevo.');
      } else {
        const lista = (data ?? []) as RecetaComunidad[];
        setRecetas(lista);
        pagina.current = 0;
        setHayMas(lista.length === TAMANO_PAGINA);
      }
      setCargando(false);
      setRefrescando(false);
    },
    [consultar]
  );

  const cargarMas = useCallback(async () => {
    if (cargando || cargandoMas || !hayMas) return;

    const id = peticionActual.current;
    const siguiente = pagina.current + 1;
    setCargandoMas(true);

    const { data, error } = await consultar(siguiente);
    setCargandoMas(false);
    if (id !== peticionActual.current || error || !data) return;

    const nuevas = data as RecetaComunidad[];
    setRecetas((prev) => {
      const ids = new Set(prev.map((r) => r.id));
      return [...prev, ...nuevas.filter((r) => !ids.has(r.id))];
    });
    pagina.current = siguiente;
    setHayMas(nuevas.length === TAMANO_PAGINA);
  }, [cargando, cargandoMas, hayMas, consultar]);

  useEffect(() => {
    cargarInicio();
  }, [cargarInicio]);

  return {
    recetas,
    cargando,
    cargandoMas,
    refrescando,
    error,
    cargarMas,
    refrescar: () => cargarInicio(true),
    reintentar: () => cargarInicio(),
  };
}