import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icono from '../components/Icono';
import { colors, espaciado, fuentes, radios, tamanos } from '../theme/theme';

type Props = { titulo: string; texto?: string; onVolver: () => void; textoBoton?: string };

// Pantalla de éxito después de guardar, con un botón para volver
export default function PantallaListo({ titulo, texto, onVolver, textoBoton = 'Volver' }: Props) {
  return (
    <View style={styles.contenido}>
      <View style={styles.halo}>
        <View style={styles.circulo}>
          <Icono nombre="check-circle-linear" size={44} color={colors.encabezado} />
        </View>
      </View>
      <Text style={styles.titulo} accessibilityRole="header">
        {titulo}
      </Text>
      {!!texto && <Text style={styles.texto}>{texto}</Text>}
      <Pressable onPress={onVolver} style={styles.boton} accessibilityRole="button" accessibilityLabel={textoBoton}>
        <Text style={styles.textoBoton}>{textoBoton}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenido: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: espaciado.lg,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  halo: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: colors.acentoSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circulo: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontFamily: fuentes.titulo,
    fontSize: 25,
    lineHeight: 33,
    color: colors.texto,
    textAlign: 'center',
    marginTop: espaciado.lg,
  },
  texto: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.destacado,
    lineHeight: 24,
    color: colors.textoSuave,
    textAlign: 'center',
    marginTop: espaciado.sm,
    maxWidth: 340,
  },
  boton: {
    alignSelf: 'stretch',
    minHeight: 56,
    borderRadius: radios.pill,
    backgroundColor: colors.encabezado,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: espaciado.xl,
  },
  textoBoton: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.sobreEncabezado,
  },
});
