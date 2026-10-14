import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Icono from '../Icono';
import { useFavoriteToggle } from '../../hooks/useFavoriteToggle';
import { Recomendacion } from '../../lib/recomendador/tipos';
import { colors, espaciado, fuentes, radios, sombra, tamanos } from '../../theme/theme';

interface Props {
  recomendacion: Recomendacion;
  colorFondo?: string;
  onPress: () => void;
  variante?: 'lista' | 'carrusel';
}

type Insignia = { texto: string; punto: string; fondo: string; color: string };

function calcularInsignia(recomendacion: Recomendacion): Insignia | null {
  const { cobertura } = recomendacion;
  if (cobertura.total === 0) return null;
  const faltan = cobertura.faltantes.length + cobertura.insuficientes.length;
  if (faltan === 0) {
    return { texto: 'Puedes cocinarla', punto: colors.acento, fondo: colors.acentoSuave, color: colors.acentoIntenso };
  }
  return {
    texto: faltan === 1 ? 'Te falta 1' : `Te faltan ${faltan}`,
    punto: faltan === 1 ? colors.resaltado : colors.calido,
    fondo: colors.calidoSuave,
    color: colors.calidoIntenso,
  };
}

export function TarjetaRecomendada({ recomendacion, colorFondo, onPress, variante = 'lista' }: Props) {
  const { receta, motivos } = recomendacion;
  const { esFavorita, alternar } = useFavoriteToggle(receta.id);
  const insignia = calcularInsignia(recomendacion);
  const motivo = motivos[0];
  const etiquetaAccesible = `${receta.nombre}. ${insignia?.texto ?? ''}. ${motivo ?? ''}`;

  const estrella = (
    <Pressable
      onPress={alternar}
      hitSlop={8}
      style={variante === 'carrusel' ? estilos.estrellaVidrio : estilos.estrellaClara}
      accessibilityLabel={esFavorita ? 'Quitar de favoritos' : 'Guardar en favoritos'}
    >
      <Icono
        nombre={esFavorita ? 'star-bold' : 'star-linear'}
        size={18}
        color={esFavorita ? colors.calificacion : variante === 'carrusel' ? colors.superficie : colors.textoSuave}
      />
    </Pressable>
  );

  if (variante === 'carrusel') {
    return (
      <Pressable onPress={onPress} style={estilos.carrusel} accessibilityRole="button" accessibilityLabel={etiquetaAccesible}>
        {receta.foto_url ? (
          <Image source={{ uri: receta.foto_url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <View style={[StyleSheet.absoluteFill, estilos.sinFoto, colorFondo ? { backgroundColor: colorFondo } : null]}>
            <Icono nombre="chef-hat-linear" size={40} color={colors.superficie} />
          </View>
        )}

        <LinearGradient colors={['transparent', 'rgba(38, 49, 51, 0.92)']} style={estilos.degradado} />

        {insignia && (
          <View style={estilos.insigniaVidrio}>
            <View style={[estilos.punto, { backgroundColor: insignia.punto }]} />
            <Text style={estilos.textoInsigniaVidrio} numberOfLines={1}>
              {insignia.texto}
            </Text>
          </View>
        )}

        {estrella}

        <View style={estilos.pie}>
          <Text style={estilos.nombreCarrusel} numberOfLines={2}>
            {receta.nombre}
          </Text>
          <View style={estilos.meta}>
            <Icono nombre="clock-circle-linear" size={14} color={colors.superficieCalida} />
            <Text style={estilos.textoMetaCarrusel}>{receta.tiempo_min} min</Text>
          </View>
          {motivo ? (
            <Text style={estilos.motivoCarrusel} numberOfLines={2}>
              {motivo}
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={estilos.lista} accessibilityRole="button" accessibilityLabel={etiquetaAccesible}>
      {receta.foto_url ? (
        <Image source={{ uri: receta.foto_url }} style={estilos.fotoLista} contentFit="cover" transition={200} />
      ) : (
        <View style={[estilos.fotoLista, estilos.sinFotoLista]}>
          <Icono nombre="chef-hat-linear" size={30} color={colors.textoSuave} />
        </View>
      )}

      <View style={estilos.cuerpoLista}>
        <View style={estilos.filaNombre}>
          <Text style={estilos.nombreLista} numberOfLines={2}>
            {receta.nombre}
          </Text>
          {estrella}
        </View>
        <View style={estilos.meta}>
          <Icono nombre="clock-circle-linear" size={14} color={colors.textoSuave} />
          <Text style={estilos.textoMetaLista}>{receta.tiempo_min} min</Text>
        </View>
        {insignia && (
          <View style={[estilos.insigniaClara, { backgroundColor: insignia.fondo }]}>
            <Text style={[estilos.textoInsigniaClara, { color: insignia.color }]} numberOfLines={1}>
              {insignia.texto}
            </Text>
          </View>
        )}
        {motivo ? (
          <Text style={estilos.motivoLista} numberOfLines={2}>
            {motivo}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  carrusel: {
    width: 180,
    height: 245,
    borderRadius: radios.lg,
    overflow: 'hidden',
    backgroundColor: colors.sereno,
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
    height: '70%',
  },
  insigniaVidrio: {
    position: 'absolute',
    top: espaciado.sm,
    left: espaciado.sm,
    maxWidth: 125,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.vidrio,
    borderWidth: 1,
    borderColor: colors.vidrioBorde,
    borderRadius: radios.pill,
    paddingHorizontal: espaciado.sm,
    paddingVertical: 4,
  },
  punto: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  textoInsigniaVidrio: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.mini,
    color: colors.superficie,
  },
  estrellaVidrio: {
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
  nombreCarrusel: {
    fontFamily: fuentes.titulo,
    fontSize: tamanos.grande,
    lineHeight: 22,
    color: colors.superficie,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  textoMetaCarrusel: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.mini,
    color: colors.superficieCalida,
  },
  motivoCarrusel: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.mini,
    lineHeight: 16,
    color: colors.sereno,
    marginTop: 4,
  },

  lista: {
    flexDirection: 'row',
    gap: espaciado.sm,
    backgroundColor: colors.superficie,
    borderRadius: radios.lg,
    padding: espaciado.sm,
    marginBottom: espaciado.md,
    ...sombra,
  },
  fotoLista: {
    width: 96,
    height: 96,
    borderRadius: radios.md,
  },
  sinFotoLista: {
    backgroundColor: colors.superficieCalida,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cuerpoLista: {
    flex: 1,
  },
  filaNombre: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espaciado.xs,
  },
  nombreLista: {
    flex: 1,
    fontFamily: fuentes.titulo,
    fontSize: tamanos.grande,
    lineHeight: 22,
    color: colors.texto,
  },
  estrellaClara: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.fondo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoMetaLista: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.mini,
    color: colors.textoSuave,
  },
  insigniaClara: {
    alignSelf: 'flex-start',
    borderRadius: radios.pill,
    paddingHorizontal: espaciado.sm,
    paddingVertical: 3,
    marginTop: 6,
  },
  textoInsigniaClara: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.mini,
  },
  motivoLista: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.chico,
    lineHeight: 18,
    color: colors.textoSuave,
    marginTop: 4,
  },
});