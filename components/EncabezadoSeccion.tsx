import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icono from './Icono';
import { colors, espaciado, fuentes, tamanos } from '../theme/theme';

interface Props {
  titulo: string;
  accion?: string;
  onAccion?: () => void;
}

export function EncabezadoSeccion({ titulo, accion, onAccion }: Props) {
  return (
    <View style={estilos.fila}>
      <Text style={estilos.titulo} accessibilityRole="header">
        {titulo}
      </Text>
      {accion && onAccion && (
        <Pressable onPress={onAccion} hitSlop={10} style={estilos.accion}>
          <Text style={estilos.textoAccion}>{accion}</Text>
          <Icono nombre="alt-arrow-right-linear" size={16} color={colors.acentoOscuro} />
        </Pressable>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: espaciado.md,
    marginBottom: espaciado.sm,
  },
  titulo: {
    fontFamily: fuentes.titulo,
    fontSize: 19,
    lineHeight: 26,
    color: colors.texto,
  },
  accion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  textoAccion: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.base,
    color: colors.acentoOscuro,
  },
});
