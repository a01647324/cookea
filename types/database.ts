// ---------- Perfil del usuario ----------
export interface Perfil {
  id: string; // uuid, igual al id de supabase.auth
  alias: string;
  nombre: string;
  personas_hogar: number;
}
 
// Vista pública usada para mostrar autores en Comunidad (nunca exponer "nombre")
export interface PerfilPublico {
  id: string;
  alias: string;
}
 
// ---------- Catálogos ----------
export interface Alergeno {
  id: number;
  nombre: string;
}
 
export type UnidadIngrediente = 'g' | 'ml' | 'pieza';
 
export interface Ingrediente {
  id: number;
  nombre: string;
  categoria: string | null;
  unidad: UnidadIngrediente;
}
 
// ---------- Recetas ----------
export interface RecetaResumen {
  // Lo mínimo para pintar una tarjeta en una lista (Recetario, Favoritos, Home)
  id: number;
  nombre: string;
  tiempo_min: number;
  foto_url: string | null;
}
 
export interface RecetaIngrediente {
  cantidad: number;
  cantidad_texto: string | null;
  opcional: boolean;
  ingredientes: Ingrediente;
}
 
export interface PasoReceta {
  orden: number;
  texto: string;
  temporizador_seg: number | null;
}
 
export interface RecetaDetalle extends RecetaResumen {
  descripcion: string | null;
  porciones_base: number;
  video_url: string | null;
  autor_id: string | null; // null = receta oficial de BAMX
  visible: boolean; // false = se ocultó sola tras 3 reportes (ver tabla `reportes`)
  receta_ingredientes: RecetaIngrediente[];
  pasos_receta: PasoReceta[];
}
 
//VISTA-------------
export interface RecetaCalificacion {
  receta_id: number;
  promedio: number;
  total: number;
}
 
// ---------- Planificador semanal ----------
export type MomentoComida = 'desayuno' | 'comida' | 'cena' | 'bebida';
 
export interface PlanSemanalItem {
  id: number;
  fecha: string; // formato 'YYYY-MM-DD'
  momento: MomentoComida;
  receta_id: number;
  recetas: RecetaResumen;
}