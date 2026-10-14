import { CREDITO_INSUFICIENTE, INGREDIENTES_BASICOS } from '../../constants/recomendador';
import { normalizar } from '../../constants/categorias';
import { Cobertura, FaltanteDetalle, IngredienteReceta, ItemAlacena, RecetaParaRecomendar } from './tipos';

const BASICOS = new Set(INGREDIENTES_BASICOS.map((n) => normalizar(n)));

export function esBasico(nombre: string): boolean {
  return BASICOS.has(normalizar(nombre));
}

const TOLERANCIA = 1e-6;

export function stockPorIngrediente(alacena: ItemAlacena[]): Map<number, number> {
  const mapa = new Map<number, number>();
  for (const item of alacena) {
    mapa.set(item.ingrediente_id, (mapa.get(item.ingrediente_id) ?? 0) + item.cantidad);
  }
  return mapa;
}

export function ingredientesRelevantes(receta: RecetaParaRecomendar): IngredienteReceta[] {
  return receta.ingredientes.filter((i) => !i.opcional && !esBasico(i.nombre));
}

export function calcularCobertura(receta: RecetaParaRecomendar, stock: Map<number, number>): Cobertura {
  const relevantes = ingredientesRelevantes(receta);

  let completos = 0;
  const insuficientes: FaltanteDetalle[] = [];
  const faltantes: FaltanteDetalle[] = [];

  for (const ing of relevantes) {
    const tengo = stock.get(ing.ingrediente_id) ?? 0;
    const detalle: FaltanteDetalle = {
      ingrediente_id: ing.ingrediente_id,
      nombre: ing.nombre,
      unidad: ing.unidad,
      necesito: ing.cantidad,
      tengo,
    };

    if (tengo <= 0) {
      faltantes.push(detalle);
    } else if (tengo + TOLERANCIA >= ing.cantidad) {
      completos += 1;
    } else {
      insuficientes.push(detalle);
    }
  }

  const total = relevantes.length;
  // Una receta sin ingredientes relevantes (solo agua y sal, por ejemplo) está "completa".
  const fraccion = total === 0 ? 1 : (completos + CREDITO_INSUFICIENTE * insuficientes.length) / total;

  return {
    total,
    completos,
    insuficientes,
    faltantes,
    fraccion,
    puedeCocinarYa: faltantes.length === 0 && insuficientes.length === 0,
  };
}