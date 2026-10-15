import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { obtenerIdsRecetasConAlergia } from '../lib/alergias';
import { recomendar } from '../lib/recomendador/recomendar';
import { cargarAlacena, cargarHistorial, cargarRecetas } from './useRecomendaciones';
import { RecetaComunidad } from '../types/database';

export type OrdenComunidad = 'para_ti' | 'recientes' | 'mejor_calificadas';

// En el feed cada receta puede traer el motivo de "Para ti" (ej. "Te falta: cebolla")
export type RecetaFeed = RecetaComunidad & { motivo?: string };

export interface EtiquetaFeed {
  id: number;
  nombre: string;
}

const TAMANO_PAGINA = 10;
const LIMITE_PARA_TI = 30;
const ETIQUETAS_OCULTAS = ['Comunidad BAMX'];

// Quita los comodines de ilike (% y _) y recorta el texto
const limpiarBusqueda = (texto: string) => texto.replace(/[%_]/g, '').trim().slice(0, 50);

export function useComunidad(orden: OrdenComunidad, busqueda: string, etiquetaId: number | null) {
  const [recetas, setRecetas] = useState<RecetaFeed[]>([]);
  const [etiquetas, setEtiquetas] = useState<EtiquetaFeed[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [hayMas, setHayMas] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pagina = useRef(0);
  const peticionActual = useRef(0);
  // Filtros que se calculan al inicio y se reutilizan al pedir más páginas
  const excluidas = useRef<number[]>([]);
  const conEtiqueta = useRef<number[] | null>(null);

  useEffect(() => {
    supabase
      .from('etiquetas')
      .select('id, nombre')
      .order('nombre')
      .then(({ data }) => {
        setEtiquetas(((data ?? []) as EtiquetaFeed[]).filter((e) => !ETIQUETAS_OCULTAS.includes(e.nombre)));
      });
  }, []);

  const consultar = useCallback(
    (desde: number, cuantas: number) => {
      let consulta = supabase
        .from('recetas_comunidad')
        .select('*')
        .range(desde, desde + cuantas - 1);

      // Filtro duro: nunca llegan recetas con alérgenos del usuario o su hogar
      if (excluidas.current.length > 0) consulta = consulta.not('id', 'in', `(${excluidas.current.join(',')})`);
      if (conEtiqueta.current) consulta = consulta.in('id', conEtiqueta.current);

      const texto = limpiarBusqueda(busqueda);
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

  // Ordena las recetas del feed con el recomendador de Ana y agrega el motivo
  const ordenarParaTi = async (lista: RecetaComunidad[]): Promise<RecetaFeed[]> => {
    if (lista.length === 0) return [];
    const [todas, alacena, historial] = await Promise.all([cargarRecetas(), cargarAlacena(), cargarHistorial()]);
    const resultado = recomendar(todas, { alacena, historial, idsExcluidos: new Set(excluidas.current) });

    const porId = new Map(lista.map((r) => [r.id, r]));
    const ordenadas: RecetaFeed[] = [];
    for (const item of resultado.items) {
      const receta = porId.get(item.receta.id);
      if (!receta) continue;
      ordenadas.push({ ...receta, motivo: item.motivos[0] });
      porId.delete(item.receta.id);
    }
    // Las que el recomendador no conoce (por ejemplo, sin ingredientes) van al final
    return [...ordenadas, ...porId.values()];
  };

  const cargarInicio = useCallback(
    async (esRefresco = false) => {
      const id = ++peticionActual.current;
      esRefresco ? setRefrescando(true) : setCargando(true);
      setError(null);

      try {
        // Si no podemos saber tus alergias, no mostramos recetas a ciegas
        excluidas.current = await obtenerIdsRecetasConAlergia(true);

        if (etiquetaId != null) {
          const { data: filas, error: errorEtiqueta } = await supabase
            .from('receta_etiquetas')
            .select('receta_id')
            .eq('etiqueta_id', etiquetaId);
          if (errorEtiqueta) throw errorEtiqueta;
          conEtiqueta.current = [...new Set<number>((filas ?? []).map((f: any) => Number(f.receta_id))), -1];
        } else {
          conEtiqueta.current = null;
        }
        if (id !== peticionActual.current) return;

        const cuantas = orden === 'para_ti' ? LIMITE_PARA_TI : TAMANO_PAGINA;
        const { data, error: errorConsulta } = await consultar(0, cuantas);
        if (errorConsulta) throw errorConsulta;

        let lista: RecetaFeed[] = (data ?? []) as RecetaComunidad[];
        if (orden === 'para_ti') lista = await ordenarParaTi(lista);
        if (id !== peticionActual.current) return;

        setRecetas(lista);
        pagina.current = 0;
        setHayMas(orden !== 'para_ti' && lista.length === TAMANO_PAGINA);
      } catch {
        if (id !== peticionActual.current) return;
        setError('No pudimos cargar las recetas. Revisa tu conexión e intenta de nuevo.');
      } finally {
        if (id === peticionActual.current) {
          setCargando(false);
          setRefrescando(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [consultar, orden, etiquetaId]
  );

  const cargarMas = useCallback(async () => {
    if (cargando || cargandoMas || !hayMas || orden === 'para_ti') return;

    const id = peticionActual.current;
    const siguiente = pagina.current + 1;
    setCargandoMas(true);

    const { data, error: errorConsulta } = await consultar(siguiente * TAMANO_PAGINA, TAMANO_PAGINA);
    setCargandoMas(false);
    if (id !== peticionActual.current || errorConsulta || !data) return;

    const nuevas = data as RecetaComunidad[];
    setRecetas((prev) => {
      const ids = new Set(prev.map((r) => r.id));
      return [...prev, ...nuevas.filter((r) => !ids.has(r.id))];
    });
    pagina.current = siguiente;
    setHayMas(nuevas.length === TAMANO_PAGINA);
  }, [cargando, cargandoMas, hayMas, orden, consultar]);

  useEffect(() => {
    cargarInicio();
  }, [cargarInicio]);

  return {
    recetas,
    etiquetas,
    cargando,
    cargandoMas,
    refrescando,
    error,
    cargarMas,
    refrescar: () => cargarInicio(true),
    reintentar: () => cargarInicio(),
  };
}
