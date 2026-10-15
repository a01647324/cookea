import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Icono from '../Icono';
import { RecetaResumen } from '../../types/database';
import { colors, espaciado, fuentes, radios, tamanos } from '../../theme/theme';

const FONDOS = [
  'rgba(222, 137, 72, 0.22)',
  'rgba(187, 171, 71, 0.25)',
  'rgba(224, 121, 112, 0.2)',
  'rgba(205, 215, 216, 0.7)',
  'rgba(249, 213, 141, 0.45)',
];
const CIRCULOS = [colors.calido, colors.encabezado, colors.destacado, colors.serenoIntenso, colors.resaltado];

interface Props {
  receta: RecetaResumen;
  indice: number;
  detalle?: string;
  onAbrir: () => void;
  onQuitar?: () => void;
}

export function TarjetaAlbumReceta({ receta, indice, detalle, onAbrir, onQuitar }: Props) {
  const i = indice % FONDOS.length;

  return (
    <Pressable
      onPress={onAbrir}
      style={[estilos.tarjeta, { backgroundColor: FONDOS[i] }]}
      accessibilityRole="button"
      accessibilityLabel={receta.nombre}
    >
      <View style={estilos.cuerpo}>
        <Text style={estilos.nombre} numberOfLines={2}>
          {receta.nombre}
        </Text>
        <View style={estilos.meta}>
          <Icono nombre="clock-circle-linear" size={14} color={colors.textoSuave} />
          <Text style={estilos.textoMeta} numberOfLines={1}>
            {receta.tiempo_min} min{detalle ? ` · ${detalle}` : ''}
          </Text>
        </View>
        {onQuitar && (
          <Pressable onPress={onQuitar} hitSlop={8} style={estilos.quitar} accessibilityLabel={`Quitar ${receta.nombre}`}>
            <Icono nombre="trash-bin-trash-linear" size={14} color={colors.destacadoOscuro} />
            <Text style={estilos.textoQuitar}>Quitar</Text>
          </Pressable>
        )}
      </View>

      <View style={[estilos.circulo, { backgroundColor: CIRCULOS[i] }]}>
        {receta.foto_url ? (
          <Image source={{ uri: receta.foto_url }} style={estilos.foto} contentFit="cover" transition={150} />
        ) : (
          <Icono nombre="chef-hat-linear" size={30} color={colors.superficie} />
        )}
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    minHeight: 96,
    borderRadius: 22,
    marginHorizontal: espaciado.md,
    marginBottom: espaciado.md,
    paddingVertical: espaciado.md,
    paddingLeft: espaciado.md,
    paddingRight: 112,
    justifyContent: 'center',
  },
  cuerpo: {
    gap: 4,
  },
  nombre: {
    fontFamily: fuentes.titulo,
    fontSize: tamanos.grande,
    lineHeight: 23,
    color: colors.texto,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  textoMeta: {
    flexShrink: 1,
    fontFamily: fuentes.semibold,
    fontSize: tamanos.chico,
    color: colors.textoSuave,
  },
  quitar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: espaciado.sm,
    borderRadius: radios.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  textoQuitar: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.mini,
    color: colors.destacadoOscuro,
  },
  circulo: {
    position: 'absolute',
    right: -8,
    top: -8,
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 4,
    borderColor: colors.fondo,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  foto: {
    width: '100%',
    height: '100%',
  },
});
