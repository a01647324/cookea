import { ImageSourcePropType } from 'react-native';
import { normalizar } from './categorias';

export type AccionMascota =
  | 'cortar'
  | 'mezclar'
  | 'hervir'
  | 'sarten'
  | 'horno'
  | 'licuar'
  | 'esperar'
  | 'celebrar'
  | 'pensar'
  | 'preparar'
  | 'escribir'
  | 'foto'
  | 'lista'
  | 'explicar'
  | 'revisar'
  | 'publicar'
  | 'preocupado'
  | 'asomarse';

export const IMAGENES_MASCOTA: Partial<Record<AccionMascota, ImageSourcePropType>> = {
  cortar: require('../assets/images/mascota/cortar.webp'),
  mezclar: require('../assets/images/mascota/mezclar.webp'),
  hervir: require('../assets/images/mascota/hervir.webp'),
  sarten: require('../assets/images/mascota/sarten.webp'),
  horno: require('../assets/images/mascota/horno.webp'),
  licuar: require('../assets/images/mascota/licuar.webp'),
  esperar: require('../assets/images/mascota/esperar.webp'),
  celebrar: require('../assets/images/mascota/celebrar.webp'),
  pensar: require('../assets/images/mascota/pensar.webp'),
  preparar: require('../assets/images/mascota/preparar.webp'),
  escribir: require('../assets/images/mascota/escribir.webp'),
  foto: require('../assets/images/mascota/foto.webp'),
  lista: require('../assets/images/mascota/lista.webp'),
  explicar: require('../assets/images/mascota/explicar.webp'),
  revisar: require('../assets/images/mascota/revisar.webp'),
  publicar: require('../assets/images/mascota/publicar.webp'),
  preocupado: require('../assets/images/mascota/preocupado.webp'),
  asomarse: require('../assets/images/mascota/asomarse.webp'),
};

export const TEXTO_ACCION: Record<AccionMascota, string> = {
  cortar: 'cortando',
  mezclar: 'mezclando',
  hervir: 'hirviendo',
  sarten: 'en el sartén',
  horno: 'horneando',
  licuar: 'licuando',
  esperar: 'esperando',
  celebrar: 'celebrando',
  pensar: 'leyendo la receta',
  preparar: 'llegando del mercado',
  escribir: 'escribiendo',
  foto: 'tomando la foto',
  lista: 'anotando ingredientes',
  explicar: 'explicando los pasos',
  revisar: 'revisando',
  publicar: 'compartiendo',
  preocupado: 'preocupado',
  asomarse: 'saludando',
};

// Inicios de palabra que delatan cada acción
const PALABRAS: [AccionMascota, string[]][] = [
  ['licuar', ['licu', 'moler', 'muel', 'tritur', 'procesa']],
  ['horno', ['horn', 'gratin']],
  ['sarten', ['frei', 'frie', 'frit', 'sofri', 'sofre', 'dora', 'dore', 'saltea', 'sarten', 'comal', 'plancha', 'asar', 'asa ', 'tuest']],
  ['hervir', ['hierv', 'herv', 'cuec', 'coce', 'cocer', 'olla', 'calient']],
  ['cortar', ['cort', 'picar', 'pica', 'picad', 'piqu', 'rebana', 'pela', 'trocea', 'ralla', 'filete', 'desmenu', 'parte']],
  ['mezclar', ['mezcl', 'bate', 'bati', 'batir', 'revuelv', 'revolv', 'incorpor', 'amasa', 'integra']],
  ['esperar', ['repos', 'enfri', 'refriger', 'esper', 'marin', 'congel', 'deja']],
];

export function accionDePaso(texto: string, conTemporizador: boolean): AccionMascota {
  const palabras = normalizar(texto).split(/[^a-z]+/).filter(Boolean);
  for (const palabra of palabras) {
    if (palabra.startsWith('picant')) continue;
    const encontrada = PALABRAS.find(([, claves]) => claves.some((c) => palabra.startsWith(c.trim())));
    if (encontrada) return encontrada[0];
  }
  return conTemporizador ? 'esperar' : 'pensar';
}
