import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, espaciado, radios, tipografia } from '../../theme/theme';

interface Props {
  onPress: () => void;
  // 'banner' = tarjeta ancha (Alacena); 'enlace' = texto "Ver más →" (encabezado de sección del Home)
  variante?: 'banner' | 'enlace';
}

/**
 * BotonQueCocino
 *
 * Acceso a la pantalla "¿Qué cocino hoy?". Sus estilos viven aquí para no tener que
 * tocar el StyleSheet de AlacenaScreen ni el de HomeScreen.
 */
export function BotonQueCocino({ onPress, variante = 'banner' }: Props) {
  if (variante === 'enlace') {
    return (
      <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button">
        <Text style={estilos.enlace}>¿Qué cocino hoy? →</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [estilos.banner, pressed && { opacity: 0.8 }]}
    >
      <Text style={estilos.emoji}>🍳</Text>
      <View style={{ flex: 1 }}>
        <Text style={estilos.titulo}>¿Qué cocino hoy?</Text>
        <Text style={estilos.subtitulo}>Recetas que puedes preparar con lo que tienes</Text>
      </View>
      <Text style={estilos.flecha}>→</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  enlace: {
    color: colors.olivaOscuro,
    fontSize: 13,
    fontWeight: '700',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.md,
    backgroundColor: colors.oliva,
    borderRadius: radios.md,
    paddingVertical: espaciado.md,
    paddingHorizontal: espaciado.md,
    marginHorizontal: espaciado.md,
    marginTop: espaciado.md,
  },
  emoji: {
    fontSize: 26,
  },
  titulo: {
    ...tipografia.subtitulo,
    color: colors.textoSobreColor,
  },
  subtitulo: {
    fontSize: 12,
    color: colors.textoSobreColor,
    marginTop: 2,
  },
  flecha: {
    color: colors.textoSobreColor,
    fontSize: 20,
    fontWeight: '700',
  },
});