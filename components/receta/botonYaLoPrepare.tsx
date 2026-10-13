import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, espaciado, radios } from '../../theme/theme';

interface Props {
  onPress: () => void;
}

export function BotonYaLoPrepare({ onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [estilos.boton, pressed && { opacity: 0.7 }]}
    >
      <Text style={estilos.texto}>✓ YA LO PREPARÉ</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: {
    borderRadius: radios.md,
    borderWidth: 1.5,
    borderColor: colors.olivaOscuro,
    paddingVertical: espaciado.md,
    alignItems: 'center',
    marginTop: espaciado.sm,
  },
  texto: {
    color: colors.olivaOscuro,
    fontSize: 14,
    fontWeight: '700',
  },
});