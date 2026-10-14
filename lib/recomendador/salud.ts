import {
  NOM051,
  PESO_MODERAR,
  SALUD_BALANCE,
  SALUD_MODERACION,
  SALUD_UMBRAL_BALANCEADA,
} from '../../constants/recomendador';
import { esBasico } from './cobertura';
import { RecetaParaRecomendar, SaludResultado } from './tipos';

const GRUPOS_PRINCIPALES = ['verduras_frutas', 'cereales', 'leguminosas_animal'] as const;

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