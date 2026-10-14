/**
 * probar-recomendador.ts
 *
 * Pruebas del recomendador SIN abrir la app ni conectarse a Supabase: usa datos inventados
 * (con los ids y nombres reales de tu catálogo). Se corre desde la raíz del proyecto con:
 *
 *     npx tsx scripts/probar-recomendador.ts
 *
 * Si todo está bien termina con "✔ N pruebas pasaron". Si algo falla, dice cuál.
 */
import { recomendar, agruparPorFaltantes } from '../lib/recomendador/recomendar';
import { calcularCobertura, stockPorIngrediente } from '../lib/recomendador/cobertura';
import { saludPlato, saludNutricional, calcularSalud } from '../lib/recomendador/salud';
import { construirPerfil, calcularAfinidad } from '../lib/recomendador/afinidad';
import {
  Contexto,
  GrupoAlimenticio,
  Historial,
  IngredienteReceta,
  ItemAlacena,
  Nutricion,
  RecetaParaRecomendar,
  UnidadBase,
} from '../lib/recomendador/tipos';

// ---------- Mini herramientas de prueba ----------
let pasaron = 0;
const fallos: string[] = [];
function prueba(nombre: string, f: () => void) {
  try {
    f();
    pasaron += 1;
    console.log(`  ok  ${nombre}`);
  } catch (e: any) {
    fallos.push(`${nombre}: ${e.message}`);
    console.log(`  XX  ${nombre}\n        ${e.message}`);
  }
}
function igual<T>(real: T, esperado: T, msg = '') {
  if (real !== esperado) throw new Error(`${msg} esperaba ${String(esperado)} y salió ${String(real)}`);
}
function cierto(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

// ---------- Catálogo de prueba (ids reales de tu base) ----------
type Fila = [id: number, nombre: string, unidad: UnidadBase, grupo: GrupoAlimenticio];
const CAT: Record<string, Fila> = {
  huevo: [1, 'Huevo', 'pieza', 'leguminosas_animal'],
  arroz: [2, 'Arroz', 'g', 'cereales'],
  frijol: [7, 'Frijol', 'g', 'leguminosas_animal'],
  lenteja: [8, 'Lenteja', 'g', 'leguminosas_animal'],
  aceite: [9, 'Aceite', 'ml', 'grasas_azucares'],
  jitomate: [11, 'Jitomate', 'pieza', 'verduras_frutas'],
  cebolla: [12, 'Cebolla', 'pieza', 'verduras_frutas'],
  zanahoria: [14, 'Zanahoria', 'pieza', 'verduras_frutas'],
  salchicha: [29, 'Salchicha', 'pieza', 'ultraprocesado'],
  mayonesa: [36, 'Mayonesa', 'g', 'grasas_azucares'],
  galletas: [39, 'Galletas saladas', 'g', 'ultraprocesado'],
  sal: [42, 'Sal', 'g', 'neutro'],
  agua: [54, 'Agua', 'ml', 'neutro'],
};

function ing(clave: string, cantidad: number, opts: { opcional?: boolean; nutricion?: Nutricion } = {}): IngredienteReceta {
  const [id, nombre, unidad, grupo] = CAT[clave];
  return {
    ingrediente_id: id,
    nombre,
    unidad,
    cantidad,
    opcional: !!opts.opcional,
    grupo,
    nutricion: opts.nutricion ?? null,
  };
}
function receta(id: number, nombre: string, ingredientes: IngredienteReceta[], tiempo = 30): RecetaParaRecomendar {
  return { id, nombre, tiempo_min: tiempo, foto_url: null, porciones_base: 4, ingredientes };
}
function stock(...pares: [string, number, boolean?][]): ItemAlacena[] {
  return pares.map(([clave, cantidad, pronto]) => ({
    ingrediente_id: CAT[clave][0],
    cantidad,
    usar_pronto: !!pronto,
  }));
}
function historialVacio(): Historial {
  return { favoritas: new Set(), hacerDespues: new Set(), preparadas: new Set(), calificaciones: new Map() };
}
function ctx(alacena: ItemAlacena[], extra: Partial<Contexto> = {}): Contexto {
  return { alacena, historial: historialVacio(), idsExcluidos: new Set(), ...extra };
}

// ---------- Recetas de prueba ----------
const arrozFrijol = receta(1, 'Arroz con frijoles', [
  ing('arroz', 200), ing('frijol', 150), ing('jitomate', 2), ing('cebolla', 1), ing('aceite', 15), ing('sal', 3),
]);
const sopaLentejas = receta(2, 'Sopa de lentejas', [
  ing('lenteja', 250), ing('zanahoria', 2), ing('cebolla', 1), ing('agua', 1000), ing('sal', 3),
]);
const hotdogs = receta(3, 'Hot dogs con mayonesa', [ing('salchicha', 4), ing('mayonesa', 40), ing('galletas', 50)]);
const huevoRanchero = receta(4, 'Huevos a la mexicana', [
  ing('huevo', 4), ing('jitomate', 2), ing('cebolla', 1), ing('aceite', 10), ing('sal', 2),
  ing('zanahoria', 1, { opcional: true }),
]);

console.log('\nCOBERTURA');
prueba('completo / insuficiente / faltante se clasifican bien', () => {
  const s = stockPorIngrediente(stock(['arroz', 500], ['frijol', 100], ['jitomate', 5]));
  const c = calcularCobertura(arrozFrijol, s);
  // Obligatorios que cuentan: arroz, frijol, jitomate, cebolla (aceite y sal son básicos)
  igual(c.total, 4, 'total');
  igual(c.completos, 2, 'completos'); // arroz y jitomate
  igual(c.insuficientes.length, 1, 'insuficientes'); // frijol 100 < 150
  igual(c.insuficientes[0].nombre, 'Frijol');
  igual(c.faltantes.length, 1, 'faltantes'); // cebolla
  igual(c.faltantes[0].nombre, 'Cebolla');
  igual(c.puedeCocinarYa, false);
  igual(c.fraccion, (2 + 0.5) / 4, 'fraccion');
});
prueba('los básicos (aceite, sal, agua) no cuentan como faltantes', () => {
  const c = calcularCobertura(sopaLentejas, stockPorIngrediente(stock(['lenteja', 250], ['zanahoria', 2], ['cebolla', 1])));
  igual(c.puedeCocinarYa, true);
  igual(c.total, 3);
});
prueba('los opcionales no cuentan', () => {
  const c = calcularCobertura(huevoRanchero, stockPorIngrediente(stock(['huevo', 4], ['jitomate', 2], ['cebolla', 1])));
  igual(c.puedeCocinarYa, true);
});
prueba('tolerancia de decimales (0.1 + 0.2 alcanza para 0.3)', () => {
  const r = receta(9, 'Prueba', [ing('arroz', 0.3)]);
  const c = calcularCobertura(r, stockPorIngrediente(stock(['arroz', 0.1], ['arroz', 0.2])));
  igual(c.puedeCocinarYa, true);
});
prueba('receta solo con básicos queda "completa"', () => {
  const r = receta(10, 'Agua con sal', [ing('agua', 500), ing('sal', 2)]);
  const c = calcularCobertura(r, new Map());
  igual(c.fraccion, 1);
  igual(c.puedeCocinarYa, true);
});

console.log('\nALERGIAS (filtro duro)');
prueba('una receta excluida NUNCA aparece, aunque sea perfecta', () => {
  const r = recomendar(
    [arrozFrijol, sopaLentejas],
    ctx(stock(['arroz', 500], ['frijol', 500], ['jitomate', 5], ['cebolla', 3]), { idsExcluidos: new Set([1]) })
  );
  cierto(!r.items.some((x) => x.receta.id === 1), 'apareció la receta 1');
  igual(r.items.length, 1);
});
prueba('si se excluyen todas, no regresa nada', () => {
  const r = recomendar([arrozFrijol], ctx([], { idsExcluidos: new Set([1]) }));
  igual(r.items.length, 0);
});

console.log('\nALACENA VACÍA (usuario nuevo)');
prueba('regresa recetas, marca alacenaVacia y no dice "Te falta"', () => {
  const r = recomendar([arrozFrijol, hotdogs], ctx([]));
  igual(r.alacenaVacia, true);
  igual(r.items.length, 2);
  cierto(!r.items.some((x) => x.motivos.some((m) => m.includes('falta'))), 'habló de faltantes');
  igual(r.items[0].componentes.cobertura, undefined, 'cobertura debió ignorarse');
});
prueba('sin alacena, la receta más balanceada va primero', () => {
  const r = recomendar([hotdogs, arrozFrijol], ctx([]));
  igual(r.items[0].receta.id, 1);
});
prueba('alacena con cantidad 0 cuenta como vacía', () => {
  igual(recomendar([arrozFrijol], ctx(stock(['arroz', 0]))).alacenaVacia, true);
});

console.log('\nORDEN POR ALACENA');
prueba('la que puedes cocinar ya queda arriba de la que no', () => {
  const al = stock(['lenteja', 300], ['zanahoria', 3], ['cebolla', 2]);
  const r = recomendar([arrozFrijol, sopaLentejas, hotdogs], ctx(al));
  igual(r.items[0].receta.id, 2);
  igual(r.items[0].cobertura.puedeCocinarYa, true);
  cierto(r.items[0].motivos[0] === 'Tienes todo lo necesario', 'motivo principal');
});
prueba('el motivo nombra lo que falta', () => {
  const r = recomendar([arrozFrijol], ctx(stock(['arroz', 500], ['frijol', 500], ['jitomate', 5])));
  igual(r.items[0].motivos[0], 'Te falta: cebolla');
});

console.log('\nUSAR PRONTO');
prueba('gastar un ingrediente "Usar pronto" sube la receta', () => {
  // Misma alacena; la única diferencia es que la zanahoria está marcada "usar pronto".
  const base = stock(['lenteja', 300], ['zanahoria', 3], ['cebolla', 2], ['huevo', 6], ['jitomate', 4]);
  const sinMarca = recomendar([huevoRanchero, sopaLentejas], ctx(base));
  const conMarca = recomendar(
    [huevoRanchero, sopaLentejas],
    ctx(stock(['lenteja', 300], ['zanahoria', 3, true], ['cebolla', 2], ['huevo', 6], ['jitomate', 4]))
  );
  const puntaje = (res: typeof sinMarca, id: number) => res.items.find((x) => x.receta.id === id)!.puntaje;
  cierto(puntaje(conMarca, 2) > puntaje(sinMarca, 2), 'la sopa no subió');
  igual(conMarca.items[0].receta.id, 2);
  cierto(conMarca.items[0].motivos.some((m) => m.includes('zanahoria') && m.includes('usar pronto')), 'sin motivo');
});
prueba('un ingrediente usar_pronto de cantidad 0 se ignora', () => {
  const r = recomendar([sopaLentejas], ctx(stock(['zanahoria', 0, true], ['lenteja', 300])));
  igual(r.items[0].componentes.usarPronto, undefined);
});

console.log('\nAFINIDAD');
prueba('usuario sin historial: afinidad no se calcula', () => {
  igual(calcularAfinidad(sopaLentejas, construirPerfil([arrozFrijol, sopaLentejas], historialVacio())), null);
});
prueba('lo parecido a tus favoritas puntúa más que lo distinto', () => {
  const h = historialVacio();
  h.favoritas.add(1); // arroz con frijoles
  const perfil = construirPerfil([arrozFrijol, sopaLentejas, hotdogs], h);
  const aSopa = calcularAfinidad(sopaLentejas, perfil)!; // comparte cebolla
  const aHot = calcularAfinidad(hotdogs, perfil)!; // no comparte nada
  cierto(aSopa > aHot, `${aSopa} no es mayor que ${aHot}`);
  cierto(aSopa >= 0.5, 'debería ser >= neutral');
});
prueba('una calificación baja resta', () => {
  const h = historialVacio();
  h.calificaciones.set(3, 1); // odió los hot dogs
  h.favoritas.add(1);
  const perfil = construirPerfil([arrozFrijol, sopaLentejas, hotdogs], h);
  cierto(calcularAfinidad(hotdogs, perfil)! < 0.5, 'debería estar bajo el neutral');
});
prueba('calificación 3 no suma ni resta', () => {
  const h = historialVacio();
  h.calificaciones.set(1, 3);
  igual(construirPerfil([arrozFrijol], h).size, 0);
});
prueba('el resultado siempre está entre 0 y 1', () => {
  const h = historialVacio();
  [1, 2, 3, 4].forEach((i) => { h.favoritas.add(i); h.preparadas.add(i); h.calificaciones.set(i, 5); });
  const todas = [arrozFrijol, sopaLentejas, hotdogs, huevoRanchero];
  const perfil = construirPerfil(todas, h);
  for (const r of todas) {
    const a = calcularAfinidad(r, perfil)!;
    cierto(a >= 0 && a <= 1, `fuera de rango: ${a}`);
  }
});

console.log('\nSALUD — Fase A (Plato del Bien Comer)');
prueba('arroz + frijol + verduras = balanceada', () => {
  const s = saludPlato(arrozFrijol)!;
  igual(s.etiqueta, 'balanceada');
  cierto(s.score >= 0.75, `score ${s.score}`);
});
prueba('salchicha + mayonesa + galletas = ocasional', () => {
  const s = saludPlato(hotdogs)!;
  igual(s.etiqueta, 'ocasional');
  cierto(s.score < 0.5, `score ${s.score}`);
});
prueba('el motivo "Plato balanceado" aparece solo si tiene los 3 grupos', () => {
  const r = recomendar([arrozFrijol, sopaLentejas], ctx([]));
  const a = r.items.find((x) => x.receta.id === 1)!;
  const b = r.items.find((x) => x.receta.id === 2)!; // sin cereal
  cierto(a.motivos.some((m) => m.includes('balanceado')), 'arroz con frijoles');
  cierto(!b.motivos.some((m) => m.includes('balanceado')), 'sopa sin cereal');
});
prueba('receta sin grupos asignados: salud = null, no truena', () => {
  const sinGrupo = receta(20, 'Sin grupo', [{ ...ing('arroz', 100), grupo: null }]);
  igual(saludPlato(sinGrupo), null);
  const r = recomendar([sinGrupo], ctx([]));
  igual(r.items[0].componentes.salud, undefined);
});

console.log('\nSALUD — Fase B (NOM-051)');
const NUT_SALCHICHA: Nutricion = { kcal_100: 250, azucares_anadidos_100: 3, grasa_sat_100: 9, sodio_mg_100: 1000, gramos_por_pieza: 45 };
const NUT_FRIJOL: Nutricion = { kcal_100: 340, azucares_anadidos_100: 0, grasa_sat_100: 0.2, sodio_mg_100: 10, gramos_por_pieza: null };
prueba('cuenta octágonos: sodio y grasa saturada altos', () => {
  const r = receta(30, 'Salchichas', [ing('salchicha', 4, { nutricion: NUT_SALCHICHA })]);
  const s = saludNutricional(r)!;
  cierto(s.octagonos.includes('exceso sodio'), 'sodio');
  cierto(s.octagonos.includes('exceso grasas saturadas'), 'grasa sat');
  cierto(s.score < 0.5, `score ${s.score}`);
  igual(s.fuente, 'nom051');
});
prueba('frijol solo: sin excesos', () => {
  const r = receta(31, 'Frijoles', [ing('frijol', 200, { nutricion: NUT_FRIJOL })]);
  const s = saludNutricional(r)!;
  igual(s.octagonos.length, 0);
  igual(s.score, 1);
});
prueba('con pocos datos nutricionales se usa la Fase A', () => {
  // 1 de 4 ingredientes con datos (25 % < 80 %)
  const r = receta(32, 'Mixta', [
    ing('frijol', 200, { nutricion: NUT_FRIJOL }), ing('arroz', 100), ing('jitomate', 2), ing('cebolla', 1),
  ]);
  igual(saludNutricional(r), null);
  igual(calcularSalud(r)!.fuente, 'plato');
});
prueba('ingrediente en piezas sin gramos_por_pieza no se inventa', () => {
  const sinGramos = { ...NUT_SALCHICHA, gramos_por_pieza: null };
  const r = receta(33, 'Salchichas', [ing('salchicha', 4, { nutricion: sinGramos })]);
  igual(saludNutricional(r), null);
});

console.log('\nNOVEDAD, LÍMITE Y ORDEN');
prueba('una receta ya preparada puntúa menos que una nueva igual', () => {
  const copia = { ...arrozFrijol, id: 99, nombre: 'Copia' };
  const h = historialVacio();
  h.preparadas.add(1);
  const r = recomendar([arrozFrijol, copia], { alacena: [], historial: h, idsExcluidos: new Set() });
  igual(r.items[0].receta.id, 99);
});
prueba('limite recorta la lista', () => {
  igual(recomendar([arrozFrijol, sopaLentejas, hotdogs, huevoRanchero], ctx([]), { limite: 2 }).items.length, 2);
});
prueba('minCobertura pone primero las que casi se pueden cocinar y rellena con el resto', () => {
  const al = stock(['lenteja', 300], ['zanahoria', 3], ['cebolla', 2]);
  const r = recomendar([hotdogs, arrozFrijol, sopaLentejas], ctx(al), { minCobertura: 0.5, limite: 3 });
  igual(r.items.length, 3, 'debe rellenar');
  igual(r.items[0].receta.id, 2);
});
prueba('el puntaje siempre está entre 0 y 1', () => {
  const r = recomendar([arrozFrijol, sopaLentejas, hotdogs, huevoRanchero], ctx(stock(['arroz', 999])));
  for (const x of r.items) cierto(x.puntaje >= 0 && x.puntaje <= 1, `puntaje ${x.puntaje}`);
});
prueba('empates se ordenan de forma estable (por tiempo y luego id)', () => {
  const a = { ...arrozFrijol, id: 50, tiempo_min: 40 };
  const b = { ...arrozFrijol, id: 51, tiempo_min: 20 };
  igual(recomendar([a, b], ctx([])).items[0].receta.id, 51);
});

console.log('\nSECCIONES DE LA PANTALLA');
prueba('agruparPorFaltantes separa ya / falta 1 / falta 2-3 / más', () => {
  const al = stock(['lenteja', 300], ['zanahoria', 3], ['cebolla', 2], ['arroz', 300], ['frijol', 200]);
  const r = recomendar([sopaLentejas, arrozFrijol, hotdogs], ctx(al));
  const secc = agruparPorFaltantes(r.items);
  igual(secc[0].clave, 'ya');
  igual(secc[0].data[0].receta.id, 2);
  const fal1 = secc.find((s) => s.clave === 'falta1')!; // arroz con frijoles: solo falta jitomate
  igual(fal1.data[0].receta.id, 1);
  const mas = secc.find((s) => s.clave === 'falta2o3')!; // hotdogs: faltan 3
  igual(mas.data[0].receta.id, 3);
  cierto(secc.every((s) => s.data.length > 0), 'secciones vacías');
});

console.log(`\n${fallos.length === 0 ? '✔' : '✘'} ${pasaron} pruebas pasaron${fallos.length ? `, ${fallos.length} fallaron` : ''}`);
if (fallos.length) {
  fallos.forEach((f) => console.log(' - ' + f));
  process.exit(1);
}