import { useCallback, useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';

import {
  MomentoComida,
  PlanSemanalItem,
} from '../types/database';


// Convierte una fecha LOCAL a YYYY-MM-DD.
// No usamos toISOString() para evitar cambios de día por zona horaria.
export function formatearFechaLocal(fecha: Date): string {
  const year = fecha.getFullYear();

  const month = String(
    fecha.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    fecha.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}


// Convierte YYYY-MM-DD a Date local
export function fechaDesdeTexto(fecha: string): Date {
  const [year, month, day] =
    fecha.split('-').map(Number);

  return new Date(
    year,
    month - 1,
    day
  );
}


// Obtiene el lunes de la semana
export function inicioDeSemana(fecha: Date): Date {
  const resultado = new Date(fecha);

  const dia = resultado.getDay();

  // Domingo = 0
  // Lunes = 1
  const diferencia = dia === 0 ? -6 : 1 - dia;

  resultado.setDate(
    resultado.getDate() + diferencia
  );

  resultado.setHours(0, 0, 0, 0);

  return resultado;
}


// Suma días
export function sumarDias(
  fecha: Date,
  cantidad: number
): Date {
  const resultado = new Date(fecha);

  resultado.setDate(
    resultado.getDate() + cantidad
  );

  return resultado;
}


// Hook del planificador completo
export function useWeeklyPlanner(
  fechaReferencia: Date
) {
  const [items, setItems] =
    useState<PlanSemanalItem[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);


  const fechaClave =
    formatearFechaLocal(fechaReferencia);


  // Cargar la semana completa
  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);

    try {
      const referencia =
        fechaDesdeTexto(fechaClave);

      const inicio =
        inicioDeSemana(referencia);

      const fin =
        sumarDias(inicio, 6);

      const fechaInicio =
        formatearFechaLocal(inicio);

      const fechaFin =
        formatearFechaLocal(fin);


      const {
        data,
        error: errorConsulta,
      } = await supabase
        .from('plan_semanal')
        .select(`
          id,
          fecha,
          momento,
          receta_id,
          recetas(
            id,
            nombre,
            tiempo_min,
            foto_url
          )
        `)
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin)
        .order('fecha');


      if (errorConsulta) {
        throw errorConsulta;
      }


      setItems(
        (data ?? []) as unknown as PlanSemanalItem[]
      );

    } catch (e: any) {

      setError(
        e.message ??
        'No se pudo cargar tu plan semanal.'
      );

    } finally {

      setCargando(false);

    }

  }, [fechaClave]);


  useEffect(() => {
    const ejecutarCarga = async () => {
      await cargar();
    };
  
    void ejecutarCarga();
  }, [cargar]);
  


  // Agregar o reemplazar receta
  async function guardarReceta(
    fecha: string,
    momento: MomentoComida,
    recetaId: number
  ) {
    setError(null);
  
    try {
  
      // Las bebidas sí pueden tener varias recetas el mismo día.
      if (momento === 'bebida') {
  
        const { error: errorInsertar } = await supabase
          .from('plan_semanal')
          .insert({
            fecha,
            momento,
            receta_id: recetaId,
          });
  
        if (errorInsertar) {
          throw errorInsertar;
        }
  
      } else {
  
        // En desayuno, comida y cena solo puede existir UNA receta.
        // Consultamos directamente a Supabase en vez de confiar
        // únicamente en el estado local "items".
        const {
          data: existente,
          error: errorBuscar,
        } = await supabase
          .from('plan_semanal')
          .select('id')
          .eq('fecha', fecha)
          .eq('momento', momento)
          .maybeSingle();
  
        if (errorBuscar) {
          throw errorBuscar;
        }
  
        if (existente) {
  
          // Ya había una receta → la reemplazamos.
          const { error: errorActualizar } = await supabase
            .from('plan_semanal')
            .update({
              receta_id: recetaId,
            })
            .eq('id', existente.id);
  
          if (errorActualizar) {
            throw errorActualizar;
          }
  
        } else {
  
          // No había receta → creamos una nueva.
          const { error: errorInsertar } = await supabase
            .from('plan_semanal')
            .insert({
              fecha,
              momento,
              receta_id: recetaId,
            });
  
          if (errorInsertar) {
            throw errorInsertar;
          }
        }
      }
  
      // Refresca la información después del cambio.
      await cargar();
  
      return true;
  
    } catch (e: any) {
  
      console.log(
        '[useWeeklyPlanner] Error al guardar receta:',
        e.code,
        e.message
      );
  
      // Mensaje más amigable si se produce el conflicto de duplicado.
      if (e.code === '23505') {
        setError(
          'Ya tienes una receta planeada para este momento. Intenta cambiarla nuevamente.'
        );
      } else {
        setError(
          e.message ??
          'No se pudo guardar la receta.'
        );
      }
  
      return false;
    }
  }


  // Eliminar algo del plan
  async function eliminarItem(id: number) {

    setError(null);

    try {

      const {
        error: errorEliminar,
      } = await supabase
        .from('plan_semanal')
        .delete()
        .eq('id', id);


      if (errorEliminar) {
        throw errorEliminar;
      }


      await cargar();

      return true;

    } catch (e: any) {

      setError(
        e.message ??
        'No se pudo eliminar del plan.'
      );

      return false;
    }

  }


  return {
    items,
    cargando,
    error,

    recargar: cargar,

    guardarReceta,
    eliminarItem,
  };
}