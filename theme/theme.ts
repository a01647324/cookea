/**
 * theme.ts — tokens de diseño de Cookea.
 * Los colores tienen nombre por su función (primario, acento...), no por su tono.
 * Las claves antiguas (oliva, terracota...) se conservan al final apuntando a
 * la paleta nueva para que las pantallas que aún no se rediseñan no truenen.
 */

const paleta = {
  crema: '#F0EAD8',
  hinojo: '#AFA857',
  musgo: '#484B30',
  limon: '#F0BD6C',
  chile: '#B5120B',
  cedro: '#6F4128',
  arena: '#BFA885',
  caramelo: '#D99B66',
  espresso: '#26160D',
  cafe: '#593622',
  hueso: '#F2EEEB',
  gris: '#BFBAB8',
  blanco: '#FFFFFF',
};

export const colors = {
  fondo: paleta.hueso,
  superficie: paleta.blanco,
  superficieCalida: paleta.crema,

  primario: paleta.cafe,
  sobrePrimario: paleta.crema,

  acento: paleta.hinojo,
  acentoOscuro: paleta.musgo,
  sobreAcento: paleta.blanco,

  texto: paleta.espresso,
  textoSuave: paleta.cedro,
  textoTenue: paleta.gris,

  calificacion: paleta.limon,
  calido: paleta.caramelo,
  neutro: paleta.arena,
  borde: '#E2DCD6',
  peligro: paleta.chile,
  fondoHundido: '#E6E0DA',

  // Versiones translúcidas para etiquetas y avisos
  vidrio: 'rgba(38, 22, 13, 0.55)',
  vidrioBorde: 'rgba(255, 255, 255, 0.35)',
  calidoSuave: 'rgba(217, 155, 102, 0.18)',
  acentoSuave: 'rgba(175, 168, 87, 0.2)',
  peligroSuave: 'rgba(181, 18, 11, 0.08)',
  peligroBorde: 'rgba(181, 18, 11, 0.35)',

  // Claves anteriores
  background: paleta.hueso,
  surface: paleta.blanco,
  surfaceMuted: paleta.crema,
  oliva: paleta.hinojo,
  olivaOscuro: paleta.musgo,
  terracota: paleta.caramelo,
  mostaza: paleta.limon,
  vino: paleta.cafe,
  textoPrincipal: paleta.espresso,
  textoSecundario: paleta.cedro,
  textoSobreColor: paleta.blanco,
  textoSobreColorSecundario: 'rgba(255,255,255,0.75)',
  exito: paleta.musgo,
  error: paleta.chile,
  advertencia: paleta.caramelo,
  overlayCard: 'rgba(72, 75, 48, 0.55)',
  overlayCardBorde: 'rgba(255, 255, 255, 0.25)',
  inputFondo: 'rgba(255, 255, 255, 0.12)',
  inputBorde: 'rgba(255, 255, 255, 0.45)',
  botonPrincipal: paleta.cafe,
  tarjetaClara: paleta.crema,
} as const;

// Los nombres coinciden con los que se cargan en App.tsx con useFonts.
// Con fuentes personalizadas no se usa fontWeight: cada grosor es otra fuente.
export const fuentes = {
  titulo: 'Lora_700Bold',
  regular: 'Quicksand_500Medium',
  semibold: 'Quicksand_600SemiBold',
  negrita: 'Quicksand_700Bold',
} as const;

export const espaciado = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radios = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export const tipografia = {
  tituloGrande: {
    fontFamily: fuentes.titulo,
    fontSize: 28,
    lineHeight: 36,
    color: colors.texto,
  },
  titulo: {
    fontFamily: fuentes.titulo,
    fontSize: 22,
    lineHeight: 30,
    color: colors.texto,
  },
  subtitulo: {
    fontFamily: fuentes.semibold,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.2,
    color: colors.texto,
  },
  cuerpo: {
    fontFamily: fuentes.regular,
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.2,
    color: colors.texto,
  },
  chico: {
    fontFamily: fuentes.regular,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.3,
    color: colors.textoSuave,
  },
  nombreReceta: {
    fontFamily: fuentes.negrita,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: 0.8,
    color: colors.texto,
  },
};

export const sombra = {
  shadowColor: paleta.espresso,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 3,
};

export const coloresTarjetaReceta = [colors.calido, colors.acento, colors.neutro];