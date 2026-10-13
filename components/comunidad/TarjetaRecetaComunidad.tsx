import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, espaciado, fuentes, radios, sombra, tipografia } from '../../theme/theme';
import { RecetaComunidad } from '../../types/database';

interface Props {
  receta: RecetaComunidad;
  onPress: () => void;
  onGuardar: () => void;
  guardada?: boolean;
}

export function TarjetaRecetaComunidad({ receta, onPress, onGuardar, guardada = false }: Props) {
  const iniciales = receta.autor_alias.slice(0, 2).toUpperCase();
  const esNueva = receta.total === 0;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [estilos.tarjeta, pressed && estilos.presionada]}>
      <View>
        {receta.foto_url ? (
          <Image
            source={{ uri: receta.foto_url }}
            style={estilos.foto}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[estilos.foto, estilos.fotoRespaldo]}>
            <Ionicons name="restaurant-outline" size={36} color={colors.superficieCalida} />
          </View>
        )}

        <Pressable
          onPress={onGuardar}
          hitSlop={10}
          style={[estilos.botonGuardar, guardada && estilos.botonGuardado]}
          accessibilityLabel="Guardar receta"
        >
          <Ionicons
            name={guardada ? 'star' : 'star-outline'}
            size={18}
            color={guardada ? colors.calificacion : colors.primario}
          />
        </Pressable>

        {receta.etiqueta && (
          <View style={estilos.etiqueta}>
            <Text style={estilos.textoEtiqueta}>{receta.etiqueta}</Text>
          </View>
        )}
      </View>

      <View style={estilos.cuerpo}>
        <Text style={tipografia.nombreReceta} numberOfLines={2}>
          {receta.nombre.toUpperCase()}
        </Text>

        <View style={estilos.filaInferior}>
          <View style={estilos.autor}>
            <View style={estilos.avatar}>
              <Text style={estilos.iniciales}>{iniciales}</Text>
            </View>
            <Text style={tipografia.chico} numberOfLines={1}>
              {receta.autor_alias}
            </Text>
          </View>

          <View style={estilos.datos}>
            {esNueva ? (
              <View style={estilos.nueva}>
                <Text style={estilos.textoNueva}>Nueva</Text>
              </View>
            ) : (
              <>
                <Ionicons name="star" size={13} color={colors.calido} />
                <Text style={tipografia.chico}>
                  {receta.promedio} ({receta.total})
                </Text>
              </>
            )}
            <Text style={tipografia.chico}>·</Text>
            <Ionicons name="time-outline" size={13} color={colors.textoSuave} />
            <Text style={tipografia.chico}>{receta.tiempo_min} min</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    backgroundColor: colors.superficie,
    borderRadius: radios.lg,
    overflow: 'hidden',
    marginBottom: espaciado.md,
    ...sombra,
  },
  presionada: {
    opacity: 0.9,
  },
  foto: {
    width: '100%',
    height: 170,
  },
  fotoRespaldo: {
    backgroundColor: colors.neutro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonGuardar: {
    position: 'absolute',
    top: espaciado.sm + 2,
    right: espaciado.sm + 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.fondo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonGuardado: {
    backgroundColor: colors.primario,
  },
  etiqueta: {
    position: 'absolute',
    bottom: espaciado.sm + 2,
    left: espaciado.sm + 2,
    backgroundColor: colors.calido,
    borderRadius: radios.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  textoEtiqueta: {
    fontFamily: fuentes.semibold,
    fontSize: 12,
    letterSpacing: 0.3,
    color: colors.texto,
  },
  cuerpo: {
    paddingHorizontal: espaciado.md,
    paddingTop: 12,
    paddingBottom: espaciado.md,
  },
  filaInferior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: espaciado.sm + 2,
  },
  autor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
    flexShrink: 1,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.acento,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iniciales: {
    fontFamily: fuentes.negrita,
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.sobreAcento,
  },
  datos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nueva: {
    backgroundColor: colors.calificacion,
    borderRadius: radios.pill,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  textoNueva: {
    fontFamily: fuentes.semibold,
    fontSize: 11,
    letterSpacing: 0.3,
    color: colors.texto,
  },
});