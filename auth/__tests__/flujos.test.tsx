import { beforeEach, expect, jest, test } from '@jest/globals';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { usePreventRemove } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import usePreferencias from '../../perfil/usePreferencias';
import useCocina from '../../perfil/useCocina';
import PersonalizaScreen from '../../perfil/PersonalizaScreen';
import NuevaContrasenaScreen from '../NuevaContrasenaScreen';
import EliminarCuentaModal from '../../perfil/EliminarCuentaModal';
import SignUpScreen from '../SignUpScreen';
import LoginScreen from '../LoginScreen';
import EditarPerfilScreen from '../../perfil/EditarPerfilScreen';
import PreferenciasScreen from '../../perfil/PreferenciasScreen';
import { useUserProfile } from '../../hooks/useUserProfile';
import useSession from '../useSession';
import { seleccionarSeccion } from '../../perfil/secciones';

jest.mock('../../perfil/useProteccionCapturas', () => ({ __esModule:true, default:jest.fn() }));
jest.mock('../../lib/supabase', () => ({ supabase: { auth: { getSession: jest.fn(), updateUser: jest.fn(), signInWithPassword: jest.fn(), signOut: jest.fn(), signUp: jest.fn() }, from:jest.fn(), rpc: jest.fn() } }));
jest.mock('@react-navigation/native', () => ({ usePreventRemove: jest.fn(), useFocusEffect: (efecto: () => void) => { jest.requireActual<typeof import('react')>('react').useEffect(efecto, [efecto]); } }));
jest.mock('../useRetroceso', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: jest.requireActual<typeof import('react-native')>('react-native').View, useSafeAreaInsets: () => ({top:0,bottom:0,left:0,right:0}) }));
jest.mock('../../perfil/usePreferencias', () => ({ __esModule:true, default:jest.fn(), MENSAJE_ERROR_GUARDAR:'No se pudo guardar', MENSAJE_SIN_CONEXION:'Sin conexión' }));
jest.mock('../../perfil/useCocina', () => ({ __esModule:true, default:jest.fn() }));
jest.mock('../../hooks/useUserProfile', () => ({ useUserProfile: jest.fn() }));
jest.mock('../useSession', () => ({ __esModule: true, default: jest.fn() }));
const auth = supabase.auth as any;
const rpc = supabase.rpc as any;
let preferencias: any;
let cocina: any;
beforeEach(() => {
 jest.clearAllMocks();
 seleccionarSeccion("cuenta-prueba", "restricciones");
 (useSession as any).mockReturnValue({session:{user:{id:'cuenta-prueba',email:'prueba@ejemplo.invalid'}}});
 (useUserProfile as any).mockReturnValue({perfil:{id:'cuenta-prueba',alias:'Alias inicial',nombre:'Nombre inicial',personas_hogar:1},error:null,recargar:jest.fn()});
 auth.getSession.mockResolvedValue({ data:{ session:{ user:{ id:'cuenta-prueba', email:'prueba@ejemplo.invalid' } } } });
 auth.signUp.mockResolvedValue({data:{session:null},error:null});
 (supabase.from as any).mockReturnValue({select:() => ({order:async () => ({data:[{id:1,nombre:'Alérgeno de prueba'}],error:null})})});
 auth.updateUser.mockResolvedValue({error:null}); auth.signOut.mockResolvedValue({error:null});
 auth.signInWithPassword.mockResolvedValue({error:null}); rpc.mockResolvedValue({error:null,status:200});
 preferencias = { alergenos:[{id:1,nombre:'Alérgeno de prueba'}],personas:1,propias:new Set(),hogar:new Set(),cargando:false,errorCarga:'',cambiarPersonas:jest.fn(),alternarPropia:jest.fn(),alternarHogar:jest.fn(),limpiarPropias:jest.fn(),limpiarHogar:jest.fn(),recargar:jest.fn(),guardar:jest.fn<() => Promise<string | null>>().mockResolvedValue(null) };
 cocina = { ingredientes:[],electrodomesticos:[],gustos:new Map(),aparatos:new Set(),cargando:false,error:'',recargar:jest.fn(),alternarGusto:jest.fn(),alternarAparato:jest.fn(),guardar:jest.fn<() => Promise<string | null>>().mockResolvedValue(null) };
 (usePreferencias as any).mockReturnValue(preferencias); (useCocina as any).mockReturnValue(cocina);
 jest.spyOn(Alert,'alert').mockImplementation(() => {});
});
test('Personaliza termina, libera la protección y vuelve solo después de guardar todo', async () => {
 const navigation = {goBack:jest.fn()}; const ui = await render(<PersonalizaScreen navigation={navigation} />);
 await fireEvent.press(ui.getByRole('button',{name:'Siguiente'}));
 await fireEvent.press(ui.getByRole('button',{name:'Siguiente'}));
 await fireEvent.press(ui.getByRole('button',{name:'Terminar'}));
 await waitFor(() => expect(navigation.goBack).toHaveBeenCalledTimes(1));
 expect(preferencias.guardar).toHaveBeenCalledTimes(1); expect(cocina.guardar).toHaveBeenCalledTimes(1);
 expect(auth.updateUser).toHaveBeenCalledWith({data:{personalizo:true}});
 expect(jest.mocked(usePreventRemove).mock.calls.at(-1)?.[0]).toBe(false);
});
test('si cocina falla, Personaliza no se marca ni sale; permite reintentar', async () => {
 cocina.guardar.mockResolvedValueOnce('No se completó cocina');
 const navigation = {goBack:jest.fn()}; const ui = await render(<PersonalizaScreen navigation={navigation} />);
 await fireEvent.press(ui.getByRole('button',{name:'Siguiente'})); await fireEvent.press(ui.getByRole('button',{name:'Siguiente'}));
 await fireEvent.press(ui.getByRole('button',{name:'Terminar'}));
 expect(auth.updateUser).not.toHaveBeenCalled(); expect(navigation.goBack).not.toHaveBeenCalled();
 expect(ui.getByText('No se completó cocina')).toBeTruthy();
 await fireEvent.press(ui.getByRole('button',{name:'Terminar'}));
 await waitFor(() => expect(navigation.goBack).toHaveBeenCalledTimes(1));
});
test('Hacerlo después no guarda ni marca Personaliza', async () => {
 const navigation = {goBack:jest.fn()}; const ui = await render(<PersonalizaScreen navigation={navigation} />);
 await fireEvent.press(ui.getByRole('button',{name:'Hacerlo después'}));
 expect(navigation.goBack).toHaveBeenCalledTimes(1); expect(preferencias.guardar).not.toHaveBeenCalled(); expect(auth.updateUser).not.toHaveBeenCalled();
});
test('Nueva contraseña confirma cancelar y el éxito ya no ofrece cancelar', async () => {
 const onCancelar=jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
 const ui = await render(<NuevaContrasenaScreen onCancelar={onCancelar} onGuardada={async () => {}} onTerminar={() => {}} />);
 await fireEvent.press(ui.getByRole('button',{name:'Cancelar'})); expect(onCancelar).not.toHaveBeenCalled();
 const botones = jest.mocked(Alert.alert).mock.calls.at(-1)?.[2]; botones?.[0].onPress?.();
 await fireEvent.changeText(ui.getByLabelText('Nueva contraseña'),'abc12345');
 await fireEvent.changeText(ui.getByLabelText('Repite la nueva contraseña'),'abc12345');
 await fireEvent.press(ui.getByRole('button',{name:'Guardar contraseña'}));
 await waitFor(() => expect(ui.getByText('Tu contraseña se actualizó')).toBeTruthy());
 expect(ui.queryByRole('button',{name:'Cancelar'})).toBeNull(); expect(onCancelar).not.toHaveBeenCalled();
});
test('sin ELIMINAR no se verifica contraseña ni se llama al RPC', async () => {
 const ui = await render(<EliminarCuentaModal visible onCerrar={() => {}} />);
 await fireEvent.changeText(ui.getByLabelText('Escribe tu contraseña para confirmar'),'abc12345');
 await fireEvent.press(ui.getByRole('button',{name:'Eliminar mi cuenta para siempre'}));
 expect(auth.signInWithPassword).not.toHaveBeenCalled(); expect(rpc).not.toHaveBeenCalled();
});
test('contraseña incorrecta nunca llama al RPC destructivo', async () => {
 auth.signInWithPassword.mockResolvedValue({error:{code:'invalid_credentials'}});
 const ui = await render(<EliminarCuentaModal visible onCerrar={() => {}} />);
 await fireEvent.changeText(ui.getByLabelText('Escribe tu contraseña para confirmar'),'incorrecta');
 await fireEvent.changeText(ui.getByLabelText('Escribe ELIMINAR para confirmar'),'ELIMINAR');
 await fireEvent.press(ui.getByRole('button',{name:'Eliminar mi cuenta para siempre'}));
 await waitFor(() => expect(ui.getByText('La contraseña no es correcta.')).toBeTruthy()); expect(rpc).not.toHaveBeenCalled();
});
test('respuesta incierta del borrado cierra localmente sin asegurar que se eliminó', async () => {
 rpc.mockResolvedValue({error:{code:'network'},status:0});
 const ui = await render(<EliminarCuentaModal visible onCerrar={() => {}} />);
 await fireEvent.changeText(ui.getByLabelText('Escribe tu contraseña para confirmar'),'abc12345');
 await fireEvent.changeText(ui.getByLabelText('Escribe ELIMINAR para confirmar'),'ELIMINAR');
 await fireEvent.press(ui.getByRole('button',{name:'Eliminar mi cuenta para siempre'}));
 await waitFor(() => expect(auth.signOut).toHaveBeenCalledWith({scope:'local'}));
 expect(jest.mocked(Alert.alert).mock.calls.at(-1)?.[0]).toBe('No pudimos confirmar si tu cuenta se eliminó');
});

