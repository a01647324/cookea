import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Icono from '../Icono';
import { useFavoriteToggle } from '../../hooks/useFavoriteToggle';
import { useAlbumToggle } from '../../hooks/useAlbumToggle';
import { RecetaRecetario } from '../../hooks/useRecetario';
import { colors, espaciado, fuentes, radios, tamanos } from '../../theme/theme';

interface Props {
  receta: RecetaRecetario;
  onAbrir: () => void;
  onColeccion: () => void;
  onSemana: () => void;
}

export function TarjetaRecetario({ receta, onAbrir, onColeccion, onSemana }: Props) {
  const { esFavorita, alternar: alternarFavorito } = useFavoriteToggle(receta.id);
  const { activo: despues, cargando: cargandoDespues, alternar: alternarDespues } = useAlbumToggle(
    receta.id,
    'hacer_despues'
  );

  const insignia =
    receta.faltan === null
      ? null
      : receta.faltan === 0
        ? { texto: 'Tienes todo', punto: colors.acento }
        : { texto: receta.faltan === 1 ? 'Te falta 1' : `Te faltan ${receta.faltan}`, punto: colors.resaltado };

  const meta = [
    `${receta.porciones_base} ${receta.porciones_base === 1 ? 'porción' : 'porciones'}`,
    receta.etiquetas[0]?.nombre,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={estilos.tarjeta}>
      <Pressable onPress={onAbrir} accessibilityRole="button" accessibilityLabel={receta.nombre}>
        <View style={estilos.foto}>
          {receta.foto_url ? (
            <Image source={{ uri: receta.foto_url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
          ) : (
            <View style={[StyleSheet.absoluteFill, estilos.sinFoto]}>
              <Icono nombre="chef-hat-linear" size={44} color={colors.superficie} />
            </View>
          )}

          {insignia && (
            <View style={[estilos.vidrio, estilos.arribaIzquierda]}>
              <View style={[estilos.punto, { backgroundColor: insignia.punto }]} />
              <Text style={estilos.textoVidrio}>{insignia.texto}</Text>
            </View>
          )}

          <View style={[estilos.vidrio, estilos.abajoIzquierda]}>
            <Icono nombre="clock-circle-linear" size={14} color={colors.superficie} />
            <Text style={estilos.textoVidrio}>{receta.tiempo_min} min</Text>
          </View>

          <Pressable
            onPress={alternarFavorito}
            hitSlop={8}
            style={estilos.estrella}
            accessibilityLabel={esFavorita ? 'Quitar de favoritos' : 'Guardar en favoritos'}
          >
            <Icono
              nombre={esFavorita ? 'star-bold' : 'star-linear'}
              size={20}
              color={esFavorita ? colors.calificacion : colors.superficie}
            />
          </Pressable>
        </View>

        <Text style={estilos.nombre} numberOfLines={2}>
          {receta.nombre}
        </Text>
        {!!meta && <Text style={estilos.meta}>{meta}</Text>}
      </Pressable>

      <View style={estilos.acciones}>
        <Pressable
          onPress={alternarDespues}
          disabled={cargandoDespues}
          style={[estilos.accion, despues && estilos.accionActiva]}
          accessibilityState={{ selected: despues }}
        >
          <Icono nombre="clock-circle-linear" size={18} color={despues ? colors.calidoOscuro : colors.textoSuave} />
          <Text style={[estilos.textoAccion, despues && estilos.textoAccionActiva]}>Después</Text>
        </Pressable>
        <Pressable onPress={onColeccion} style={estilos.accion}>
          <Icono nombre="folder-linear" size={18} color={colors.textoSuave} />
          <Text style={estilos.textoAccion}>Colección</Text>
        </Pressable>
        <Pressable onPress={onSemana} style={estilos.accion}>
          <Icono nombre="calendar-linear" size={18} color={colors.textoSuave} />
          <Text style={estilos.textoAccion}>Semana</Text>
        </Pressable>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    marginHorizontal: espaciado.md,
    marginBottom: espaciado.lg,
  },
  foto: {
    height: 185,
    borderRadius: radios.lg,
    overflow: 'hidden',
    backgroundColor: colors.sereno,
  },
  sinFoto: {
    backgroundColor: colors.encabezado,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vidrio: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.vidrio,
    borderWidth: 1,
    borderColor: colors.vidrioBorde,
    borderRadius: radios.pill,
    paddingHorizontal: espaciado.sm,
    paddingVertical: 4,
  },
  arribaIzquierda: {
    top: espaciado.sm,
    left: espaciado.sm,
  },
  abajoIzquierda: {
    bottom: espaciado.sm,
    left: espaciado.sm,
  },
  punto: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  textoVidrio: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.mini,
    color: colors.superficie,
  },
  estrella: {
    position: 'absolute',
    top: espaciado.sm,
    right: espaciado.sm,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.vidrio,
    borderWidth: 1,
    borderColor: colors.vidrioBorde,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nombre: {
    fontFamily: fuentes.titulo,
    fontSize: 19,
    lineHeight: 25,
    color: colors.texto,
    marginTop: espaciado.sm,
  },
  meta: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.base,
    color: colors.textoSuave,
    marginTop: 2,
  },
  acciones: {
    flexDirection: 'row',
    gap: espaciado.sm,
    marginTop: espaciado.sm,
  },
  accion: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minHeight: 42,
    borderRadius: radios.pill,
    borderWidth: 1.5,
    borderColor: colors.borde,
    backgroundColor: colors.superficie,
  },
  accionActiva: {
    backgroundColor: colors.resaltadoSuave,
    borderColor: colors.resaltado,
  },
  textoAccion: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.chico,
    color: colors.textoSuave,
  },
  textoAccionActiva: {
    fontFamily: fuentes.negrita,
    color: colors.calidoOscuro,
  },
});
