import { Alert, Platform } from 'react-native';
//para que tmb muestre el aviso en web!!1
export function mostrarAviso(titulo: string, mensaje?: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(mensaje ? `${titulo}\n\n${mensaje}` : titulo);
    }
    return;
  }
  Alert.alert(titulo, mensaje);
}