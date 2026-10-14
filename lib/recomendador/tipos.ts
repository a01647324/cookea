export type UnidadBase = 'g' | 'ml' | 'pieza';

export type GrupoAlimenticio =
  | 'verduras_frutas'
  | 'cereales'
  | 'leguminosas_animal'
  | 'grasas_azucares'
  | 'ultraprocesado'
  | 'neutro';

//nutrición por 100 g / 100 ml (cualquier campo puede ser null)
export interface Nutricion {
  kcal_100: number | null;
  azucares_anadidos_100: number | null;
  grasa_sat_100: number | null;
  sodio_mg_100: number | null;
  gramos_por_pieza: number | null;
}

export interface IngredienteReceta {
  ingrediente_id: number;
  nombre: string;
  unidad: UnidadBase;
  cantidad: number; 
  opcional: boolean;
  grupo: GrupoAlimenticio | null;
  nutricion: Nutricion | null;
}

export interface RecetaParaRecomendar {
  id: number;
  nombre: string;
  tiempo_min: number;
  foto_url: string | null;
  porciones_base: number;
  ingredientes: IngredienteReceta[];
}

export interface ItemAlacena {
  ingrediente_id: number;
  cantidad: number; 
  usar_pronto: boolean;
}

export interface Historial {
  favoritas: Set<number>;
  hacerDespues: Set<number>;
  preparadas: Set<number>;
  calificaciones: Map<number, number>; 
}

export interface Contexto {
  alacena: ItemAlacena[];
  historial: Historial;
  idsExcluidos: Set<number>; // recetas con alérgenos del usuario/hogar: FILTRO DURO
}

export interface FaltanteDetalle {
  ingrediente_id: number;
  nombre: string;
  unidad: UnidadBase;
  necesito: number;
  tengo: number; 
}

export interface Cobertura {
  total: number; 
  completos: number;
  insuficientes: FaltanteDetalle[]; 
  faltantes: FaltanteDetalle[]; 
  fraccion: number; 
  puedeCocinarYa: boolean;
}

export interface SaludResultado {
  score: number; 
  fuente: 'plato' | 'nom051';
  etiqueta: 'balanceada' | 'aceptable' | 'ocasional';
  octagonos: string[]; 
}

export type Componentes = Partial<Record<'cobertura' | 'usarPronto' | 'afinidad' | 'salud' | 'novedad', number>>;

export interface Recomendacion {
  receta: RecetaParaRecomendar;
  puntaje: number; 
  componentes: Componentes; 
  cobertura: Cobertura;
  salud: SaludResultado | null;
  usaPronto: string[]; 
  motivos: string[]; 
}

export interface ResultadoRecomendacion {
  alacenaVacia: boolean;
  items: Recomendacion[];
}

export interface OpcionesRecomendar {
  limite?: number;
  minCobertura?: number;
}