import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { MomentoComida, PlanSemanalItem } from '../types/database';

export interface DiaPlan {
  fecha: string; // 'YYYY-MM-DD'
  etiqueta: string; // 'Lunes', 'Martes', ...
  item: PlanSemanalItem | null; // null = "NO ASIGNADO"
}

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const PRIORIDAD_MOMENTO: MomentoComida[] = ['comida', 'cena', 'desayuno', 'bebida'];

function formatearFecha(fecha: Date): string {
  return fecha.toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

export function useWeekPlan(diasAMostrar: number = 2) {
  const [dias, setDias] = useState<DiaPlan[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);

    const hoy = new Date();
    const fechas: string[] = [];
    for (let i = 0; i < diasAMostrar; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      fechas.push(formatearFecha(fecha));
    }

    const { data, error: errorPlan } = await supabase
      .from('plan_semanal')
      .select('id, fecha, momento, receta_id, recetas(id, nombre, tiempo_min, foto_url)')
      .in('fecha', fechas);

    if (errorPlan) {
      setError(errorPlan.message);
      setCargando(false);
      return;
    }

    const filas = (data ?? []) as unknown as PlanSemanalItem[];

    const resultado: DiaPlan[] = fechas.map((fecha) => {
      const fechaLocal = new Date(fecha + 'T00:00:00');
      const etiqueta = DIAS[fechaLocal.getDay()];

      const filasDelDia = filas.filter((f) => f.fecha === fecha);
      let elegido: PlanSemanalItem | null = null;
      for (const momento of PRIORIDAD_MOMENTO) {
        const encontrada = filasDelDia.find((f) => f.momento === momento);
        if (encontrada) {
          elegido = encontrada;
          break;
        }
      }

      return { fecha, etiqueta, item: elegido };
    });

    setDias(resultado);
    setCargando(false);
  }, [diasAMostrar]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { dias, cargando, error, recargar: cargar };
}