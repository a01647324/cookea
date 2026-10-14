import { Ref, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { colors, espaciado, radios, tipografia, fuentes } from "../theme/theme";

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
  const { fontScale, width } = useWindowDimensions();
  const apilar = fontScale >= 1.4 || width < 340;
  const [oculta, setOculta] = useState(true);

  const hayError = error !== undefined && error !== "";

  return (
    <View style={styles.contenedor}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>

      <View style={[styles.fila, apilar && { flexDirection: "column", alignItems: "stretch" }, hayError && styles.filaConError]}>
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textoSecundario}
          secureTextEntry={esContrasena && oculta}
          accessibilityLabel={etiqueta}
          accessibilityHint={ayuda}
          {...propsDelCampo}
          style={[styles.input, apilar && { flex: 0 }, propsDelCampo.style]}
        />

        {esContrasena && (
          <TouchableOpacity
            style={styles.botonMostrar}
            onPress={() => setOculta(!oculta)}
            disabled={propsDelCampo.editable === false}
            accessibilityState={{ disabled: propsDelCampo.editable === false }}
            accessibilityRole="button"
            accessibilityLabel={(oculta ? "Mostrar: " : "Ocultar: ") + etiqueta}
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
    minHeight: 56,
    paddingHorizontal: espaciado.md,
    paddingVertical: espaciado.sm,
    color: colors.textoPrincipal,
    fontSize: 17,
    fontFamily: fuentes.regular,
  },
  botonMostrar: {
    minHeight: 56,
    minWidth: 48,
    paddingHorizontal: espaciado.md,
    justifyContent: "center",
    alignItems: "center",
  },
  textoMostrar: {
    color: colors.olivaOscuro,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
  },
  ayuda: {
    ...tipografia.cuerpo,
    fontSize: 16,
    lineHeight: 24,
    marginTop: espaciado.xs,
  },
  error: {
    color: colors.error,
    fontSize: 16,
    lineHeight: 24,
    marginTop: espaciado.xs,
  },
});
