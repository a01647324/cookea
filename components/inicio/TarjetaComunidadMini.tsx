import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Icono from '../Icono';
import { RecetaComunidad } from '../../types/database';
import { colors, espaciado, fuentes, radios, sombra, tamanos } from '../../theme/theme';

interface Props {
  receta: RecetaComunidad;
  onPress: () => void;
}

export function TarjetaComunidadMini({ receta, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={estilos.tarjeta} accessibilityRole="button" accessibilityLabel={receta.nombre}>
      {receta.foto_url ? (
        <Image source={{ uri: receta.foto_url }} style={estilos.foto} contentFit="cover" transition={200} />
      ) : (
        <View style={[estilos.foto, estilos.sinFoto]}>
          <Icono nombre="chef-hat-linear" size={28} color={colors.textoSuave} />
        </View>
      )}
      <Text style={estilos.nombre} numberOfLines={2}>
        {receta.nombre}
      </Text>
      <Text style={estilos.autor} numberOfLines={1}>
        por {receta.autor_alias}
      </Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    width: 180,
    backgroundColor: colors.superficie,
    borderRadius: 20,
    padding: 10,
    ...sombra,
  },
  foto: {
    width: '100%',
    height: 125,
    borderRadius: radios.md,
  },
  sinFoto: {
    backgroundColor: colors.superficieCalida,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nombre: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.cuerpo,
    lineHeight: 21,
    color: colors.texto,
    marginTop: espaciado.sm,
    minHeight: 42,
  },
  autor: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.mini,
    color: colors.textoSuave,
    marginTop: 2,
    marginBottom: 4,
  },
});
