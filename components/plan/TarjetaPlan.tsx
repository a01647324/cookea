import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Icono from '../Icono';
import { PlanSemanalItem } from '../../types/database';
import { colors, espaciado, fuentes, radios, tamanos } from '../../theme/theme';

interface Props {
  item: PlanSemanalItem;
  compacta?: boolean;
  cocinada?: boolean;
  onAbrir: () => void;
  onOpciones: () => void;
}

export function TarjetaPlan({ item, compacta = false, cocinada = false, onAbrir, onOpciones }: Props) {
  const receta = item.recetas;

  if (compacta) {
    return (
      <Pressable onPress={onAbrir} style={estilos.compacta} accessibilityRole="button" accessibilityLabel={receta.nombre}>
        {receta.foto_url ? (
          <Image source={{ uri: receta.foto_url }} style={estilos.miniatura} contentFit="cover" />
        ) : (
          <View style={[estilos.miniatura, estilos.sinFotoCompacta]}>
            <Icono nombre="chef-hat-linear" size={20} color={colors.textoSuave} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={estilos.nombreCompacto} numberOfLines={2}>
            {receta.nombre}
          </Text>
          <Text style={estilos.metaCompacta}>{receta.tiempo_min} min</Text>
        </View>
        <Pressable onPress={onOpciones} hitSlop={10} style={estilos.botonOpcionesClaro} accessibilityLabel="Opciones">
          <Icono nombre="menu-dots-linear" size={20} color={colors.textoSuave} />
        </Pressable>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onAbrir} style={estilos.tarjeta} accessibilityRole="button" accessibilityLabel={receta.nombre}>
      {receta.foto_url ? (
        <Image source={{ uri: receta.foto_url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      ) : (
        <View style={[StyleSheet.absoluteFill, estilos.sinFoto]}>
          <Icono nombre="chef-hat-linear" size={38} color={colors.superficie} />
        </View>
      )}
      <LinearGradient colors={['transparent', 'rgba(38, 49, 51, 0.88)']} style={estilos.degradado} />

      {cocinada && (
        <View style={estilos.cocinada}>
          <Icono nombre="check-linear" size={14} color={colors.texto} />
          <Text style={estilos.textoCocinada}>Ya la cocinaste</Text>
        </View>
      )}
      <Pressable onPress={onOpciones} hitSlop={8} style={estilos.botonOpciones} accessibilityLabel="Opciones">
        <Icono nombre="menu-dots-linear" size={20} color={colors.superficie} />
      </Pressable>

      <View style={estilos.pie}>
        <Text style={estilos.nombre} numberOfLines={2}>
          {receta.nombre}
        </Text>
        <View style={estilos.meta}>
          <Icono nombre="clock-circle-linear" size={14} color={colors.sereno} />
          <Text style={estilos.textoMeta}>{receta.tiempo_min} min</Text>
        </View>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    height: 160,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.sereno,
    justifyContent: 'flex-end',
  },
  sinFoto: {
    backgroundColor: colors.encabezado,
    alignItems: 'center',
    justifyContent: 'center',
  },
  degradado: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '65%',
  },
  cocinada: {
    position: 'absolute',
    top: espaciado.sm,
    left: espaciado.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.acento,
    borderRadius: radios.pill,
    paddingHorizontal: espaciado.sm,
    paddingVertical: 4,
  },
  textoCocinada: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.mini,
    color: colors.texto,
  },
  botonOpciones: {
    position: 'absolute',
    top: espaciado.sm,
    right: espaciado.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.vidrio,
    borderWidth: 1,
    borderColor: colors.vidrioBorde,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pie: {
    padding: espaciado.sm,
    paddingHorizontal: espaciado.md,
  },
  nombre: {
    fontFamily: fuentes.titulo,
    fontSize: tamanos.grande,
    lineHeight: 23,
    color: colors.superficie,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  textoMeta: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.chico,
    color: colors.sereno,
  },
  compacta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
    backgroundColor: colors.superficie,
    borderRadius: 18,
    padding: espaciado.sm,
  },
  miniatura: {
    width: 52,
    height: 52,
    borderRadius: radios.md,
  },
  sinFotoCompacta: {
    backgroundColor: colors.superficieCalida,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nombreCompacto: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.cuerpo,
    lineHeight: 20,
    color: colors.texto,
  },
  metaCompacta: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.chico,
    color: colors.textoSuave,
    marginTop: 2,
  },
  botonOpcionesClaro: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
