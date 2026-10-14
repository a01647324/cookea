import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, espaciado, radios } from '../../theme/theme';
import { Recomendacion } from '../../lib/recomendador/tipos';

interface Props {
  recomendacion: Recomendacion;
  colorFondo: string;
  onPress: () => void;

  variante?: 'lista' | 'carrusel';
}

export function TarjetaRecomendada({ recomendacion, colorFondo, onPress, variante = 'lista' }: Props) {
  const { receta, cobertura, motivos } = recomendacion;
  const esCarrusel = variante === 'carrusel';

  const faltan = cobertura.faltantes.length + cobertura.insuficientes.length;
  let insignia: { texto: string; color: string } | null = null;
  if (cobertura.total > 0) {
    if (faltan === 0) insignia = { texto: '✓ Puedes cocinarla', color: colors.exito };
    else if (faltan === 1) insignia = { texto: 'Te falta 1', color: colors.advertencia };
    else insignia = { texto: `Te faltan ${faltan}`, color: colors.terracota };
  }

  const motivo = motivos[0];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${receta.nombre}. ${insignia?.texto ?? ''}. ${motivo ?? ''}`}
      style={[estilos.base, { backgroundColor: colorFondo }, esCarrusel ? estilos.carrusel : estilos.lista]}
    >
      {receta.foto_url ? (
        <Image
          source={{ uri: receta.foto_url }}
          style={esCarrusel ? estilos.imagenCarrusel : estilos.imagenLista}
          resizeMode="cover"
        />
      ) : (
        <View style={[esCarrusel ? estilos.imagenCarrusel : estilos.imagenLista, estilos.imagenRespaldo]} />
      )}

      <View style={estilos.textoContenedor}>
        <Text style={estilos.nombre} numberOfLines={2}>
          {receta.nombre.toUpperCase()}
        </Text>
        <Text style={estilos.tiempo}>⏱ {receta.tiempo_min} min</Text>

        {insignia && (
          <View style={[estilos.insignia, { backgroundColor: colors.surface }]}>
            <Text style={[estilos.insigniaTexto, { color: insignia.color }]} numberOfLines={1}>
              {insignia.texto}
            </Text>
          </View>
        )}

        {motivo ? (
          <Text style={estilos.motivo} numberOfLines={esCarrusel ? 2 : 3}>
            {motivo}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    borderRadius: radios.lg,
    overflow: 'hidden',
  },
  lista: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: espaciado.md,
    padding: espaciado.md,
  },
  carrusel: {
    width: 190,
    marginRight: espaciado.md,
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
  insignia: {
    alignSelf: 'flex-start',
    borderRadius: radios.pill,
    paddingHorizontal: espaciado.sm,
    paddingVertical: 3,
    marginTop: espaciado.sm,
  },
  insigniaTexto: {
    fontSize: 11,
    fontWeight: '700',
  },
  motivo: {
    color: colors.textoSobreColor,
    fontSize: 12,
    marginTop: espaciado.xs,
  },
});