import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { UnidadUI, etiquetaUnidadUI } from '../../lib/unidades';
import { colors, fuentes, radios, tamanos } from '../../theme/theme';

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
            accessibilityRole="button"
            accessibilityState={{ selected: activa }}
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
    minWidth: 48,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: radios.pill,
    backgroundColor: colors.fondo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activa: {
    backgroundColor: colors.primario,
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