test('Registro conserva el formulario al abrir/cerrar privacidad y exige aceptación', async () => {
 const navigation = { navigate: jest.fn() };
 const ui = await render(<SignUpScreen navigation={navigation} />);
 await waitFor(() => expect(ui.getByText('No tengo alergias')).toBeTruthy());
 await fireEvent.changeText(ui.getByLabelText('Correo'),'prueba@ejemplo.invalid');
 await fireEvent.changeText(ui.getByLabelText('Contraseña'),'abc12345');
 await fireEvent.changeText(ui.getByLabelText('Confirmar contraseña'),'abc12345');
 await fireEvent.changeText(ui.getByLabelText('Alias (lo verán otros usuarios)'),'Prueba');
 await fireEvent.changeText(ui.getByLabelText('Nombre (privado)'),'Persona de prueba');
 await fireEvent.press(ui.getByText('No tengo alergias'));
 await fireEvent.press(ui.getByText('Leer información de privacidad'));
 await fireEvent.press(ui.getByRole('button',{name:'Cerrar'}));
 expect(ui.getByDisplayValue('prueba@ejemplo.invalid')).toBeTruthy();
 await fireEvent.press(ui.getByRole('button', {name:'Crear cuenta'}));
 expect(auth.signUp).not.toHaveBeenCalled();
 expect(ui.getByText('Debes aceptar el aviso de privacidad para crear tu cuenta')).toBeTruthy();
 await fireEvent(ui.getByLabelText('Acepto el tratamiento descrito en la información de privacidad'),'valueChange',true);
 await fireEvent.press(ui.getByRole('button', {name:'Crear cuenta'}));
 await waitFor(() => expect(auth.signUp).toHaveBeenCalledTimes(1));
 expect(auth.signUp.mock.calls[0][0].options.data).toEqual({alias:'Prueba',nombre:'Persona de prueba',acepto_privacidad:true,alergias:[]});
 await waitFor(() => expect(ui.getByRole('button', { name: 'Ir a iniciar sesión' })).toBeTruthy());
 expect(ui.queryByLabelText('Contraseña')).toBeNull();
 await fireEvent.press(ui.getByRole('button', { name: 'Ir a iniciar sesión' }));
 expect(navigation.navigate).toHaveBeenCalledWith('Login');
 await ui.unmount();
 const acceso = await render(<LoginScreen navigation={navigation} />);
 await waitFor(() => expect(acceso.getByDisplayValue('prueba@ejemplo.invalid')).toBeTruthy());
 expect(acceso.getByLabelText('Contraseña').props.value).toBe('');
});

