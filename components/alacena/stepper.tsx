import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icono from '../Icono';
import { colors, fuentes, radios, tamanos } from '../../theme/theme';

interface Props {
  texto: string;
  onMenos: () => void;
  onMas: () => void;
  menosDeshabilitado?: boolean;
  compacto?: boolean;
}

export function Stepper({ texto, onMenos, onMas, menosDeshabilitado, compacto }: Props) {
  const tamanoBoton = compacto ? 34 : 40;
  return (
    <View style={estilos.caja}>
      <Pressable
        onPress={onMenos}
        disabled={menosDeshabilitado}
        hitSlop={8}
        style={[estilos.boton, { width: tamanoBoton, height: tamanoBoton }, menosDeshabilitado && estilos.deshabilitado]}
        accessibilityLabel="Quitar"
      >
        <Icono nombre="minus-linear" size={18} color={colors.texto} />
      </Pressable>
      <Text style={estilos.texto} numberOfLines={1}>
        {texto}
      </Text>
      <Pressable
        onPress={onMas}
        hitSlop={8}
        style={[estilos.boton, { width: tamanoBoton, height: tamanoBoton }]}
        accessibilityLabel="Agregar"
      >
        <Icono nombre="add-linear" size={18} color={colors.texto} />
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  caja: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.fondo,
    borderRadius: radios.pill,
    padding: 4,
  },
  boton: {
    borderRadius: radios.pill,
    backgroundColor: colors.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deshabilitado: {
    opacity: 0.35,
  },
  texto: {
    minWidth: 72,
    textAlign: 'center',
    fontFamily: fuentes.negrita,
    fontSize: tamanos.cuerpo,
    color: colors.texto,
    paddingHorizontal: 6,
  },
});
