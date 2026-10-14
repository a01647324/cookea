import { Modal, ScrollView, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Encabezado from '../perfil/Encabezado';
import { colors, tipografia } from '../theme/theme';
const SECCIONES = [
 ['Información que registras', 'Para crear tu cuenta solicitamos correo electrónico, nombre y alias. Guardamos las preferencias que registres, como personas en tu hogar, alergias, ingredientes preferidos y electrodomésticos. También conservamos tu alacena, álbumes, planificación semanal y actividad en Comunidad.'],
 ['Uso de tu información', 'Utilizamos esta información para administrar tu cuenta, conservar tus selecciones y ofrecer las funciones disponibles. Las alergias se utilizan para excluir recetas con ingredientes asociados a los alérgenos registrados. Los gustos no anulan las alergias. Revisa siempre los ingredientes antes de cocinar.'],
 ['Datos de salud', 'Las alergias son datos sensibles relacionados con la salud. Registrarlas es opcional. Evita identificar a otras personas del hogar y registra únicamente la información necesaria.'],
 ['Información pública y privada', 'Tu alias identifica tus publicaciones e interacciones en Comunidad. Tu nombre, correo electrónico y preferencias personales no se muestran en tu perfil público.'],
 ['Control de tu información', 'Puedes consultar y editar tu perfil y preferencias desde Cuenta, así como solicitar la eliminación de tu cuenta. El correo para iniciar sesión se administra mediante Supabase Auth.'],
 ['Eliminación de cuenta', 'Al eliminar tu cuenta se borran los datos vinculados según las relaciones de la base. Las recetas publicadas se conservan y se atribuyen a «Usuario eliminado». Las imágenes asociadas pueden conservarse. El borrado no se puede deshacer.'],
 ['Servicios utilizados', 'Cookea utiliza Supabase para autenticación y almacenamiento de información.'],
 ['Alcance de esta versión', 'Este texto describe la versión académica de Cookea. El aviso definitivo está pendiente de identificar al responsable y el medio de atención de solicitudes de privacidad. Para las pruebas del proyecto utiliza datos ficticios.'],
];
export default function AvisoPrivacidad({ visible, onCerrar }: { visible: boolean; onCerrar: () => void }) {
 return <Modal visible={visible} animationType="slide" onRequestClose={onCerrar}><SafeAreaView style={styles.pantalla}>
 <Encabezado titulo="Privacidad" onVolver={onCerrar} textoVolver="Cerrar" />
 <ScrollView contentContainerStyle={styles.contenido}><Text style={tipografia.titulo}>Privacidad en Cookea</Text>
 {SECCIONES.map(([titulo,texto]) => <Text key={titulo} style={styles.parrafo}><Text style={tipografia.subtitulo}>{titulo}{'\n'}</Text>{texto}</Text>)}
 </ScrollView></SafeAreaView></Modal>;
}
const styles = StyleSheet.create({ pantalla: { flex: 1, backgroundColor: colors.fondo }, contenido: { padding: 24, paddingBottom: 36 }, parrafo: { ...tipografia.cuerpo, marginTop: 20 } });
