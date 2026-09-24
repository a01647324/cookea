import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, espaciado, radios } from '../theme/theme';
import { obtenerTipDelDia } from '../constants/tips';

export function TipBanner() {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.icono}>💡</Text>
      <Text style={estilos.texto} numberOfLines={2}>
        Tip saludable del día: {obtenerTipDelDia()}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.olivaOscuro,
    borderRadius: radios.md,
    marginHorizontal: espaciado.md,
    marginTop: espaciado.md,
    padding: espaciado.md,
  },
  icono: {
    fontSize: 18,
    marginRight: espaciado.sm,
  },
  texto: {
    flex: 1,
    color: colors.textoSobreColor,
    fontSize: 12,
  },
});