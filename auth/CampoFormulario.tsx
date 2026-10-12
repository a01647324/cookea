import { Ref, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { colors, espaciado, radios, tipografia } from "../theme/theme";

// CampoFormulario: un campo con su etiqueta arriba, el error debajo y, si es
// contraseña, un botón de "Mostrar"/"Ocultar". Se usa en las tres pantallas
// de contraseña para que todas se vean y se comporten igual.
type Props = TextInputProps & {
  etiqueta: string; // texto que siempre se ve arriba del campo
  error?: string; // (nuevo) mensaje de error debajo del campo, en vez de alert()
  ayuda?: string; // texto de ayuda que se ve desde antes de escribir
  esContrasena?: boolean; // agrega el botón "Mostrar"/"Ocultar"
  ref?: Ref<TextInput>; // para pasar al siguiente campo con el teclado
};

// (clase) Componente declarado como función que recibe props
export default function CampoFormulario({
  etiqueta,
  error,
  ayuda,
  esContrasena = false,
  ref,
  ...propsDelCampo
}: Props) {
  // (clase) useState para saber si la contraseña se ve o está oculta
  const [oculta, setOculta] = useState(true);

  const hayError = error !== undefined && error !== "";

  return (
    <View style={styles.contenedor}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>

      <View style={[styles.fila, hayError && styles.filaConError]}>
        <TextInput
          ref={ref}
          style={styles.input}
          placeholderTextColor={colors.textoSecundario}
          secureTextEntry={esContrasena && oculta}
          accessibilityLabel={etiqueta}
          accessibilityHint={ayuda}
          {...propsDelCampo}
        />

        {esContrasena && (
          <TouchableOpacity
            style={styles.botonMostrar}
            onPress={() => setOculta(!oculta)}
            accessibilityRole="button"
            accessibilityLabel={oculta ? "Mostrar contraseña" : "Ocultar contraseña"}
          >
            <Text style={styles.textoMostrar}>{oculta ? "Mostrar" : "Ocultar"}</Text>
          </TouchableOpacity>
        )}
      </View>

      {ayuda !== undefined && !hayError && <Text style={styles.ayuda}>{ayuda}</Text>}

      {/* (nuevo) accessibilityLiveRegion hace que el lector de pantalla
          lea el error en cuanto aparece (Android) */}
      {hayError && (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
    </View>
  );
}

// (clase) Estilos al final del archivo. Para cambiar el diseño, solo se toca esto.
const styles = StyleSheet.create({
  contenedor: {
    marginBottom: espaciado.md,
  },
  etiqueta: {
    ...tipografia.subtitulo,
    marginBottom: espaciado.xs,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: radios.md,
  },
  filaConError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  input: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: espaciado.md,
    paddingVertical: espaciado.sm,
    color: colors.textoPrincipal,
    fontSize: 16,
  },
  botonMostrar: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: espaciado.md,
    justifyContent: "center",
    alignItems: "center",
  },
  textoMostrar: {
    color: colors.olivaOscuro,
    fontSize: 14,
    fontWeight: "700",
  },
  ayuda: {
    ...tipografia.chico,
    marginTop: espaciado.xs,
  },
  error: {
    color: colors.error,
    fontSize: 14,
    marginTop: espaciado.xs,
  },
});
