import { Alert, Platform } from 'react-native';

export type TipoAviso = 'error' | 'exito' | 'info';

export interface Aviso {
  id: number;
  titulo: string;
  mensaje?: string;
  tipo: TipoAviso;
}

type Receptor = (aviso: Aviso) => void;

// Cada AvisoHost montado se registra aquí; el último registrado es el que está más arriba
// (por ejemplo, el de una hoja abierta encima de la pantalla).
const receptores: Receptor[] = [];
let contador = 0;

export function registrarReceptor(receptor: Receptor) {
  receptores.push(receptor);
  return () => {
    const i = receptores.lastIndexOf(receptor);
    if (i >= 0) receptores.splice(i, 1);
  };
}

export function reenviarAviso(aviso: Aviso) {
  receptores[receptores.length - 1]?.(aviso);
}

function adivinarTipo(titulo: string): TipoAviso {
  if (/no se pudo|no pudimos|salió mal|error|no válid/i.test(titulo)) return 'error';
  if (/guardad|listo|agregad|lista/i.test(titulo)) return 'exito';
  return 'info';
}

export function mostrarAviso(titulo: string, mensaje?: string, tipo?: TipoAviso) {
  const aviso: Aviso = { id: ++contador, titulo, mensaje, tipo: tipo ?? adivinarTipo(titulo) };
  const receptor = receptores[receptores.length - 1];
  if (receptor) return receptor(aviso);

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(mensaje ? `${titulo}\n\n${mensaje}` : titulo);
    return;
  }
  Alert.alert(titulo, mensaje);
}
