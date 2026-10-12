import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, espaciado, radios } from "../theme/theme";
import { Alergeno } from "../types/database";

type Props = {
  alergenos: Alergeno[];
  seleccionados: Set<number>;
  onAlternar: (id: number) => void;
  deshabilitado?: boolean;
};

// ListaAlergenos: la lista de alérgenos para marcar y desmarcar.
// Basada en la lista de screens/alergias.tsx: cada alérgeno es una fila
// completa que se puede tocar, con un cuadro y una ✓ cuando está marcado.
// (clase) Componente declarado como función que recibe props
export default function ListaAlergenos({
  alergenos,
  seleccionados,
  onAlternar,
  deshabilitado = false,
}: Props) {
  return (
    <View style={styles.lista}>
      {/* (clase) .map para dibujar una fila por cada alérgeno */}
      {alergenos.map((alergeno) => {
        const marcado = seleccionados.has(alergeno.id);

        return (
          <TouchableOpacity
            key={alergeno.id}
            style={[styles.fila, marcado && styles.filaMarcada]}
            onPress={() => onAlternar(alergeno.id)}
            disabled={deshabilitado}
            // (nuevo) El lector de pantalla dice "casilla, marcada" o "sin marcar"
            accessibilityRole="checkbox"
            accessibilityState={{ checked: marcado, disabled: deshabilitado }}
            accessibilityLabel={alergeno.nombre}
          >
            <View style={[styles.casilla, marcado && styles.casillaMarcada]}>
              {marcado && <Text style={styles.palomita}>✓</Text>}
            </View>
            <Text style={styles.nombre}>{alergeno.nombre}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// (clase) Estilos al final del archivo. Para cambiar el diseño, solo se toca esto.
const styles = StyleSheet.create({
  lista: {
    gap: espaciado.sm,
  },
  fila: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: espaciado.md,
    paddingVertical: espaciado.sm,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: radios.md,
    backgroundColor: colors.surface,
  },
  filaMarcada: {
    borderColor: colors.botonPrincipal,
    borderWidth: 2,
  },
  casilla: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderColor: colors.textoSecundario,
    borderRadius: radios.sm,
    marginRight: espaciado.md,
    alignItems: "center",
    justifyContent: "center",
  },
  casillaMarcada: {
    backgroundColor: colors.botonPrincipal,
    borderColor: colors.botonPrincipal,
  },
  palomita: {
    color: colors.textoSobreColor,
    fontSize: 18,
    fontWeight: "700",
  },
  nombre: {
    flex: 1,
    fontSize: 17,
    color: colors.textoPrincipal,
  },
});
