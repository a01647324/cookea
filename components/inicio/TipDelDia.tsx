import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icono from '../Icono';
import { obtenerTipDelDia } from '../../constants/tips';
import { colors, espaciado, fuentes, tamanos } from '../../theme/theme';

export function TipDelDia() {
  const [abierto, setAbierto] = useState(false);

  return (
    <Pressable
      onPress={() => setAbierto((v) => !v)}
      style={estilos.tarjeta}
      accessibilityRole="button"
      accessibilityState={{ expanded: abierto }}
    >
      <View style={estilos.circulo}>
        <Icono nombre="lightbulb-linear" size={20} color={colors.texto} />
      </View>
      <View style={estilos.cuerpo}>
        <Text style={estilos.titulo}>Tip del día</Text>
        <Text style={estilos.texto} numberOfLines={abierto ? undefined : 2}>
          {obtenerTipDelDia()}
        </Text>
      </View>
      <Icono
        nombre={abierto ? 'alt-arrow-up-linear' : 'alt-arrow-down-linear'}
        size={20}
        color={colors.acentoOscuro}
      />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espaciado.sm,
    backgroundColor: colors.sereno,
    borderRadius: 20,
    padding: espaciado.md,
    marginHorizontal: espaciado.md,
  },
  circulo: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.resaltado,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cuerpo: {
    flex: 1,
  },
  titulo: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.cuerpo,
    color: colors.texto,
  },
  texto: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.base,
    lineHeight: 21,
    color: colors.acentoOscuro,
    marginTop: 2,
  },
});
