import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icono from '../components/Icono';
import { colors, espaciado, fuentes } from '../theme/theme';

type Props = { titulo: string; onVolver?: () => void; textoVolver?: string; deshabilitado?: boolean };

// Encabezado del módulo: el contenedor de cada pantalla administra el área segura.
export default function Encabezado({ titulo, onVolver, textoVolver = 'Volver', deshabilitado = false }: Props) {
  return (
    <View style={styles.fila}>
      <View style={styles.lado}>
        {onVolver && (
          <Pressable
            onPress={onVolver}
            disabled={deshabilitado}
            style={[styles.boton, deshabilitado && styles.inactivo]}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={textoVolver}
            accessibilityState={{ disabled: deshabilitado }}
          >
            <Icono nombre="arrow-left-linear" size={22} color={colors.texto} />
          </Pressable>
        )}
      </View>
      <Text style={styles.titulo} numberOfLines={1} accessibilityRole="header">
        {titulo}
      </Text>
      <View style={styles.lado} />
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: espaciado.md,
  },
  lado: {
    width: 48,
  },
  boton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    flex: 1,
    fontFamily: fuentes.titulo,
    fontSize: 19,
    lineHeight: 26,
    textAlign: 'center',
    color: colors.texto,
  },
  inactivo: {
    opacity: 0.5,
  },
});
