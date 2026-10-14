import { useCallback, useId } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { allowScreenCaptureAsync, preventScreenCaptureAsync } from 'expo-screen-capture';

// (nuevo) Ordenar las llamadas nativas evita carreras al cambiar de pestaña rápidamente.
let cola: Promise<void> = Promise.resolve();
function programar(operacion: () => Promise<void>) {
  cola = cola.then(operacion).catch(() => {
    if (__DEV__) console.warn('[capturas] No se pudo actualizar la protección; comprueba el módulo nativo en el dispositivo.');
  });
}

export default function useProteccionCapturas(pantalla: string) {
  const instancia = useId();
  const clave = 'cookea-' + pantalla + '-' + instancia;
  useFocusEffect(useCallback(() => {
    // iOS: el canvas seguro nativo está causando pantallas negras en el dispositivo.
    // Mantener desactivado hasta validar una solución nativa; no simular protección.
    // Android conserva FLAG_SECURE. El navegador tampoco tiene bloqueo nativo.
    if (Platform.OS !== 'android') return;
    let activa = true;
    let solicitada = false;
    programar(async () => {
      if (!activa) return;
      solicitada = true;
      await preventScreenCaptureAsync(clave);
    });
    return () => {
      activa = false;
      programar(async () => {
        if (solicitada) await allowScreenCaptureAsync(clave);
      });
    };
  }, [clave]));
}
