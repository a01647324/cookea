/**
 * theme.ts — tokens de diseño de Cookea.
 * Los colores tienen nombre por su función (primario, acento...), no por su tono.
 * Las claves antiguas (oliva, terracota...) se conservan al final apuntando a
 * la paleta nueva para que las pantallas que aún no se rediseñan no truenen.
 */

const paleta = {
  // Paleta principal
  salmon: '#E07970',
  melon: '#DE8948',
  limon: '#F9D58D',
  pistache: '#BBAB47',
  cielo: '#CDD7D8',
  olivo: '#809047',

  // Tonos oscuros sacados de la misma paleta (para texto legible)
  tinta: '#263133',
  tintaSuave: '#4F5F61',
  tintaTenue: '#8E9B9D',
  pistacheOscuro: '#6E6526',
  melonOscuro: '#9A5A24',
  salmonOscuro: '#A24B42',
  melonIntenso: '#D0742F',
  pistacheIntenso: '#9A8F2E',
  salmonIntenso: '#D2584E',
  cieloIntenso: '#5E7F86',

  // Base clara
  hueso: '#F2EEEB',
  blanco: '#FFFFFF',
  crema: '#F0EAD8',
  grisClaro: '#E2DCD6',
  hundido: '#E6E0DA',
  chile: '#B5120B',
};

export const colors = {
  fondo: paleta.hueso,
  superficie: paleta.blanco,
  superficieCalida: paleta.crema,

  primario: paleta.tinta,
  sobrePrimario: paleta.blanco,

  acento: paleta.pistache,
  acentoOscuro: paleta.pistacheOscuro,
  sobreAcento: paleta.tinta,

  texto: paleta.tinta,
  textoSuave: paleta.tintaSuave,
  textoTenue: paleta.tintaTenue,

  calido: paleta.melon,
  calidoOscuro: paleta.melonOscuro,
  destacado: paleta.salmon,
  destacadoOscuro: paleta.salmonOscuro,
  calidoIntenso: paleta.melonIntenso,
  acentoIntenso: paleta.pistacheIntenso,
  destacadoIntenso: paleta.salmonIntenso,
  serenoIntenso: paleta.cieloIntenso,
  resaltado: paleta.limon,
  sereno: paleta.cielo,
  encabezado: paleta.olivo,
  sobreEncabezado: paleta.blanco,
  calificacion: paleta.melon,
  neutro: paleta.cielo,
  borde: paleta.grisClaro,
  peligro: paleta.chile,
  fondoHundido: paleta.hundido,

  // Versiones translúcidas para etiquetas, avisos y fondos de íconos
  vidrio: 'rgba(38, 49, 51, 0.55)',
  vidrioBorde: 'rgba(255, 255, 255, 0.35)',
  calidoSuave: 'rgba(222, 137, 72, 0.18)',
  destacadoSuave: 'rgba(224, 121, 112, 0.18)',
  resaltadoSuave: 'rgba(249, 213, 141, 0.35)',
  acentoSuave: 'rgba(187, 171, 71, 0.22)',
  serenoSuave: 'rgba(205, 215, 216, 0.6)',
  peligroSuave: 'rgba(181, 18, 11, 0.08)',
  peligroBorde: 'rgba(181, 18, 11, 0.35)',
  velo: 'rgba(38, 49, 51, 0.45)',

  // Claves anteriores
  background: paleta.hueso,
  surface: paleta.blanco,
  surfaceMuted: paleta.crema,
  oliva: paleta.pistache,
  olivaOscuro: paleta.pistacheOscuro,
  terracota: paleta.melon,
  mostaza: paleta.limon,
  vino: paleta.salmonOscuro,
  textoPrincipal: paleta.tinta,
  textoSecundario: paleta.tintaSuave,
  textoSobreColor: paleta.blanco,
  textoSobreColorSecundario: 'rgba(255,255,255,0.75)',
  exito: paleta.pistacheOscuro,
  error: paleta.chile,
  advertencia: paleta.melon,
  overlayCard: 'rgba(38, 49, 51, 0.55)',
  overlayCardBorde: 'rgba(255, 255, 255, 0.25)',
  inputFondo: 'rgba(255, 255, 255, 0.12)',
  inputBorde: 'rgba(255, 255, 255, 0.45)',
  botonPrincipal: paleta.tinta,
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

// Escala un poco más amplia de lo habitual: la app la usan personas con
// poca experiencia con celulares, en pantallas pequeñas.
export const espaciado = {
  xs: 5,
  sm: 10,
  md: 18,
  lg: 28,
  xl: 36,
} as const;

// Tamaños de letra. Usen estos en lugar de números sueltos.
export const tamanos = {
  mini: 12,
  chico: 13,
  base: 14,
  cuerpo: 15,
  destacado: 16,
  grande: 17,
  enorme: 18,
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
    fontSize: 29,
    lineHeight: 38,
    color: colors.texto,
  },
  titulo: {
    fontFamily: fuentes.titulo,
    fontSize: 23,
    lineHeight: 31,
    color: colors.texto,
  },
  subtitulo: {
    fontFamily: fuentes.semibold,
    fontSize: 17,
    lineHeight: 25,
    letterSpacing: 0.2,
    color: colors.texto,
  },
  cuerpo: {
    fontFamily: fuentes.regular,
    fontSize: 15,
    lineHeight: 23,
    letterSpacing: 0.2,
    color: colors.texto,
  },
  chico: {
    fontFamily: fuentes.regular,
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: 0.3,
    color: colors.textoSuave,
  },
  nombreReceta: {
    fontFamily: fuentes.negrita,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.8,
    color: colors.texto,
  },
};

export const sombra = {
  shadowColor: paleta.tinta,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 3,
};

export const coloresTarjetaReceta = [colors.calido, colors.acento, colors.destacado];
