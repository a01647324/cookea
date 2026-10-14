import { beforeEach, afterEach, expect, jest, test } from '@jest/globals';
import { renderHook, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { preventScreenCaptureAsync, allowScreenCaptureAsync } from 'expo-screen-capture';
import useProteccionCapturas from '../../perfil/useProteccionCapturas';
let mockFoco = true;
jest.mock('expo-screen-capture', () => ({ preventScreenCaptureAsync:jest.fn(), allowScreenCaptureAsync:jest.fn() }));
jest.mock('@react-navigation/native', () => ({ useFocusEffect: (efecto: () => void | (() => void)) => {
 const React = jest.requireActual<typeof import('react')>('react');
 const foco=mockFoco;
 React.useEffect(() => foco ? efecto() : undefined,[efecto,foco]);
} }));
const prevenir = jest.mocked(preventScreenCaptureAsync);
const permitir = jest.mocked(allowScreenCaptureAsync);
beforeEach(() => { jest.clearAllMocks(); jest.replaceProperty(Platform,'OS','android'); mockFoco=true; prevenir.mockResolvedValue(undefined); permitir.mockResolvedValue(undefined); });
afterEach(() => { jest.restoreAllMocks(); });
test('una pantalla montada sin foco no bloquea; al enfocarse activa y al salir libera', async () => {
 mockFoco=false; const ui=await renderHook(() => useProteccionCapturas('preferencias'));
 expect(prevenir).not.toHaveBeenCalled(); mockFoco=true; await ui.rerender(undefined);
 await waitFor(() => expect(prevenir).toHaveBeenCalledTimes(1));
 const clave=prevenir.mock.calls[0][0]; mockFoco=false; await ui.rerender(undefined);
 await waitFor(() => expect(permitir).toHaveBeenCalledWith(clave)); await ui.unmount();
});
test('cada instancia libera únicamente su propia clave', async () => {
 const primera=await renderHook(() => useProteccionCapturas('perfil'));
 const segunda=await renderHook(() => useProteccionCapturas('perfil'));
 await waitFor(() => expect(prevenir).toHaveBeenCalledTimes(2));
 const claves=prevenir.mock.calls.map(c => c[0]); expect(claves[0]).not.toBe(claves[1]);
 await primera.unmount(); await waitFor(() => expect(permitir).toHaveBeenCalledTimes(1)); expect(permitir.mock.calls[0][0]).toBe(claves[0]);
 await segunda.unmount(); await waitFor(() => expect(permitir).toHaveBeenCalledTimes(2)); expect(permitir.mock.calls[1][0]).toBe(claves[1]);
});
test('salir mientras se activa espera al resultado antes de liberar', async () => {
 let completar!: () => void; prevenir.mockImplementationOnce(() => new Promise<void>(resolve => { completar=resolve; }));
 const ui=await renderHook(() => useProteccionCapturas('alergias'));
 await waitFor(() => expect(prevenir).toHaveBeenCalledTimes(1));
 mockFoco=false; await ui.rerender(undefined); expect(permitir).not.toHaveBeenCalled();
 completar(); await waitFor(() => expect(permitir).toHaveBeenCalledWith(prevenir.mock.calls[0][0])); await ui.unmount();
});
test('el navegador no llama a la API nativa ni simula bloqueo', async () => {
 jest.replaceProperty(Platform,'OS','web'); const ui=await renderHook(() => useProteccionCapturas('registro'));
 expect(prevenir).not.toHaveBeenCalled(); await ui.unmount(); expect(permitir).not.toHaveBeenCalled();
});

test('iOS no instala el canvas nativo mientras se investiga la pantalla negra', async () => {
 jest.replaceProperty(Platform,'OS','ios'); const ui=await renderHook(() => useProteccionCapturas('preferencias'));
 expect(prevenir).not.toHaveBeenCalled(); await ui.unmount(); expect(permitir).not.toHaveBeenCalled();
});
