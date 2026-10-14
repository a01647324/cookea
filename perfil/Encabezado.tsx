import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { colors, fuentes } from '../theme/theme';

type Props = { titulo: string; onVolver?: () => void; textoVolver?: string; deshabilitado?: boolean };

// (nuevo) Encabezado del módulo: el contenedor de cada pantalla administra el área segura.
export default function Encabezado({ titulo, onVolver, textoVolver = 'Volver', deshabilitado = false }: Props) {
  return <View style={styles.fila}>
    <View style={styles.lado}>{onVolver && <TouchableOpacity onPress={onVolver} disabled={deshabilitado} style={styles.boton} accessibilityRole="button" accessibilityLabel={textoVolver} accessibilityState={{ disabled: deshabilitado }}>
      <Text style={[styles.volver, deshabilitado && styles.inactivo]}>‹ {textoVolver}</Text>
    </TouchableOpacity>}</View>
    <Text style={styles.titulo} accessibilityRole="header">{titulo}</Text>
    <View style={styles.lado} />
  </View>;
}

const styles = StyleSheet.create({
  fila: { minHeight: 56, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.borde },
  lado: { flex: 1 },
  boton: { minHeight: 56, minWidth: 48, justifyContent: 'center', paddingHorizontal: 8 },
  volver: { fontFamily: fuentes.semibold, fontSize: 17, color: colors.primario },
  titulo: { flex: 2, fontFamily: fuentes.semibold, fontSize: 18, textAlign: 'center', color: colors.texto },
  inactivo: { opacity: 0.5 },
});
