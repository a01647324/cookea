import { SENAL_AFINIDAD } from '../../constants/recomendador';
import { esBasico } from './cobertura';
import { Historial, RecetaParaRecomendar } from './tipos';
export type PerfilGustos = Map<number, number>; 

function pesoDeReceta(recetaId: number, h: Historial): number {
  let peso = 0;
  if (h.favoritas.has(recetaId)) peso += SENAL_AFINIDAD.favorita;
  if (h.preparadas.has(recetaId)) peso += SENAL_AFINIDAD.preparada;
  if (h.hacerDespues.has(recetaId)) peso += SENAL_AFINIDAD.hacerDespues;

  const estrellas = h.calificaciones.get(recetaId);
  if (estrellas !== undefined) {
    if (estrellas >= 4) peso += SENAL_AFINIDAD.calificacionAlta;
    else if (estrellas <= 2) peso += SENAL_AFINIDAD.calificacionBaja;
  }
  return peso;
}

function ingredientesDeGusto(receta: RecetaParaRecomendar) {
  return receta.ingredientes.filter((i) => !esBasico(i.nombre) && i.grupo !== 'neutro');
}

export function construirPerfil(recetas: RecetaParaRecomendar[], h: Historial): PerfilGustos {
  const perfil: PerfilGustos = new Map();
  for (const receta of recetas) {
    const peso = pesoDeReceta(receta.id, h);
    if (peso === 0) continue;
    for (const ing of ingredientesDeGusto(receta)) {
      perfil.set(ing.ingrediente_id, (perfil.get(ing.ingrediente_id) ?? 0) + peso);
    }
  }
  return perfil;
}

export function calcularAfinidad(receta: RecetaParaRecomendar, perfil: PerfilGustos): number | null {
  if (perfil.size === 0) return null;

  let maxAbs = 0;
  perfil.forEach((v) => {
    maxAbs = Math.max(maxAbs, Math.abs(v));
  });
  if (maxAbs === 0) return null;

  const ingredientes = ingredientesDeGusto(receta);
  if (ingredientes.length === 0) return 0.5;

  let suma = 0;
  for (const ing of ingredientes) {
    const normalizado = (perfil.get(ing.ingrediente_id) ?? 0) / maxAbs; 
    suma += normalizado;
  }
  const promedio = suma / ingredientes.length; 
  return (Math.max(-1, Math.min(1, promedio)) + 1) / 2;
}