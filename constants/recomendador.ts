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