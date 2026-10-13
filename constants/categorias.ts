export type GrupoAlacena = 'todo' | 'refrigerados' | 'verduras' | 'despensa' | 'pronto';

export const GRUPOS_ALACENA: { clave: GrupoAlacena; etiqueta: string }[] = [
  { clave: 'todo', etiqueta: 'TODO' },
  { clave: 'refrigerados', etiqueta: 'REFRIGERADOS' },
  { clave: 'verduras', etiqueta: 'VERDURAS Y FRUTAS' },
  { clave: 'despensa', etiqueta: 'DESPENSA' },
  { clave: 'pronto', etiqueta: 'USAR PRONTO' },
];

export function normalizar(texto: string | null | undefined): string {
  return (texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

const PALABRAS_REFRIGERADOS = [
  'lacteo', 'queso', 'leche', 'yogur', 'crema', 'carne', 'pollo', 'res', 'cerdo',
  'pescado', 'marisco', 'embutido', 'salchicha', 'jamon', 'huevo', 'refriger', 'congelad',
];
const PALABRAS_VERDURAS = ['verdura', 'fruta', 'hortaliza', 'vegetal'];

export function grupoDeCategoria(categoria: string | null): Exclude<GrupoAlacena, 'todo' | 'pronto'> {
  const c = normalizar(categoria);
  if (PALABRAS_REFRIGERADOS.some((p) => c.includes(p))) return 'refrigerados';
  if (PALABRAS_VERDURAS.some((p) => c.includes(p))) return 'verduras';
  return 'despensa';
}

const ICONOS_POR_NOMBRE: [string[], string][] = [
  [['papaya'], '🍈'],
  [['jitomate', 'tomate'], '🍅'],
  [['cebolla'], '🧅'],
  [['ajo'], '🧄'],
  [['papa'], '🥔'],
  [['zanahoria'], '🥕'],
  [['elote', 'maiz'], '🌽'],
  [['chile', 'chipotle', 'jalapeno'], '🌶️'],
  [['limon', 'lima'], '🍋'],
  [['platano'], '🍌'],
  [['manzana'], '🍎'],
  [['naranja'], '🍊'],
  [['fresa'], '🍓'],
  [['aguacate'], '🥑'],
  [['lechuga', 'espinaca', 'brocoli', 'calabaza', 'nopal', 'verdura'], '🥬'],
  [['huevo'], '🥚'],
  [['leche'], '🥛'],
  [['queso'], '🧀'],
  [['yogur', 'yogurt', 'crema'], '🥣'],
  [['pollo'], '🍗'],
  [['carne', 'res', 'molida', 'bistec'], '🥩'],
  [['salchicha', 'jamon', 'chorizo', 'tocino'], '🥓'],
  [['atun', 'pescado', 'sardina'], '🐟'],
  [['arroz'], '🍚'],
  [['frijol', 'lenteja', 'garbanzo', 'soya'], '🫘'],
  [['pasta', 'fideo', 'codito', 'espagueti', 'sopa'], '🍝'],
  [['pan', 'tortilla', 'bolillo'], '🍞'],
  [['avena', 'cereal'], '🥣'],
  [['aceite'], '🫒'],
  [['sal'], '🧂'],
  [['azucar', 'piloncillo', 'dulce', 'miel'], '🍬'],
  [['jamaica'], '🌺'],
  [['cafe'], '☕'],
  [['canela'], '🪵'],
];

export function iconoIngrediente(nombre: string, categoria: string | null): string {
  const tokens = normalizar(nombre).split(/[^a-z]+/).filter(Boolean);
  for (const [claves, emoji] of ICONOS_POR_NOMBRE) {
    const coincide = tokens.some((t) =>
      claves.some((k) => t === k || (k.length > 3 && t.startsWith(k)))
    );
    if (coincide) return emoji;
  }
  const g = grupoDeCategoria(categoria);
  if (g === 'refrigerados') return '🧊';
  if (g === 'verduras') return '🥬';
  return '🛒';
}


export function haceCuanto(isoFecha: string): string {
  const antes = new Date(isoFecha);
  const hoy = new Date();

  const inicioAntes = new Date(antes.getFullYear(), antes.getMonth(), antes.getDate()).getTime();
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime();
  const dias = Math.round((inicioHoy - inicioAntes) / 86400000);

  if (dias <= 0) return 'Hoy';
  if (dias === 1) return 'Hace 1 día';
  if (dias < 30) return `Hace ${dias} días`;
  const meses = Math.floor(dias / 30);
  return meses === 1 ? 'Hace 1 mes' : `Hace ${meses} meses`;
}

const ORDEN_PASILLOS = [
  'verduras', 'frutas', 'carnes', 'refrigerados', 'granos',
  'abarrotes', 'enlatados', 'especias', 'otros',
];

const NOMBRE_PASILLO: Record<string, string> = {
  verduras: '🥬 Verduras',
  frutas: '🍎 Frutas',
  carnes: '🥩 Carnes',
  refrigerados: '🥛 Refrigerados',
  granos: '🌾 Granos',
  abarrotes: '🛒 Abarrotes',
  enlatados: '🥫 Enlatados',
  especias: '🧂 Especias',
  otros: '📦 Otros',
};

export function ordenPasillo(categoria: string): number {
  const i = ORDEN_PASILLOS.indexOf(normalizar(categoria));
  return i === -1 ? ORDEN_PASILLOS.length : i;
}

export function etiquetaPasillo(categoria: string): string {
  const clave = normalizar(categoria);
  if (NOMBRE_PASILLO[clave]) return NOMBRE_PASILLO[clave];
  return categoria.charAt(0).toUpperCase() + categoria.slice(1);
}