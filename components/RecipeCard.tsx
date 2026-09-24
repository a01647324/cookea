import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, espaciado, radios } from '../theme/theme';
import { RecetaResumen } from '../types/database';

interface Props {
  receta: RecetaResumen;
  colorFondo: string; 
  onPress: () => void;
  variante?: 'lista' | 'carrusel';
}

export function RecipeCard({ receta, colorFondo, onPress, variante = 'lista' }: Props) {
  const esCarrusel = variante === 'carrusel';

  return (
    <Pressable
      onPress={onPress}
      style={[
        estilos.base,
        { backgroundColor: colorFondo },
        esCarrusel ? estilos.carrusel : estilos.lista,
      ]}
    >
      {receta.foto_url ? (
        <Image
          source={{ uri: receta.foto_url }}
          style={esCarrusel ? estilos.imagenCarrusel : estilos.imagenLista}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            esCarrusel ? estilos.imagenCarrusel : estilos.imagenLista,
            estilos.imagenRespaldo,
          ]}
        />
      )}

      <View style={estilos.textoContenedor}>
        <Text style={estilos.nombre} numberOfLines={2}>
          {receta.nombre.toUpperCase()}
        </Text>
        <Text style={estilos.tiempo}>⏱ {receta.tiempo_min} min</Text>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    borderRadius: radios.lg,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  lista: {
    width: '100%',
    height: 110,
    marginBottom: espaciado.md,
    padding: espaciado.md,
  },
  carrusel: {
    width: 170,
    height: 140,
    marginRight: espaciado.md,
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: 0,
  },
  imagenLista: {
    width: 84,
    height: 84,
    borderRadius: radios.md,
  },
  imagenCarrusel: {
    width: '100%',
    height: 90,
  },
  imagenRespaldo: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  textoContenedor: {
    flex: 1,
    paddingHorizontal: espaciado.md,
    paddingVertical: espaciado.sm,
  },
  nombre: {
    color: colors.textoSobreColor,
    fontWeight: '700',
    fontSize: 15,
  },
  tiempo: {
    color: colors.textoSobreColor,
    marginTop: espaciado.xs,
    fontSize: 12,
  },
});