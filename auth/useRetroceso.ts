import { useCallback } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

// (nuevo) Solo intercepta Android mientras esta pantalla tiene foco.
export default function useRetroceso(onVolver: () => void) {
  useFocusEffect(useCallback(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => { onVolver(); return true; });
    return () => listener.remove();
  }, [onVolver]));
}
