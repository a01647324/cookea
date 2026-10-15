import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Icono from '../Icono';
import { AccionMascota, IMAGENES_MASCOTA, TEXTO_ACCION } from '../../constants/mascota';
import { colors, fuentes, tamanos } from '../../theme/theme';

// Color de fondo de la pantalla y color de acento para cada acción
export const COLORES_ACCION: Record<AccionMascota, { fondo: string; acento: string }> = {
  cortar: { fondo: colors.resaltadoSuave, acento: colors.calidoIntenso },
  mezclar: { fondo: colors.calidoSuave, acento: colors.calidoIntenso },
  hervir: { fondo: colors.serenoSuave, acento: colors.serenoIntenso },
  sarten: { fondo: colors.calidoSuave, acento: colors.calidoIntenso },
  horno: { fondo: colors.destacadoSuave, acento: colors.destacadoIntenso },
  licuar: { fondo: colors.destacadoSuave, acento: colors.destacadoIntenso },
  esperar: { fondo: colors.serenoSuave, acento: colors.serenoIntenso },
  celebrar: { fondo: colors.resaltadoSuave, acento: colors.calidoIntenso },
  pensar: { fondo: colors.acentoSuave, acento: colors.acentoIntenso },
  preparar: { fondo: colors.resaltadoSuave, acento: colors.calidoIntenso },
  escribir: { fondo: colors.resaltadoSuave, acento: colors.calidoIntenso },
  foto: { fondo: colors.calidoSuave, acento: colors.calidoIntenso },
  lista: { fondo: colors.acentoSuave, acento: colors.acentoIntenso },
  explicar: { fondo: colors.serenoSuave, acento: colors.serenoIntenso },
  revisar: { fondo: colors.destacadoSuave, acento: colors.destacadoIntenso },
  publicar: { fondo: colors.resaltadoSuave, acento: colors.calidoIntenso },
  preocupado: { fondo: colors.destacadoSuave, acento: colors.destacadoIntenso },
  asomarse: { fondo: colors.destacadoSuave, acento: colors.destacadoIntenso },
};

interface Props {
  accion: AccionMascota;
  tamano: number;
}

export function Mascota({ accion, tamano }: Props) {
  const imagen = IMAGENES_MASCOTA[accion];

  if (imagen) {
    return (
      <Image
        source={imagen}
        style={{ width: tamano, height: tamano }}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        accessible={false}
      />
    );
  }

  return (
    <View
      style={[estilos.circulo, { width: tamano, height: tamano, borderRadius: tamano / 2 }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Icono nombre="chef-hat-linear" size={tamano * 0.28} color={COLORES_ACCION[accion].acento} />
      {tamano >= 120 && <Text style={estilos.texto}>{TEXTO_ACCION[accion]}</Text>}
    </View>
  );
}

const estilos = StyleSheet.create({
  circulo: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  texto: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.chico,
    color: colors.textoSuave,
    marginTop: 4,
  },
});
