import {
  NOM051,
  PESO_MODERAR,
  RANGO_ETIQUETA_SALUD,
  RANGO_SIN_DATO_SALUD,
  SALUD_BALANCE,
  SALUD_MODERACION,
  SALUD_UMBRAL_BALANCEADA,
  OPCIONES_SUGERENCIA_GRUPO,
} from '../../constants/recomendador';
import { esBasico } from './cobertura';
import { IngredienteReceta, Recomendacion, RecetaParaRecomendar, SaludResultado } from './tipos';

export const GRUPOS_PRINCIPALES = ['verduras_frutas', 'cereales', 'leguminosas_animal'] as const;
export type GrupoPlato = (typeof GRUPOS_PRINCIPALES)[number];

function etiquetaDe(score: number): SaludResultado['etiqueta'] {
  if (score >= SALUD_UMBRAL_BALANCEADA) return 'balanceada';
  if (score >= 0.5) return 'aceptable';
  return 'ocasional';
}

// ---------- Fase A ----------
export function saludPlato(receta: RecetaParaRecomendar): SaludResultado | null {
  const considerados = receta.ingredientes.filter(
    (i) => !i.opcional && !esBasico(i.nombre) && i.grupo !== null && i.grupo !== 'neutro'
  );
  if (considerados.length === 0) return null;

  const presentes = new Set(considerados.map((i) => i.grupo));
  const gruposCubiertos = GRUPOS_PRINCIPALES.filter((g) => presentes.has(g)).length;
  const balance = gruposCubiertos / GRUPOS_PRINCIPALES.length;

  const cargaModerar = considerados.reduce((suma, i) => suma + (PESO_MODERAR[i.grupo as string] ?? 0), 0);
  const proporcionModerar = Math.min(1, cargaModerar / considerados.length);

  const score = SALUD_BALANCE * balance + SALUD_MODERACION * (1 - proporcionModerar);
  return { score, fuente: 'plato', etiqueta: etiquetaDe(score), octagonos: [] };
}

// ---------- Fase B ----------
export function saludNutricional(receta: RecetaParaRecomendar): SaludResultado | null {
  const relevantes = receta.ingredientes.filter((i) => !i.opcional && !esBasico(i.nombre));
  if (relevantes.length === 0) return null;

  let conDatos = 0;
  let kcal = 0;
  let azucares = 0;
  let grasaSat = 0;
  let sodio = 0;

  for (const ing of relevantes) {
    const n = ing.nutricion;
    if (!n || n.kcal_100 === null) continue;

    let cantidadBase: number | null = null;
    if (ing.unidad === 'pieza') {
      cantidadBase = n.gramos_por_pieza !== null ? ing.cantidad * n.gramos_por_pieza : null;
    } else {
      cantidadBase = ing.cantidad;
    }
    if (cantidadBase === null) continue;

    const factor = cantidadBase / 100;
    kcal += (n.kcal_100 ?? 0) * factor;
    azucares += (n.azucares_anadidos_100 ?? 0) * factor;
    grasaSat += (n.grasa_sat_100 ?? 0) * factor;
    sodio += (n.sodio_mg_100 ?? 0) * factor;
    conDatos += 1;
  }

  if (conDatos / relevantes.length < NOM051.coberturaMinimaDatos || kcal <= 0) return null;

  const octagonos: string[] = [];
  if ((azucares * NOM051.kcalPorGramoAzucar) / kcal >= NOM051.azucaresAnadidosPctEnergia) {
    octagonos.push('exceso azúcares');
  }
  if ((grasaSat * NOM051.kcalPorGramoGrasa) / kcal >= NOM051.grasaSaturadaPctEnergia) {
    octagonos.push('exceso grasas saturadas');
  }
  if (sodio / kcal >= NOM051.sodioMgPorKcal) {
    octagonos.push('exceso sodio');
  }

  const score = 1 - octagonos.length / 3;
  return { score, fuente: 'nom051', etiqueta: etiquetaDe(score), octagonos };
}

export function calcularSalud(receta: RecetaParaRecomendar): SaludResultado | null {
  return saludNutricional(receta) ?? saludPlato(receta);
}

export function incluyeLosTresGrupos(receta: RecetaParaRecomendar): boolean {
  const presentes = new Set(
    receta.ingredientes.filter((i) => !i.opcional && !esBasico(i.nombre)).map((i) => i.grupo)
  );
  return GRUPOS_PRINCIPALES.every((g) => presentes.has(g));
}

// ---------- Presentación: ¿qué aporta una receta al Plato del Bien Comer? ----------
export interface AportePlato {
  hayDatos: boolean; 
  cubiertos: GrupoPlato[];
  faltantes: GrupoPlato[];
  ultraprocesados: string[];
}

type IngredienteMinimo = Pick<IngredienteReceta, 'nombre' | 'opcional' | 'grupo'>;

// Mismo criterio que saludPlato
export function aportePlato(ingredientes: IngredienteMinimo[]): AportePlato {
  const considerados = ingredientes.filter(
    (i) => !i.opcional && !esBasico(i.nombre) && i.grupo !== null && i.grupo !== 'neutro'
  );
  if (considerados.length === 0) return { hayDatos: false, cubiertos: [], faltantes: [], ultraprocesados: [] };

  const presentes = new Set(considerados.map((i) => i.grupo));
  return {
    hayDatos: true,
    cubiertos: GRUPOS_PRINCIPALES.filter((g) => presentes.has(g)),
    faltantes: GRUPOS_PRINCIPALES.filter((g) => !presentes.has(g)),
    ultraprocesados: considerados.filter((i) => i.grupo === 'ultraprocesado').map((i) => i.nombre),
  };
}

function normalizarNombre(n: string): string {
  return n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function unir(partes: string[], conj: 'y' | 'o'): string {
  if (partes.length <= 1) return partes[0] ?? '';
  return `${partes.slice(0, -1).join(', ')} ${conj} ${partes[partes.length - 1]}`;
}

export function sugerenciaParaCompletar(
  faltantes: GrupoPlato[],
  excluir: ReadonlySet<string> = new Set()
): string | null {
  const excluidos = [...excluir].map(normalizarNombre);
  const prohibido = (ingrediente: string | null) => {
    if (!ingrediente) return false;
    const n = normalizarNombre(ingrediente);
    return excluidos.some((e) => e === n || e.startsWith(n) || n.startsWith(e));
  };

  const porGrupo = faltantes
    .map((g) => OPCIONES_SUGERENCIA_GRUPO[g].filter((o) => !prohibido(o.ingrediente)).map((o) => o.texto))
    .filter((textos) => textos.length > 0)
    .map((textos) => unir(textos, 'o'));

  if (porGrupo.length === 0) return null;
  return `Para completar tu plato, acompáñala con ${unir(porGrupo, 'y')}.`;
}

// 0 = balanceada, 1 = aceptable, 2 = de vez en cuando, 3 = sin dato de salud
export function rangoSalud(r: Pick<Recomendacion, 'salud'>): number {
  return r.salud ? RANGO_ETIQUETA_SALUD[r.salud.etiqueta] : RANGO_SIN_DATO_SALUD;
}