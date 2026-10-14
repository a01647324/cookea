import { beforeEach, expect, jest, test } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { supabase } from '../../lib/supabase';
import useSession from '../useSession';

jest.mock('../../lib/supabase', () => ({ supabase: { auth: { getSession: jest.fn(), onAuthStateChange: jest.fn(), signOut: jest.fn() } } }));
jest.mock('@react-native-async-storage/async-storage', () => ({ __esModule: true, default: { getItem: jest.fn<() => Promise<null>>().mockResolvedValue(null), setItem: jest.fn(), removeItem: jest.fn() } }));
const auth = supabase.auth as any;
let evento: (tipo: string, sesion: any) => void;
let resolver: (valor: any) => void;
const cuenta = { user: { id: 'cuenta-prueba', email: 'prueba@ejemplo.invalid' } };
beforeEach(() => {
 jest.clearAllMocks();
 auth.getSession.mockImplementation(() => new Promise(resolve => { resolver = resolve; }));
 auth.onAuthStateChange.mockImplementation((callback: typeof evento) => { evento = callback; return { data: { subscription: { unsubscribe: jest.fn() } } }; });
});
test('la lectura inicial tardía no restaura la sesión después de cerrar', async () => {
 const ui = await renderHook(() => useSession());
 await act(async () => { evento('SIGNED_OUT', null); resolver({ data: { session: cuenta } }); });
 await waitFor(() => expect(ui.result.current.cargando).toBe(false));
 expect(ui.result.current.session).toBeNull();
});
test('la lectura inicial tardía no borra una sesión recién iniciada', async () => {
 const ui = await renderHook(() => useSession());
 await act(async () => { evento('SIGNED_IN', cuenta); resolver({ data: { session: null } }); });
 await waitFor(() => expect(ui.result.current.cargando).toBe(false));
 expect(ui.result.current.session?.user.id).toBe('cuenta-prueba');
});
