import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, espaciado, radios } from "../theme/theme";
import { PERSONAS_MIN, PERSONAS_MAX } from "./preferencias";

type Props = {
  valor: number;
  onCambiar: (nuevo: number) => void;
  deshabilitado?: boolean;
};

// SelectorPersonas: botones "−" y "+" con el número en medio.
// No hay campo de texto, así que no se puede escribir un valor inválido.
// (clase) Componente declarado como función que recibe props
export default function SelectorPersonas({ valor, onCambiar, deshabilitado = false }: Props) {
  // Los botones se deshabilitan en los límites (1 y 20)
  const puedeBajar = !deshabilitado && valor > PERSONAS_MIN;
  const puedeSubir = !deshabilitado && valor < PERSONAS_MAX;

  return (
    <View style={styles.fila}>
      <TouchableOpacity
        style={[styles.boton, !puedeBajar && styles.botonDeshabilitado]}
        onPress={() => onCambiar(valor - 1)}
        disabled={!puedeBajar}
        accessibilityRole="button"
        accessibilityLabel="Una persona menos"
        accessibilityState={{ disabled: !puedeBajar }}
      >
        <Text style={styles.textoBoton}>−</Text>
      </TouchableOpacity>

      {/* (nuevo) accessibilityLiveRegion lee el número nuevo al cambiar (Android) */}
      <Text
        style={styles.numero}
        accessibilityLabel={valor === 1 ? "1 persona" : `${valor} personas`}
        accessibilityLiveRegion="polite"
      >
        {valor}
      </Text>

      <TouchableOpacity
        style={[styles.boton, !puedeSubir && styles.botonDeshabilitado]}
        onPress={() => onCambiar(valor + 1)}
        disabled={!puedeSubir}
        accessibilityRole="button"
        accessibilityLabel="Una persona más"
        accessibilityState={{ disabled: !puedeSubir }}
      >
        <Text style={styles.textoBoton}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

// (clase) Estilos al final del archivo. Para cambiar el diseño, solo se toca esto.
const styles = StyleSheet.create({
  fila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: espaciado.md,
  },
  boton: {
    width: 64,
    height: 64,
    borderRadius: radios.pill,
    backgroundColor: colors.oliva,
    alignItems: "center",
    justifyContent: "center",
  },
  botonDeshabilitado: {
    opacity: 0.3,
  },
  textoBoton: {
    color: colors.textoSobreColor,
    fontSize: 32,
    fontWeight: "700",
  },
  numero: {
    minWidth: 96,
    textAlign: "center",
    fontSize: 40,
    fontWeight: "700",
    color: colors.textoPrincipal,
  },
});
