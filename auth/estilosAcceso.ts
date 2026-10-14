import { StyleSheet } from 'react-native';
import { colors, fuentes, tipografia } from '../theme/theme';
// Estilos locales: no cambian las pantallas de otros módulos.
export default StyleSheet.create({
 flex: { flex: 1 }, fondo: { flex: 1, backgroundColor: colors.fondo },
 scrollContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingBottom: 32 },
 logo: { width: '80%', maxWidth: 280, aspectRatio: 3.94, marginBottom: 24, alignSelf: 'center' },
 seccion: { ...tipografia.subtitulo, marginTop: 20, marginBottom: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.borde },
 card: { width: '100%', maxWidth: 520, backgroundColor: colors.superficieCalida, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.borde },
 titulo: { ...tipografia.tituloGrande, color: colors.texto, marginBottom: 12 },
 fraseBienvenida: { ...tipografia.subtitulo, textAlign: 'center', marginBottom: 20, paddingHorizontal: 16 },
 descripcion: { ...tipografia.cuerpo, fontSize: 17, lineHeight: 26, marginBottom: 24 },
 botonPrincipal: { minHeight: 56, backgroundColor: colors.acentoOscuro, borderRadius: 16, padding: 16, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
 textoBotonPrincipal: { fontFamily: fuentes.negrita, fontSize: 17, lineHeight: 25, textAlign: 'center', color: colors.superficie },
 linkRegistro: { minHeight: 56, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
 textoLinkRegistro: { fontFamily: fuentes.semibold, fontSize: 16, lineHeight: 25, color: colors.acentoOscuro, textAlign: 'center' },
 textoLinkRegistroBold: { fontFamily: fuentes.negrita, color: colors.acentoOscuro },
 filaPrivacidad: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
 textoPrivacidad: { ...tipografia.cuerpo, flex: 1, fontSize: 16, lineHeight: 25 },
 loader: { marginVertical: 16 },
 aviso: { ...tipografia.cuerpo, color: colors.peligro, fontSize: 16, lineHeight: 25, marginBottom: 16 },
});
