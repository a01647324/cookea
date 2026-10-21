import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NOMBRE_CORTO_ETIQUETA_SALUD, NOMBRE_ETIQUETA_SALUD } from '../../constants/recomendador';
import { SaludResultado } from '../../lib/recomendador/tipos';
import { colors, fuentes, radios, tamanos } from '../../theme/theme';

type Etiqueta = SaludResultado['etiqueta'];

// Colores sacados de la paleta de Cookea. A propósito NO se usa rojo para "para de vez en cuando":
// no es una alerta, solo una guía de con qué frecuencia conviene comerlo.
const ESTILO: Record<Etiqueta, { fondo: string; texto: string; punto: string }> = {
  balanceada: { fondo: colors.acentoSuave, texto: colors.acentoOscuro, punto: colors.acento },
  aceptable: { fondo: colors.calidoSuave, texto: colors.calidoOscuro, punto: colors.calido },
  ocasional: { fondo: colors.serenoSuave, texto: colors.textoSuave, punto: colors.serenoIntenso },
};

interface Props {
  etiqueta: Etiqueta;
  tamano?: 'normal' | 'mini';
}

export function ChipSalud({ etiqueta, tamano = 'normal' }: Props) {
  const e = ESTILO[etiqueta];
  const nombre = NOMBRE_ETIQUETA_SALUD[etiqueta];
  const visible = tamano === 'mini' ? NOMBRE_CORTO_ETIQUETA_SALUD[etiqueta] : nombre;
  return (
    <View
      style={[estilos.chip, tamano === 'mini' && estilos.chipMini, { backgroundColor: e.fondo }]}
      accessible
      accessibilityLabel={`Salud: ${nombre}`}
    >
      <View style={[estilos.punto, { backgroundColor: e.punto }]} />
      <Text style={[estilos.texto, tamano === 'mini' && estilos.textoMini, { color: e.texto }]} numberOfLines={1}>
        {visible}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radios.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipMini: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 5,
  },
  punto: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  texto: {
    flexShrink: 1,
    fontFamily: fuentes.negrita,
    fontSize: tamanos.chico,
  },
  textoMini: {
    fontSize: tamanos.mini,
  },
});