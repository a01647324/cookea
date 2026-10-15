import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icono from '../Icono';
import { colors, espaciado, fuentes, tamanos } from '../../theme/theme';

interface Props {
  onPress: () => void;
  // 'banner' = tarjeta ancha (Alacena); 'enlace' = texto corto (encabezado de sección del Home)
  variante?: 'banner' | 'enlace';
}

export function BotonQueCocino({ onPress, variante = 'banner' }: Props) {
  if (variante === 'enlace') {
    return (
      <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" style={estilos.enlace}>
        <Text style={estilos.textoEnlace}>¿Qué cocino hoy?</Text>
        <Icono nombre="alt-arrow-right-linear" size={16} color={colors.acentoOscuro} />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [estilos.banner, pressed && { opacity: 0.85 }]}
    >
      <View style={estilos.circulo}>
        <Icono nombre="chef-hat-linear" size={26} color={colors.calidoOscuro} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={estilos.titulo}>¿Qué cocino hoy?</Text>
        <Text style={estilos.subtitulo}>Recetas con lo que ya tienes</Text>
      </View>
      <View style={estilos.flecha}>
        <Icono nombre="alt-arrow-right-linear" size={20} color={colors.sobrePrimario} />
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  enlace: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  textoEnlace: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.base,
    color: colors.acentoOscuro,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.resaltado,
    borderRadius: 20,
    padding: 14,
    marginHorizontal: espaciado.md,
    marginTop: espaciado.md,
  },
  circulo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontFamily: fuentes.titulo,
    fontSize: 18,
    lineHeight: 24,
    color: colors.texto,
  },
  subtitulo: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.chico,
    color: colors.textoSuave,
    marginTop: 2,
  },
  flecha: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
