import React from 'react';
import { Image, ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';
import Icono, { NombreIcono } from './Icono';
import { colors, espaciado, fuentes, radios, tamanos } from '../theme/theme';

interface Props {
  imagen?: ImageSourcePropType;
  icono?: NombreIcono;
  titulo: string;
  texto?: string;
  accion?: { texto: string; onPress: () => void };
  compacto?: boolean;
}

export function EstadoVacio({ imagen, icono = 'chef-hat-linear', titulo, texto, accion, compacto = false }: Props) {
  return (
    <View style={[estilos.contenedor, compacto && estilos.compacto]}>
      {imagen ? (
        <Image
          source={imagen}
          style={compacto ? estilos.imagenCompacta : estilos.imagen}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={estilos.circulo}>
          <Icono nombre={icono} size={34} color={colors.calidoIntenso} />
        </View>
      )}
      <Text style={estilos.titulo}>{titulo}</Text>
      {!!texto && <Text style={estilos.texto}>{texto}</Text>}
      {accion && (
        <Pressable onPress={accion.onPress} style={estilos.boton}>
          <Text style={estilos.textoBoton}>{accion.texto}</Text>
        </Pressable>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    paddingHorizontal: espaciado.lg,
    paddingVertical: espaciado.md,
  },
  compacto: {
    paddingVertical: espaciado.sm,
  },
  imagen: {
    width: 230,
    height: 170,
  },
  imagenCompacta: {
    width: 160,
    height: 115,
  },
  circulo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.calidoSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontFamily: fuentes.titulo,
    fontSize: 20,
    lineHeight: 27,
    color: colors.texto,
    textAlign: 'center',
    marginTop: espaciado.md,
  },
  texto: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.cuerpo,
    lineHeight: 22,
    color: colors.textoSuave,
    textAlign: 'center',
    marginTop: espaciado.xs,
    maxWidth: 300,
  },
  boton: {
    minHeight: 50,
    paddingHorizontal: espaciado.lg,
    borderRadius: radios.pill,
    backgroundColor: colors.encabezado,
    justifyContent: 'center',
    marginTop: espaciado.md,
  },
  textoBoton: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.cuerpo,
    color: colors.sobreEncabezado,
  },
});
