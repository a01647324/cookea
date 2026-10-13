import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, espaciado, radios } from '../../theme/theme';

interface Opcion {
  clave: string;
  etiqueta: string;
}

interface Props {
  opciones: Opcion[];
  seleccionada: string;
  onSeleccionar: (clave: string) => void;
}

export function ChipsFiltro({ opciones, seleccionada, onSeleccionar }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={estilos.fila}
      keyboardShouldPersistTaps="handled"
    >
      {opciones.map((op) => {
        const activo = op.clave === seleccionada;
        return (
          <Pressable
            key={op.clave}
            onPress={() => onSeleccionar(op.clave)}
            style={[estilos.chip, activo && estilos.chipActivo]}
          >
            <Text style={[estilos.texto, activo && estilos.textoActivo]}>{op.etiqueta}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  fila: {
    paddingHorizontal: espaciado.md,
    paddingVertical: 4,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radios.md,
    borderWidth: 1,
    borderColor: colors.borde,
    backgroundColor: 'transparent',
  },
  chipActivo: {
    backgroundColor: colors.oliva,
    borderColor: colors.oliva,
  },
  texto: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textoSecundario,
    letterSpacing: 0.3,
  },
  textoActivo: {
    color: colors.textoSobreColor,
  },
});