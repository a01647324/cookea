import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Icono, { NombreIcono } from '../Icono';
import { colors, espaciado, fuentes, tamanos } from '../../theme/theme';

interface Props {
  nombre: string;
  cantidad: number;
  fotos: (string | null)[];
  icono: NombreIcono;
  fondo: string;
  color: string;
  alto: number;
  onPress: () => void;
}

function Foto({ uri, estilo }: { uri: string | null; estilo: object }) {
  if (!uri) return <View style={[estilo, estilos.hueco]} />;
  return <Image source={{ uri }} style={estilo} contentFit="cover" transition={150} />;
}

export function CollageAlbum({ nombre, cantidad, fotos, icono, fondo, color, alto, onPress }: Props) {
  const conFoto = fotos.filter(Boolean) as string[];

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${nombre}, ${cantidad} recetas`}>
      <View style={[estilos.marco, { height: alto }]}>
        {conFoto.length === 0 ? (
          <View style={[estilos.vacio, { backgroundColor: fondo }]}>
            <Icono nombre={icono} size={alto > 110 ? 40 : 30} color={color} />
          </View>
        ) : conFoto.length < 3 ? (
          <Foto uri={conFoto[0]} estilo={estilos.completa} />
        ) : (
          <View style={estilos.cuadricula}>
            <Foto uri={conFoto[0]} estilo={estilos.grande} />
            <View style={estilos.columna}>
              <Foto uri={conFoto[1]} estilo={estilos.chica} />
              <Foto uri={conFoto[2]} estilo={estilos.chica} />
            </View>
          </View>
        )}
        <View style={estilos.insignia}>
          <Icono nombre={icono} size={16} color={colors.superficie} />
        </View>
      </View>
      <Text style={estilos.nombre} numberOfLines={1}>
        {nombre}
      </Text>
      <Text style={estilos.cantidad}>
        {cantidad} {cantidad === 1 ? 'receta' : 'recetas'}
      </Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  marco: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.superficie,
  },
  vacio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completa: {
    flex: 1,
  },
  cuadricula: {
    flex: 1,
    flexDirection: 'row',
    gap: 3,
  },
  grande: {
    flex: 2,
  },
  columna: {
    flex: 1,
    gap: 3,
  },
  chica: {
    flex: 1,
  },
  hueco: {
    backgroundColor: colors.fondoHundido,
  },
  insignia: {
    position: 'absolute',
    top: espaciado.sm,
    left: espaciado.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.vidrio,
    borderWidth: 1,
    borderColor: colors.vidrioBorde,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nombre: {
    fontFamily: fuentes.titulo,
    fontSize: tamanos.grande,
    lineHeight: 23,
    color: colors.texto,
    marginTop: espaciado.sm,
  },
  cantidad: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.chico,
    color: colors.textoSuave,
    marginTop: 1,
  },
});
