import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { MomentoComida, PlanSemanalItem } from '../types/database';

export interface DiaPlan {
  fecha: string; // YYYY-MM-DD
  etiqueta: string; // Lunes, Martes...
  item: PlanSemanalItem | null;
}

const DIAS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

const PRIORIDAD_MOMENTO: MomentoComida[] = [
  'comida',
  'cena',
  'desayuno',
  'bebida',
];

// Fecha local para evitar problemas de zona horaria
function formatearFecha(fecha: Date): string {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function useWeekPlan() {
  const [dias, setDias] = useState<DiaPlan[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);

    const hoy = new Date();

    // Encontrar lunes de esta semana
    const inicioSemana = new Date(hoy);

    const diaActual = hoy.getDay();

    // domingo = 0
    // lunes = 1
    const diferencia = diaActual === 0 ? -6 : 1 - diaActual;

    inicioSemana.setDate(hoy.getDate() + diferencia);

    const fechas: string[] = [];

    // Crear lunes -> domingo
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(inicioSemana);

      fecha.setDate(inicioSemana.getDate() + i);

      fechas.push(formatearFecha(fecha));
    }

    const { data, error: errorPlan } = await supabase
      .from('plan_semanal')
      .select(
        'id, fecha, momento, receta_id, recetas(id, nombre, tiempo_min, foto_url)'
      )
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

      const filasDelDia = filas.filter(
        (fila) => fila.fecha === fecha
      );

      let elegido: PlanSemanalItem | null = null;

      // Escogemos una receta representativa para el resumen del Home
      for (const momento of PRIORIDAD_MOMENTO) {
        const encontrada = filasDelDia.find(
          (fila) => fila.momento === momento
        );

        if (encontrada) {
          elegido = encontrada;
          break;
        }
      }

      return {
        fecha,
        etiqueta,
        item: elegido,
      };
    });

    setDias(resultado);
    setCargando(false);
  }, []);

  useEffect(() => {
    const ejecutarCarga = async () => {
      await cargar();
    };
  
    void ejecutarCarga();
  }, [cargar]);

  return {
    dias,
    cargando,
    error,
    recargar: cargar,
  };
}