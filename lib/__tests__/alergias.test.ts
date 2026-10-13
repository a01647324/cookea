import { obtenerIdsRecetasConAlergia } from '../alergias';
import { supabase } from '../supabase';

jest.mock('../supabase', () => ({ supabase: { from: jest.fn() } }));

// Datos de prueba
// alergenos: 1 = gluten, 2 = lacteos
// ingredientes: 10 arroz, 11 jitomate, 12 consome (gluten), 13 queso (lacteos)
// recetas: 1 arroz rojo, 2 quesadillas, 3 ensalada
const datos: any = {
  usuario_alergias: [],
  hogar_alergias: [],
  ingrediente_alergenos: [
    { ingrediente_id: 12, alergeno_id: 1 },
    { ingrediente_id: 13, alergeno_id: 2 },
  ],
  receta_ingredientes: [
    { receta_id: 1, ingrediente_id: 10 },
    { receta_id: 1, ingrediente_id: 11 },
    { receta_id: 1, ingrediente_id: 12 }, // opcional
    { receta_id: 2, ingrediente_id: 13 },
    { receta_id: 3, ingrediente_id: 11 },
  ],
};

let tablaConError = '';

// Simula las consultas a Supabase usando los datos de arriba
(supabase.from as jest.Mock).mockImplementation((tabla: string) => {
  const error = tabla === tablaConError ? { message: 'Error' } : null;
  const filas = datos[tabla];
  const resultado: any = Promise.resolve({ data: filas, error });
  resultado.in = (columna: string, valores: number[]) =>
    Promise.resolve({ data: filas.filter((f: any) => valores.includes(f[columna])), error });
  return { select: () => resultado };
});

beforeEach(() => {
  datos.usuario_alergias = [];
  datos.hogar_alergias = [];
  tablaConError = '';
});

test('TC-01: sin alergias no se excluye ninguna receta', async () => {
  const resultado = await obtenerIdsRecetasConAlergia();
  expect(resultado).toEqual([]);
});

test('TC-02: excluye la receta aunque el alergeno este en un ingrediente opcional', async () => {
  datos.usuario_alergias = [{ alergeno_id: 1 }];
  const resultado = await obtenerIdsRecetasConAlergia();
  expect(resultado).toEqual([1]);
});

test('TC-03: en modo hogar tambien se excluyen las alergias del hogar', async () => {
  datos.usuario_alergias = [{ alergeno_id: 1 }];
  datos.hogar_alergias = [{ alergeno_id: 2 }];
  const resultado = await obtenerIdsRecetasConAlergia(true);
  expect(resultado.sort()).toEqual([1, 2]);
});

test('TC-04: en modo "para mi" no se toman en cuenta las alergias del hogar', async () => {
  datos.usuario_alergias = [{ alergeno_id: 1 }];
  datos.hogar_alergias = [{ alergeno_id: 2 }];
  const resultado = await obtenerIdsRecetasConAlergia(false);
  expect(resultado).toEqual([1]);
});

test('TC-05: si hay un error en Supabase la funcion lo lanza', async () => {
  datos.usuario_alergias = [{ alergeno_id: 1 }];
  tablaConError = 'ingrediente_alergenos';
  await expect(obtenerIdsRecetasConAlergia()).rejects.toEqual({ message: 'Error' });
});