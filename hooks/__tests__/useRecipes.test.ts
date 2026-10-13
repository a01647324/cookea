import { renderHook, waitFor } from '@testing-library/react-native';
import { useRecipes } from '../useRecipes';
import { supabase } from '../../lib/supabase';
import { obtenerIdsRecetasConAlergia } from '../../lib/alergias';

jest.mock('../../lib/supabase', () => ({ supabase: { from: jest.fn() } }));
jest.mock('../../lib/alergias', () => ({ obtenerIdsRecetasConAlergia: jest.fn() }));

const recetas = [
  { id: 1, nombre: 'Arroz rojo', visible: true },
  { id: 2, nombre: 'Quesadillas', visible: true },
  { id: 3, nombre: 'Arroz con leche', visible: true },
  { id: 4, nombre: 'Arroz oculto', visible: false },
];

let errorSupabase: any = null;

// Simula la consulta a la tabla recetas aplicando los mismos filtros que usa el hook
(supabase.from as jest.Mock).mockImplementation(() => {
  let lista = [...recetas];
  const consulta: any = {
    select: () => consulta,
    order: () => consulta,
    eq: (campo: string, valor: any) => {
      lista = lista.filter((r: any) => r[campo] === valor);
      return consulta;
    },
    ilike: (campo: string, texto: string) => {
      const buscado = texto.replace(/%/g, '').toLowerCase();
      lista = lista.filter((r: any) => r[campo].toLowerCase().includes(buscado));
      return consulta;
    },
    not: (campo: string, operador: string, ids: string) => {
      lista = lista.filter((r: any) => !ids.includes(String(r[campo])));
      return consulta;
    },
    then: (resolver: any) => resolver({ data: errorSupabase ? null : lista, error: errorSupabase }),
  };
  return consulta;
});

async function buscar(texto: string) {
  const { result } = await renderHook(() => useRecipes({ busqueda: texto }));
  await waitFor(() => expect(result.current.cargando).toBe(false));
  return result.current;
}

beforeEach(() => {
  errorSupabase = null;
  (obtenerIdsRecetasConAlergia as jest.Mock).mockResolvedValue([]);
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

test('TC-06: buscar "arroz" regresa solo las recetas que lo contienen', async () => {
  const { recetas } = await buscar('arroz');
  expect(recetas.map((r) => r.id).sort()).toEqual([1, 3]);
});

test('TC-07: si no hay coincidencias regresa una lista vacia sin error', async () => {
  const { recetas, error } = await buscar('lasagna');
  expect(recetas).toEqual([]);
  expect(error).toBeNull();
});

test('TC-08: no muestra recetas a las que el usuario es alergico', async () => {
  (obtenerIdsRecetasConAlergia as jest.Mock).mockResolvedValue([3]);
  const { recetas } = await buscar('arroz');
  expect(recetas.map((r) => r.id)).toEqual([1]);
});

test('TC-09: no muestra recetas ocultas', async () => {
  const { recetas } = await buscar('arroz');
  expect(recetas.find((r) => r.id === 4)).toBeUndefined();
});

test('TC-10: si falla Supabase se muestra un mensaje de error', async () => {
  errorSupabase = { message: 'Error de red' };
  const { recetas, error } = await buscar('');
  expect(recetas).toEqual([]);
  expect(error).toBe('Error de red');
});