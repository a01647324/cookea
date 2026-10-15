import { Ref, useState } from 'react';
import { View, Text, TextInput, TextInputProps, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import Icono from '../components/Icono';
import { colors, espaciado, radios, fuentes, tamanos } from '../theme/theme';

// CampoFormulario: un campo con su etiqueta arriba, el error debajo y, si es
// contraseña, un botón de "Mostrar"/"Ocultar".
type Props = TextInputProps & {
  etiqueta: string;
  error?: string;
  ayuda?: string;
  esContrasena?: boolean;
  ref?: Ref<TextInput>;
};

export default function CampoFormulario({ etiqueta, error, ayuda, esContrasena = false, ref, ...propsDelCampo }: Props) {
  const { fontScale, width } = useWindowDimensions();
  const apilar = fontScale >= 1.4 || width < 340;
  const [oculta, setOculta] = useState(true);
  const [enfocado, setEnfocado] = useState(false);

  const hayError = error !== undefined && error !== '';
  const bloqueado = propsDelCampo.editable === false;

  return (
    <View style={styles.contenedor}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>

      <View
        style={[
          styles.fila,
          apilar && { flexDirection: 'column', alignItems: 'stretch' },
          enfocado && styles.filaEnfocada,
          hayError && styles.filaConError,
          bloqueado && styles.filaBloqueada,
        ]}
      >
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textoTenue}
          secureTextEntry={esContrasena && oculta}
          accessibilityLabel={etiqueta}
          accessibilityHint={ayuda}
          {...propsDelCampo}
          onFocus={(e) => {
            setEnfocado(true);
            propsDelCampo.onFocus?.(e);
          }}
          onBlur={(e) => {
            setEnfocado(false);
            propsDelCampo.onBlur?.(e);
          }}
          style={[styles.input, apilar && { flex: 0 }, bloqueado && { color: colors.textoSuave }, propsDelCampo.style]}
        />

        {esContrasena && (
          <Pressable
            style={styles.botonMostrar}
            onPress={() => setOculta(!oculta)}
            disabled={bloqueado}
            accessibilityState={{ disabled: bloqueado }}
            accessibilityRole="button"
            accessibilityLabel={(oculta ? 'Mostrar: ' : 'Ocultar: ') + etiqueta}
          >
            <Icono nombre={oculta ? 'eye-linear' : 'eye-closed-linear'} size={20} color={colors.acentoOscuro} />
            <Text style={styles.textoMostrar}>{oculta ? 'Mostrar' : 'Ocultar'}</Text>
          </Pressable>
        )}
      </View>

      {ayuda !== undefined && !hayError && <Text style={styles.ayuda}>{ayuda}</Text>}

      {hayError && (
        <View style={styles.filaError}>
          <Icono nombre="danger-triangle-linear" size={16} color={colors.peligro} />
          <Text style={styles.error} accessibilityLiveRegion="polite">
            {error}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    marginBottom: espaciado.md,
  },
  etiqueta: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.cuerpo,
    color: colors.texto,
    marginBottom: 6,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.superficie,
    borderWidth: 1.5,
    borderColor: colors.borde,
    borderRadius: radios.md,
  },
  filaEnfocada: {
    borderColor: colors.encabezado,
  },
  filaConError: {
    borderColor: colors.peligro,
    backgroundColor: colors.peligroSuave,
  },
  filaBloqueada: {
    backgroundColor: colors.fondoHundido,
  },
  input: {
    flex: 1,
    minHeight: 54,
    paddingHorizontal: espaciado.md,
    paddingVertical: espaciado.sm,
    color: colors.texto,
    fontSize: tamanos.grande,
    fontFamily: fuentes.regular,
  },
  botonMostrar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 54,
    minWidth: 48,
    paddingHorizontal: espaciado.md,
  },
  textoMostrar: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.base,
    color: colors.acentoOscuro,
  },
  ayuda: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.base,
    lineHeight: 21,
    color: colors.textoSuave,
    marginTop: 6,
  },
  filaError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 6,
  },
  error: {
    flex: 1,
    fontFamily: fuentes.semibold,
    fontSize: tamanos.base,
    lineHeight: 21,
    color: colors.peligro,
  },
});
