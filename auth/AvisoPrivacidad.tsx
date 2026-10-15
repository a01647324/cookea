import { Modal, ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Encabezado from '../perfil/Encabezado';
import Icono, { NombreIcono } from '../components/Icono';
import { colors, espaciado, fuentes, radios, tamanos } from '../theme/theme';

type Seccion = { titulo: string; texto: string; icono: NombreIcono; color: string; fondo: string };

const SECCIONES: Seccion[] = [
  {
    titulo: 'Información que registras',
    texto: 'Para crear tu cuenta solicitamos correo electrónico, nombre y alias. Guardamos las preferencias que registres, como personas en tu hogar, alergias, ingredientes preferidos y electrodomésticos. También conservamos tu alacena, álbumes, planificación semanal y actividad en Comunidad.',
    icono: 'document-text-linear', color: colors.serenoIntenso, fondo: colors.serenoSuave,
  },
  {
    titulo: 'Uso de tu información',
    texto: 'Utilizamos esta información para administrar tu cuenta, conservar tus selecciones y ofrecer las funciones disponibles. Las alergias se utilizan para excluir recetas con ingredientes asociados a los alérgenos registrados. Los gustos no anulan las alergias. Revisa siempre los ingredientes antes de cocinar.',
    icono: 'list-check-linear', color: colors.acentoOscuro, fondo: colors.acentoSuave,
  },
  {
    titulo: 'Datos de salud',
    texto: 'Las alergias son datos sensibles relacionados con la salud. Registrarlas es opcional. Evita identificar a otras personas del hogar y registra únicamente la información necesaria.',
    icono: 'shield-check-linear', color: colors.destacadoIntenso, fondo: colors.destacadoSuave,
  },
  {
    titulo: 'Información pública y privada',
    texto: 'Tu alias identifica tus publicaciones e interacciones en Comunidad. Tu nombre, correo electrónico y preferencias personales no se muestran en tu perfil público.',
    icono: 'eye-linear', color: colors.calidoIntenso, fondo: colors.calidoSuave,
  },
  {
    titulo: 'Control de tu información',
    texto: 'Puedes consultar y editar tu perfil y preferencias desde Cuenta, así como solicitar la eliminación de tu cuenta. El correo para iniciar sesión se administra mediante Supabase Auth.',
    icono: 'pen-linear', color: colors.serenoIntenso, fondo: colors.serenoSuave,
  },
  {
    titulo: 'Eliminación de cuenta',
    texto: 'Al eliminar tu cuenta se borran los datos vinculados según las relaciones de la base. Las recetas publicadas se conservan y se atribuyen a «Usuario eliminado». Las imágenes asociadas pueden conservarse. El borrado no se puede deshacer.',
    icono: 'trash-bin-trash-linear', color: colors.peligro, fondo: colors.peligroSuave,
  },
  {
    titulo: 'Servicios utilizados',
    texto: 'Cookea utiliza Supabase para autenticación y almacenamiento de información.',
    icono: 'lock-keyhole-linear', color: colors.acentoOscuro, fondo: colors.acentoSuave,
  },
];

const ALCANCE =
  'Este texto describe la versión académica de Cookea. El aviso definitivo está pendiente de identificar al responsable y el medio de atención de solicitudes de privacidad. Para las pruebas del proyecto utiliza datos ficticios.';

export default function AvisoPrivacidad({ visible, onCerrar }: { visible: boolean; onCerrar: () => void }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCerrar}>
      <SafeAreaView style={styles.pantalla}>
        <Encabezado titulo="Privacidad" onVolver={onCerrar} textoVolver="Cerrar" />
        <ScrollView contentContainerStyle={styles.contenido}>
          <Text style={styles.titulo} accessibilityRole="header">Privacidad en Cookea</Text>
          <Text style={styles.intro}>Qué guardamos, para qué lo usamos y cómo puedes controlarlo.</Text>

          {SECCIONES.map((s) => (
            <View key={s.titulo} style={styles.tarjeta}>
              <View style={[styles.circulo, { backgroundColor: s.fondo }]}>
                <Icono nombre={s.icono} size={22} color={s.color} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.subtitulo}>{s.titulo}</Text>
                <Text style={styles.texto}>{s.texto}</Text>
              </View>
            </View>
          ))}

          <View style={styles.nota}>
            <Icono nombre="info-circle-linear" size={20} color={colors.textoSuave} />
            <Text style={styles.textoNota}>{ALCANCE}</Text>
          </View>

          <Pressable style={styles.boton} onPress={onCerrar} accessibilityRole="button" accessibilityLabel="Entendido">
            <Text style={styles.textoBoton}>Entendido</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colors.fondo },
  flex: { flex: 1 },
  contenido: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    padding: espaciado.md,
    paddingBottom: espaciado.xl,
  },
  titulo: { fontFamily: fuentes.titulo, fontSize: 26, lineHeight: 34, color: colors.texto },
  intro: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.destacado,
    lineHeight: 24,
    color: colors.textoSuave,
    marginTop: 4,
    marginBottom: espaciado.md,
  },
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: colors.superficie,
    borderRadius: radios.lg,
    padding: espaciado.md,
    marginBottom: espaciado.sm,
  },
  circulo: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  subtitulo: { fontFamily: fuentes.negrita, fontSize: tamanos.destacado, lineHeight: 22, color: colors.texto, marginBottom: 4 },
  texto: { fontFamily: fuentes.regular, fontSize: tamanos.cuerpo, lineHeight: 23, color: colors.textoSuave },
  nota: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espaciado.sm,
    backgroundColor: colors.fondoHundido,
    borderRadius: radios.md,
    padding: 14,
    marginTop: espaciado.xs,
  },
  textoNota: { flex: 1, fontFamily: fuentes.regular, fontSize: tamanos.base, lineHeight: 21, color: colors.textoSuave },
  boton: {
    minHeight: 56,
    backgroundColor: colors.encabezado,
    borderRadius: radios.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: espaciado.lg,
  },
  textoBoton: { fontFamily: fuentes.negrita, fontSize: tamanos.destacado, color: colors.sobreEncabezado },
});
