import { View, Text, Pressable, StyleSheet } from 'react-native';
import Icono from '../components/Icono';
import { colors, espaciado, fuentes, radios, tamanos } from '../theme/theme';
import { PERSONAS_MIN, PERSONAS_MAX } from './preferencias';

type Props = {
  valor: number;
  onCambiar: (nuevo: number) => void;
  deshabilitado?: boolean;
};

// SelectorPersonas: botones "−" y "+" con el número en medio (sin campo de texto).
export default function SelectorPersonas({ valor, onCambiar, deshabilitado = false }: Props) {
  const puedeBajar = !deshabilitado && valor > PERSONAS_MIN;
  const puedeSubir = !deshabilitado && valor < PERSONAS_MAX;

  return (
    <View style={styles.tarjeta}>
      <Pressable
        style={[styles.boton, styles.menos, !puedeBajar && styles.botonDeshabilitado]}
        onPress={() => onCambiar(valor - 1)}
        disabled={!puedeBajar}
        accessibilityRole="button"
        accessibilityLabel="Una persona menos"
        accessibilityState={{ disabled: !puedeBajar }}
      >
        <Icono nombre="minus-linear" size={28} color={colors.texto} />
      </Pressable>

      <View style={styles.centro}>
        <Text
          style={styles.numero}
          accessibilityLabel={valor === 1 ? '1 persona' : `${valor} personas`}
          accessibilityLiveRegion="polite"
        >
          {valor}
        </Text>
        <Text style={styles.unidad}>{valor === 1 ? 'persona' : 'personas'}</Text>
      </View>

      <Pressable
        style={[styles.boton, styles.mas, !puedeSubir && styles.botonDeshabilitado]}
        onPress={() => onCambiar(valor + 1)}
        disabled={!puedeSubir}
        accessibilityRole="button"
        accessibilityLabel="Una persona más"
        accessibilityState={{ disabled: !puedeSubir }}
      >
        <Icono nombre="add-linear" size={28} color={colors.sobreEncabezado} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.superficie,
    borderRadius: radios.lg,
    padding: espaciado.sm,
    marginVertical: espaciado.md,
  },
  boton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menos: {
    backgroundColor: colors.fondo,
  },
  mas: {
    backgroundColor: colors.encabezado,
  },
  botonDeshabilitado: {
    opacity: 0.3,
  },
  centro: {
    alignItems: 'center',
  },
  numero: {
    fontFamily: fuentes.titulo,
    fontSize: 44,
    lineHeight: 52,
    color: colors.texto,
  },
  unidad: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.base,
    color: colors.textoSuave,
  },
});
