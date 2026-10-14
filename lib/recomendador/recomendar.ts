import { NOVEDAD_YA_PREPARADA, PESOS } from '../../constants/recomendador';
import { construirPerfil, calcularAfinidad } from './afinidad';
import { calcularCobertura, stockPorIngrediente } from './cobertura';
import { calcularSalud, incluyeLosTresGrupos } from './salud';
import {
  Cobertura,
  Componentes,
  Contexto,
  OpcionesRecomendar,
  Recomendacion,
  RecetaParaRecomendar,
  ResultadoRecomendacion,
  SaludResultado,
} from './tipos';

const redondear = (n: number) => Math.round(n * 1000) / 1000;

function listaNatural(nombres: string[]): string {
  const minusculas = nombres.map((n) => n.toLowerCase());
  if (minusculas.length <= 1) return minusculas.join('');
  return `${minusculas.slice(0, -1).join(', ')} y ${minusculas[minusculas.length - 1]}`;
}

function motivoCobertura(c: Cobertura): string | null {
  if (c.total === 0) return null;
  if (c.puedeCocinarYa) return 'Tienes todo lo necesario';

  const partes: string[] = [];
  if (c.faltantes.length > 0) {
    const nombres = c.faltantes.slice(0, 3).map((f) => f.nombre);
    const extra = c.faltantes.length > 3 ? ` y ${c.faltantes.length - 3} más` : '';
    partes.push(`${c.faltantes.length === 1 ? 'Te falta' : 'Te faltan'}: ${listaNatural(nombres)}${extra}`);
  }
  if (c.insuficientes.length > 0) {
    const nombres = c.insuficientes.slice(0, 2).map((f) => f.nombre);
    partes.push(`Te alcanza poco de ${listaNatural(nombres)}`);
  }
  return partes.join('. ');
}

function motivoSalud(s: SaludResultado | null, receta: RecetaParaRecomendar): string | null {
  if (!s) return null;
  if (s.fuente === 'nom051') {
    return s.octagonos.length === 0 ? 'Sin excesos según la NOM-051' : `Ojo: ${s.octagonos.join(', ')}`;
  }
  if (s.etiqueta === 'balanceada' && incluyeLosTresGrupos(receta)) {
    return 'Plato balanceado: verduras o fruta, cereal y proteína';
  }
  return null;
}

// ---------- Puntaje de una receta ----------
interface Auxiliares {
  stock: Map<number, number>;
  idsPronto: Map<number, string>; 
  perfil: ReturnType<typeof construirPerfil>;
  hayAlacena: boolean;
}

function puntuarReceta(receta: RecetaParaRecomendar, ctx: Contexto, aux: Auxiliares): Recomendacion {
  const cobertura = calcularCobertura(receta, aux.stock);
  const salud = calcularSalud(receta);
  const componentes: Componentes = {};

  if (aux.hayAlacena) componentes.cobertura = cobertura.fraccion;


  const usaPronto: string[] = [];
  if (aux.idsPronto.size > 0) {
    for (const ing of receta.ingredientes) {
      if (!ing.opcional && aux.idsPronto.has(ing.ingrediente_id)) usaPronto.push(ing.nombre);
    }
    componentes.usarPronto = Math.min(1, usaPronto.length / Math.min(aux.idsPronto.size, 3));
  }

  const afinidad = calcularAfinidad(receta, aux.perfil);
  if (afinidad !== null) componentes.afinidad = afinidad;

  if (salud) componentes.salud = salud.score;
  componentes.novedad = ctx.historial.preparadas.has(receta.id) ? NOVEDAD_YA_PREPARADA : 1;

  let suma = 0;
  let pesos = 0;
  (Object.keys(componentes) as (keyof Componentes)[]).forEach((clave) => {
    const valor = componentes[clave];
    if (valor === undefined) return;
    suma += PESOS[clave] * valor;
    pesos += PESOS[clave];
  });
  const puntaje = pesos > 0 ? suma / pesos : 0;

  const motivos: string[] = [];
  if (aux.hayAlacena) {
    const m = motivoCobertura(cobertura);
    if (m) motivos.push(m);
  }
  if (usaPronto.length > 0) motivos.push(`Gasta ${listaNatural(usaPronto)} que debes usar pronto`);
  if (afinidad !== null && afinidad >= 0.65) motivos.push('Se parece a recetas que te gustaron');
  const ms = motivoSalud(salud, receta);
  if (ms) motivos.push(ms);

  return { receta, puntaje: redondear(puntaje), componentes, cobertura, salud, usaPronto, motivos };
}

