import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { HojaInferior } from './HojaInferior';
import { IconoCompat, NombreIconoCompat } from './IconoCompat';
import { colors, espaciado, fuentes, radios, tamanos } from '../theme/theme';

interface Props {
  visible: boolean;
  titulo: string;
  mensaje: string;
  textoConfirmar: string;
  icono?: NombreIconoCompat;
  cargando?: boolean;
  onConfirmar: () => void;
  onCerrar: () => void;
}

export function ConfirmarHoja({
  visible,
  titulo,
  mensaje,
  textoConfirmar,
  icono = 'trash-bin-trash-linear',
  cargando = false,
  onConfirmar,
  onCerrar,
}: Props) {
  return (
    <HojaInferior visible={visible} onCerrar={onCerrar}>
      <View style={estilos.contenido}>
        <View style={estilos.halo}>
          <View style={estilos.circulo}>
            <IconoCompat nombre={icono} size={32} color={colors.peligro} />
          </View>
        </View>
        <Text style={estilos.titulo}>{titulo}</Text>
        <Text style={estilos.mensaje}>{mensaje}</Text>
      </View>

      <Pressable
        onPress={onConfirmar}
        disabled={cargando}
        style={({ pressed }) => [estilos.boton, estilos.confirmar, (pressed || cargando) && { opacity: 0.85 }]}
        accessibilityRole="button"
      >
        {cargando ? (
          <ActivityIndicator color={colors.sobrePrimario} />
        ) : (
          <Text style={estilos.textoConfirmar}>{textoConfirmar}</Text>
        )}
      </Pressable>
      <Pressable onPress={onCerrar} disabled={cargando} style={[estilos.boton, estilos.cancelar]} accessibilityRole="button">
        <Text style={estilos.textoCancelar}>Cancelar</Text>
      </Pressable>
    </HojaInferior>
  );
}

const estilos = StyleSheet.create({
  contenido: {
    alignItems: 'center',
    paddingHorizontal: espaciado.sm,
    marginBottom: espaciado.lg,
  },
  halo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.peligroSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circulo: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontFamily: fuentes.titulo,
    fontSize: 22,
    lineHeight: 29,
    color: colors.texto,
    textAlign: 'center',
    marginTop: espaciado.md,
  },
  mensaje: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.cuerpo,
    lineHeight: 23,
    color: colors.textoSuave,
    textAlign: 'center',
    marginTop: espaciado.xs,
  },
  boton: {
    minHeight: 54,
    borderRadius: radios.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmar: {
    backgroundColor: colors.peligro,
  },
  cancelar: {
    marginTop: espaciado.sm,
    backgroundColor: colors.superficie,
    borderWidth: 1.5,
    borderColor: colors.borde,
  },
  textoConfirmar: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.sobrePrimario,
  },
  textoCancelar: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.texto,
  },
});