test('recargar el perfil de la misma cuenta no borra el borrador', async () => {
 const navigation = {goBack:jest.fn(),dispatch:jest.fn()}; const ui = await render(<EditarPerfilScreen navigation={navigation} />);
 await fireEvent.changeText(ui.getByLabelText('Alias'),'Borrador actual');
 (useUserProfile as any).mockReturnValue({perfil:{id:'cuenta-prueba',alias:'Alias recargado',nombre:'Nombre recargado',personas_hogar:1},error:null,recargar:jest.fn()});
 await ui.rerender(<EditarPerfilScreen navigation={navigation} />);
 expect(ui.getByDisplayValue('Borrador actual')).toBeTruthy();
 expect(jest.mocked(usePreventRemove).mock.calls.at(-1)?.[0]).toBe(true);
});
test('reintentar una carga fallida de cocina no recarga las alergias ya editadas', async () => {
 cocina.error='No pudimos cargar cocina';
 const navigation = {goBack:jest.fn(),dispatch:jest.fn()}; const ui = await render(<PreferenciasScreen navigation={navigation} />);
 await fireEvent.press(ui.getByRole('button',{name:'Reintentar'}));
 expect(cocina.recargar).toHaveBeenCalledTimes(1); expect(preferencias.recargar).not.toHaveBeenCalled();
});
test('Cancelar eliminación limpia frase y contraseña para la próxima apertura', async () => {
 const onCerrar=jest.fn(); const ui = await render(<EliminarCuentaModal visible onCerrar={onCerrar} />);
 await fireEvent.changeText(ui.getByLabelText('Escribe tu contraseña para confirmar'),'abc12345');
 await fireEvent.changeText(ui.getByLabelText('Escribe ELIMINAR para confirmar'),'ELIMINAR');
 await fireEvent.press(ui.getByRole('button',{name:'Cancelar, no eliminar mi cuenta'}));
 await ui.rerender(<EliminarCuentaModal visible onCerrar={onCerrar} />);
 expect(ui.getByLabelText('Escribe tu contraseña para confirmar').props.value).toBe('');
 expect(ui.getByLabelText('Escribe ELIMINAR para confirmar').props.value).toBe('');
 expect(rpc).not.toHaveBeenCalled(); expect(onCerrar).toHaveBeenCalledTimes(1);
});

