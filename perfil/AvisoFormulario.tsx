import { StyleSheet, Text, View } from 'react-native';
import Icono from '../components/Icono';
import { colors, espaciado, fuentes, radios, tamanos } from '../theme/theme';

// Aviso rojo arriba de un formulario, en lugar de una alerta
export default function AvisoFormulario({ texto }: { texto: string }) {
  if (texto === '') return null;
  return (
    <View style={styles.aviso} accessibilityLiveRegion="polite">
      <Icono nombre="danger-triangle-linear" size={22} color={colors.peligro} />
      <Text style={styles.texto}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  aviso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espaciado.sm,
    backgroundColor: colors.peligroSuave,
    borderWidth: 1,
    borderColor: colors.peligroBorde,
    borderRadius: radios.md,
    padding: 14,
    marginBottom: espaciado.md,
  },
  texto: {
    flex: 1,
    fontFamily: fuentes.semibold,
    fontSize: tamanos.cuerpo,
    lineHeight: 22,
    color: colors.peligro,
  },
});
