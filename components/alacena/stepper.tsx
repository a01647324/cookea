import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radios } from '../../theme/theme';

interface Props {
  texto: string; 
  onMenos: () => void;
  onMas: () => void;
  menosDeshabilitado?: boolean;
  compacto?: boolean;
}
export function Stepper({ texto, onMenos, onMas, menosDeshabilitado, compacto }: Props) {
  return (
    <View style={[estilos.caja, compacto && estilos.cajaCompacta]}>
      <Pressable
        onPress={onMenos}
        disabled={menosDeshabilitado}
        hitSlop={8}
        style={[estilos.boton, menosDeshabilitado && estilos.deshabilitado]}
        accessibilityLabel="Quitar"
      >
        <Text style={estilos.simbolo}>−</Text>
      </Pressable>
      <Text style={estilos.texto} numberOfLines={1}>
        {texto}
      </Text>
      <Pressable onPress={onMas} hitSlop={8} style={estilos.boton} accessibilityLabel="Agregar">
        <Text style={estilos.simbolo}>+</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  caja: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radios.md,
    paddingHorizontal: 4,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  cajaCompacta: {
    paddingVertical: 2,
  },
  boton: {
    width: 32,
    height: 32,
    borderRadius: radios.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deshabilitado: {
    opacity: 0.3,
  },
  simbolo: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textoPrincipal,
    lineHeight: 22,
  },
  texto: {
    minWidth: 64,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: colors.textoPrincipal,
    paddingHorizontal: 4,
  },
});