test.each(['restricciones','hogar','cocina'] as const)('Preferencias muestra solo el bloque %s', async seccion => {
 seleccionarSeccion('cuenta-prueba',seccion);
 const ui=await render(<PreferenciasScreen navigation={{goBack:jest.fn(),dispatch:jest.fn()}} />);
 expect(Boolean(ui.queryByText('Tus alergias'))).toBe(seccion === 'restricciones');
 expect(Boolean(ui.queryByText('Personas en tu casa'))).toBe(seccion === 'hogar');
 expect(Boolean(ui.queryByText('No hay electrodomésticos disponibles. Tus selecciones guardadas se conservan.'))).toBe(seccion === 'cocina');
});

test.each(['restricciones','hogar','cocina'] as const)('Guardar %s no escribe bloques ajenos', async seccion => {
 seleccionarSeccion('cuenta-prueba',seccion); preferencias.hayCambios=true; cocina.hayCambios=true;
 const ui=await render(<PreferenciasScreen navigation={{goBack:jest.fn(),dispatch:jest.fn()}} />);
 await fireEvent.press(ui.getByRole('button',{name:'Guardar'}));
 await waitFor(() => expect(ui.getByText('Tus preferencias se guardaron')).toBeTruthy());
 if (seccion === 'cocina') expect(preferencias.guardar).not.toHaveBeenCalled();
 else expect(preferencias.guardar).toHaveBeenCalledWith(preferencias.propias,preferencias.hogar,seccion);
 if (seccion === 'hogar') expect(cocina.guardar).not.toHaveBeenCalled();
 else expect(cocina.guardar).toHaveBeenCalledWith(seccion === 'restricciones' ? 'gustos' : 'cocina');
});

test('acceso muestra errores junto a los campos y no consulta Auth con datos incompletos', async () => {
 const ui = await render(<LoginScreen navigation={{navigate:jest.fn()}} />);
 await fireEvent.press(ui.getByRole('button', {name:'Iniciar sesión'}));
 expect(ui.getByText('Escribe un correo válido, como nombre@correo.com.')).toBeTruthy();
 expect(ui.getByText('Escribe tu contraseña.')).toBeTruthy();
 expect(auth.signInWithPassword).not.toHaveBeenCalled();
 expect(ui.getByLabelText('Correo').props.autoComplete).toBe('email');
 expect(ui.getByLabelText('Contraseña').props.autoComplete).toBe('current-password');
});
