import { UnidadBD } from '../lib/unidades';

export interface IngredienteCatalogo {
  id: number;
  nombre: string;
  categoria: string | null;
  unidad: UnidadBD;
  imagen_url: string | null; 
}

export interface AlacenaItem {
  id: number;
  ingrediente_id: number;
  cantidad: number; 
  agregado_en: string;
  usar_pronto: boolean;
  ingredientes: IngredienteCatalogo;
}

export interface EntradaAlacena {
  ingrediente_id: number;
  cantidad: number;
}

export interface PaqueteBamx {
  id: number;
  nombre: string;
  descripcion: string | null;
  paquete_bamx_ingredientes: {
    ingrediente_id: number;
    cantidad: number;
    variable: boolean;
    ingredientes: IngredienteCatalogo;
  }[];
}

export interface ResultadoAccion {
  ok: boolean;
  mensaje?: string;
}