export function recomendar(
  recetas: RecetaParaRecomendar[],
  ctx: Contexto,
  opciones: OpcionesRecomendar = {}
): ResultadoRecomendacion {
  // 1) FILTRO DURO de alergias
  const permitidas = recetas.filter((r) => !ctx.idsExcluidos.has(r.id));

  const aux: Auxiliares = {
    stock: stockPorIngrediente(ctx.alacena),
    idsPronto: new Map(),
    perfil: construirPerfil(recetas, ctx.historial), 
    hayAlacena: ctx.alacena.some((i) => i.cantidad > 0),
  };

  const nombrePorId = new Map<number, string>();
  for (const r of recetas) for (const i of r.ingredientes) nombrePorId.set(i.ingrediente_id, i.nombre);
  for (const item of ctx.alacena) {
    if (item.usar_pronto && item.cantidad > 0) {
      aux.idsPronto.set(item.ingrediente_id, nombrePorId.get(item.ingrediente_id) ?? 'ingrediente');
    }
  }
  const puntuadas = permitidas.map((r) => puntuarReceta(r, ctx, aux));
  puntuadas.sort((a, b) => {
    if (b.puntaje !== a.puntaje) return b.puntaje - a.puntaje;
    if (a.cobertura.puedeCocinarYa !== b.cobertura.puedeCocinarYa) return a.cobertura.puedeCocinarYa ? -1 : 1;
    if (a.receta.tiempo_min !== b.receta.tiempo_min) return a.receta.tiempo_min - b.receta.tiempo_min;
    return a.receta.id - b.receta.id;
  });

  let ordenadas = puntuadas;
  if (opciones.minCobertura !== undefined && aux.hayAlacena) {
    const min = opciones.minCobertura;
    ordenadas = [
      ...puntuadas.filter((p) => p.cobertura.fraccion >= min),
      ...puntuadas.filter((p) => p.cobertura.fraccion < min),
    ];
  }

  return {
    alacenaVacia: !aux.hayAlacena,
    items: opciones.limite !== undefined ? ordenadas.slice(0, opciones.limite) : ordenadas,
  };
}

export interface SeccionRecomendada {
  clave: 'ya' | 'falta1' | 'falta2o3' | 'mas';
  titulo: string;
  data: Recomendacion[];
}

export function agruparPorFaltantes(items: Recomendacion[]): SeccionRecomendada[] {
  const ya: Recomendacion[] = [];
  const falta1: Recomendacion[] = [];
  const falta2o3: Recomendacion[] = [];
  const mas: Recomendacion[] = [];

  for (const r of items) {
    const faltan = r.cobertura.faltantes.length + r.cobertura.insuficientes.length;
    if (faltan === 0) ya.push(r);
    else if (faltan === 1) falta1.push(r);
    else if (faltan <= 3) falta2o3.push(r);
    else mas.push(r);
  }

  const secciones: SeccionRecomendada[] = [
    { clave: 'ya', titulo: 'Puedes cocinarlas ya', data: ya },
    { clave: 'falta1', titulo: 'Te falta 1 ingrediente', data: falta1 },
    { clave: 'falta2o3', titulo: 'Te faltan 2 o 3 ingredientes', data: falta2o3 },
    { clave: 'mas', titulo: 'Más ideas', data: mas },
  ];
  return secciones.filter((s) => s.data.length > 0);
}