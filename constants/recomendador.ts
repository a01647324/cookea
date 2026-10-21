export const PESOS = {
  cobertura: 0.45, 
  usarPronto: 0.15, 
  afinidad: 0.15, 
  salud: 0.2, 
  novedad: 0.05, 
} as const;

export type CriterioPuntaje = keyof typeof PESOS;
export const INGREDIENTES_BASICOS = ['agua', 'sal', 'aceite', 'pimienta'];

// ---------- Cobertura ----------
export const CREDITO_INSUFICIENTE = 0.5;
export const COBERTURA_MINIMA_HOME = 0.5;

// ---------- Afinidad (historial del usuario) ----------
export const SENAL_AFINIDAD = {
  favorita: 1,
  preparada: 1,
  hacerDespues: 0.5,
  calificacionAlta: 1.5, 
  calificacionBaja: -1.5, 
};

// ---------- Novedad ----------
export const NOVEDAD_YA_PREPARADA = 0.4;

// ---------- Salud(Plato del Bien Comer) ----------
export const PESO_MODERAR: Record<string, number> = {
  ultraprocesado: 1,
  grasas_azucares: 0.5,
};
export const SALUD_BALANCE = 0.65; 
export const SALUD_MODERACION = 0.35; 
export const SALUD_UMBRAL_BALANCEADA = 0.75;

// ---------- Salud(octágonos de la NOM-051) ----------
export const NOM051 = {
  azucaresAnadidosPctEnergia: 0.1, 
  grasaSaturadaPctEnergia: 0.1, 
  sodioMgPorKcal: 1, 
  kcalPorGramoAzucar: 4,
  kcalPorGramoGrasa: 9,
  coberturaMinimaDatos: 0.8,
};

export const ETIQUETA_GRUPO: Record<string, string> = {
  verduras_frutas: 'Verduras y frutas',
  cereales: 'Cereales y tubérculos',
  leguminosas_animal: 'Leguminosas y alimentos de origen animal',
  grasas_azucares: 'Grasas y azúcares',
  ultraprocesado: 'Ultraprocesados',
  neutro: 'Condimentos y agua',
};

// ---------- Presentación de la salud (¿Qué cocino hoy? y detalle de receta) ----------
// (Guías alimentarias saludables y sostenibles para la población mexicana, 2023).
export const NOMBRE_ETIQUETA_SALUD = {
  balanceada: 'Balanceada',
  aceptable: 'Aceptable',
  ocasional: 'Para de vez en cuando',
} as const;

export const NOMBRE_CORTO_ETIQUETA_SALUD = {
  balanceada: 'Balanceada',
  aceptable: 'Aceptable',
  ocasional: 'De vez en cuando',
} as const;

export const NOMBRE_FILTRO_SALUD = {
  balanceada: 'Balanceadas',
  aceptable: 'Aceptables',
  ocasional: 'De vez en cuando',
} as const;

// Orden de la más a la menos saludable
export const RANGO_ETIQUETA_SALUD = { balanceada: 0, aceptable: 1, ocasional: 2 } as const;
export const RANGO_SIN_DATO_SALUD = 3;

// Los 3 grupos del Plato del Bien Comer (NOM-043-SSA2-2012)
export const NOMBRE_GRUPO_PLATO = {
  verduras_frutas: 'Verduras y frutas',
  cereales: 'Cereales',
  leguminosas_animal: 'Leguminosas y alimentos de origen animal',
} as const;


export interface OpcionSugerencia {
  texto: string;
  ingrediente: string | null;
}

export const OPCIONES_SUGERENCIA_GRUPO: Record<
  'verduras_frutas' | 'cereales' | 'leguminosas_animal',
  OpcionSugerencia[]
> = {
  verduras_frutas: [{ texto: 'verduras o fruta', ingrediente: null }],
  cereales: [
    { texto: 'tortillas de maíz', ingrediente: 'Tortilla de maíz' },
    { texto: 'arroz', ingrediente: 'Arroz' },
    { texto: 'avena', ingrediente: 'Avena' },
  ],
  leguminosas_animal: [
    { texto: 'frijoles', ingrediente: 'Frijol' },
    { texto: 'lentejas', ingrediente: 'Lenteja' },
    { texto: 'huevo', ingrediente: 'Huevo' }, 
  ],
};