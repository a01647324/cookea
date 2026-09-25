/**
 * theme.ts — "tokens" de diseño de Cookea.
 *
 * Idea: en vez de escribir colores/tamaños sueltos en cada pantalla (lo que hace
 * que luego cambiar "ese verde" implique buscar en 15 archivos), todos los
 * componentes importan estos valores desde un solo lugar. Si el diseño cambia,
 * se actualiza aquí una vez y se refleja en toda la app.

 */

export const colors = {
  // Fondo general de la app
  background: '#FBF7F0',
  surface: '#FFFFFF',
  surfaceMuted: '#F2ECDF',

  // Marca
  oliva: '#6E7A45', // header "Tu semana", tab activo
  olivaOscuro: '#535D34',
  terracota: '#C97355', // tarjeta "Agua de horchata"
  mostaza: '#E3A857', // barra de búsqueda / tarjeta "Mole con arroz"
  vino: '#8B3A3A', // detalle, calificación en estrellas

  // Texto
  textoPrincipal: '#3A2E22', // marrón oscuro, como el logo
  textoSecundario: '#8A8378',
  textoSobreColor: '#FFFFFF', // texto blanco sobre tarjetas de color
  textoSobreColorSecundario: 'rgba(255,255,255,0.75)', // texto blanco atenuado (placeholders, subtítulos sobre fondo oscuro/imagen)

  // Estados
  exito: '#4C7A4C',
  error: '#B23A3A',
  advertencia: '#C98A2C',

  borde: '#E7DFD0',

  // Pantallas con imagen de fondo (login/registro): tarjeta tipo "glass"
  overlayCard: 'rgba(110, 122, 69, 0.55)', // (legado) fondo translúcido verde oliva — ya no se usa en LoginScreen
  overlayCardBorde: 'rgba(255, 255, 255, 0.25)', // (legado)
  inputFondo: 'rgba(255, 255, 255, 0.12)', // (legado)
  inputBorde: 'rgba(255, 255, 255, 0.45)', // (legado)
  botonPrincipal: '#E07970', // Salmon Paste — botón "Iniciar Sesión"

  // Tarjeta sólida sobre la imagen de fondo (versión actual del login)
  tarjetaClara: '#C8CCAF', // verde salvia sólido
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
  // Usamos las fuentes del sistema (San Francisco en iOS, Roboto en Android) para
  // no depender de expo-font en este stage. Si más adelante quieren la fuente
  // tipo "serif" del logo COOKEA, se puede cargar con expo-font y agregarla aquí.
  titulo: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.textoPrincipal,
  },
  subtitulo: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textoPrincipal,
  },
  cuerpo: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: colors.textoPrincipal,
  },
  chico: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: colors.textoSecundario,
  },
};

export const coloresTarjetaReceta = [colors.terracota, colors.oliva, colors.mostaza];