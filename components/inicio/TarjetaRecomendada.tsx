import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Icono from '../Icono';
import { useFavoriteToggle } from '../../hooks/useFavoriteToggle';
import { RecetaDestacada } from '../../hooks/useFeaturedRecipes';
import { colors, espaciado, fuentes, radios, tamanos } from '../../theme/theme';

interface Props {
  receta: RecetaDestacada;
  onPress: () => void;
}

export function TarjetaRecomendada({ receta, onPress }: Props) {
  const { esFavorita, alternar } = useFavoriteToggle(receta.id);

  return (
    <Pressable onPress={onPress} style={estilos.tarjeta} accessibilityRole="button" accessibilityLabel={receta.nombre}>
      {receta.foto_url ? (
        <Image source={{ uri: receta.foto_url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      ) : (
        <View style={[StyleSheet.absoluteFill, estilos.sinFoto]}>
          <Icono nombre="chef-hat-linear" size={40} color={colors.superficieCalida} />
        </View>
      )}

      <LinearGradient
        colors={['transparent', 'rgba(38, 49, 51, 0.9)']}
        style={estilos.degradado}
      />

      {receta.etiqueta && (
        <View style={estilos.etiqueta}>
          <Text style={estilos.textoEtiqueta} numberOfLines={1}>
            {receta.etiqueta}
          </Text>
        </View>
      )}

      <Pressable
        onPress={alternar}
        hitSlop={8}
        style={estilos.estrella}
        accessibilityLabel={esFavorita ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      >
        <Icono
          nombre={esFavorita ? 'star-bold' : 'star-linear'}
          size={18}
          color={esFavorita ? colors.calificacion : colors.superficie}
        />
      </Pressable>

      <View style={estilos.pie}>
        <Text style={estilos.nombre} numberOfLines={2}>
          {receta.nombre}
        </Text>
        <Text style={estilos.meta}>
          {receta.tiempo_min} min · {receta.ingredientes} ingredientes
        </Text>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    width: 165,
    height: 220,
    borderRadius: radios.lg,
    overflow: 'hidden',
    backgroundColor: colors.neutro,
    justifyContent: 'flex-end',
  },
  sinFoto: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.textoSuave,
  },
  degradado: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '65%',
  },
  etiqueta: {
    position: 'absolute',
    top: espaciado.sm,
    left: espaciado.sm,
    maxWidth: 105,
    backgroundColor: colors.vidrio,
    borderWidth: 1,
    borderColor: colors.vidrioBorde,
    borderRadius: radios.pill,
    paddingHorizontal: espaciado.sm,
    paddingVertical: 3,
  },
  textoEtiqueta: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.mini,
    color: colors.superficie,
  },
  estrella: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.vidrio,
    borderWidth: 1,
    borderColor: colors.vidrioBorde,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pie: {
    padding: espaciado.sm,
    paddingBottom: espaciado.md,
  },
  nombre: {
    fontFamily: fuentes.titulo,
    fontSize: tamanos.grande,
    lineHeight: 22,
    color: colors.superficie,
  },
  meta: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.mini,
    color: colors.superficieCalida,
    marginTop: 4,
  },
});
