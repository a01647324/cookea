import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Icono from '../Icono';
import { colors, espaciado, fuentes, radios, sombra, tipografia, tamanos } from '../../theme/theme';
import { RecetaFeed } from '../../hooks/useComunidad';
import { useFavoriteToggle } from '../../hooks/useFavoriteToggle';

interface Props {
  receta: RecetaFeed;
  onPress: () => void;
  onColeccion?: () => void;
}

// Estrella: guarda o quita de Favoritos. Mantener presionada: elegir otro álbum.
export function TarjetaRecetaComunidad({ receta, onPress, onColeccion }: Props) {
  const { esFavorita: guardada, alternar } = useFavoriteToggle(receta.id);
  const iniciales = receta.autor_alias.slice(0, 2).toUpperCase();
  const esNueva = receta.total === 0;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onColeccion}
      delayLongPress={350}
      style={({ pressed }) => [estilos.tarjeta, pressed && estilos.presionada]}
      accessibilityRole="button"
      accessibilityLabel={receta.nombre}
      accessibilityHint={onColeccion ? 'Mantén presionado para guardar en un álbum' : undefined}
    >
      <View>
        {receta.foto_url ? (
          <Image source={{ uri: receta.foto_url }} style={estilos.foto} resizeMode="cover" />
        ) : (
          <View style={[estilos.foto, estilos.fotoRespaldo]}>
            <Icono nombre="chef-hat-linear" size={38} color={colors.superficie} />
          </View>
        )}

        <Pressable
          onPress={alternar}
          onLongPress={onColeccion}
          hitSlop={10}
          style={[estilos.botonGuardar, guardada && estilos.botonGuardado]}
          accessibilityRole="button"
          accessibilityLabel={guardada ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        >
          <Icono
            nombre={guardada ? 'star-bold' : 'star-linear'}
            size={19}
            color={guardada ? colors.calificacion : colors.primario}
          />
        </Pressable>

        <View style={estilos.filaEtiquetas}>
          {esNueva && (
            <View style={[estilos.etiqueta, estilos.etiquetaNueva]}>
              <View style={estilos.puntoNueva} />
              <Text style={estilos.textoEtiqueta}>Nueva</Text>
            </View>
          )}
          {!!receta.etiqueta && (
            <View style={estilos.etiqueta}>
              <Text style={estilos.textoEtiqueta}>{receta.etiqueta}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={estilos.cuerpo}>
        <Text style={tipografia.nombreReceta} numberOfLines={2}>
          {receta.nombre.toUpperCase()}
        </Text>

        {!!receta.motivo && (
          <View style={estilos.motivo}>
            <Icono nombre="lightbulb-linear" size={16} color={colors.calidoIntenso} />
            <Text style={estilos.textoMotivo} numberOfLines={2}>
              {receta.motivo}
            </Text>
          </View>
        )}

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
            {!esNueva && (
              <>
                <Icono nombre="star-bold" size={14} color={colors.calido} />
                <Text style={tipografia.chico}>
                  {receta.promedio} ({receta.total})
                </Text>
                <Text style={tipografia.chico}>·</Text>
              </>
            )}
            <Icono nombre="clock-circle-linear" size={14} color={colors.textoSuave} />
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
  filaEtiquetas: {
    position: 'absolute',
    bottom: espaciado.sm + 2,
    left: espaciado.sm + 2,
    right: espaciado.sm + 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  etiqueta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.superficie,
    borderRadius: radios.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    shadowColor: colors.texto,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  etiquetaNueva: {
    backgroundColor: colors.resaltado,
  },
  puntoNueva: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.acentoOscuro,
  },
  textoEtiqueta: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.chico,
    letterSpacing: 0.3,
    color: colors.texto,
  },
  cuerpo: {
    paddingHorizontal: espaciado.md,
    paddingTop: 14,
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
    fontSize: tamanos.mini,
    letterSpacing: 0.5,
    color: colors.sobreAcento,
  },
  datos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  motivo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: colors.calidoSuave,
    borderRadius: radios.md,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: espaciado.sm,
  },
  textoMotivo: {
    flex: 1,
    fontFamily: fuentes.semibold,
    fontSize: tamanos.chico,
    lineHeight: 18,
    color: colors.texto,
  },
});
