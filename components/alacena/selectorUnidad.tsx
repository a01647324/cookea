import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radios } from '../../theme/theme';
import { UnidadUI, etiquetaUnidadUI } from '../../lib/unidades';

interface Props {
  opciones: UnidadUI[];
  seleccionada: UnidadUI;
  onCambiar: (unidad: UnidadUI) => void;
}

export function SelectorUnidad({ opciones, seleccionada, onCambiar }: Props) {
  return (
    <View style={estilos.fila}>
      {opciones.map((u) => {
        const activa = u === seleccionada;
        return (
          <Pressable
            key={u}
            disabled={opciones.length === 1}
            onPress={() => onCambiar(u)}
            style={[estilos.pastilla, activa && estilos.activa]}
          >
            <Text style={[estilos.texto, activa && estilos.textoActivo]}>{etiquetaUnidadUI(u)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    gap: 6,
  },
  pastilla: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radios.pill,
    borderWidth: 1,
    borderColor: colors.borde,
    backgroundColor: colors.surface,
  },
  activa: {
    backgroundColor: colors.terracota,
    borderColor: colors.terracota,
  },
  texto: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textoSecundario,
  },
  textoActivo: {
    color: colors.textoSobreColor,
  },
});