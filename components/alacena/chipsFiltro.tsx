import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, espaciado, fuentes, radios, tamanos } from '../../theme/theme';

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
            accessibilityRole="button"
            accessibilityState={{ selected: activo }}
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
    gap: 8,
  },
  chip: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: radios.pill,
    borderWidth: 1,
    borderColor: colors.borde,
    backgroundColor: colors.superficie,
    justifyContent: 'center',
  },
  chipActivo: {
    backgroundColor: colors.primario,
    borderColor: colors.primario,
  },
  texto: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.base,
    color: colors.textoSuave,
  },
  textoActivo: {
    fontFamily: fuentes.negrita,
    color: colors.sobrePrimario,
  },
});
