import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icono from '../components/Icono';
import { EstadoVacio } from '../components/EstadoVacio';
import { IMAGENES_MASCOTA } from '../constants/mascota';
import { OrdenComunidad, RecetaFeed, useComunidad } from '../hooks/useComunidad';
import { HojaColeccion } from '../components/recetario/HojaColeccion';
import { TarjetaRecetaComunidad } from '../components/comunidad/TarjetaRecetaComunidad';
import { SearchBar } from '../components/SearchBar';
import { VistaCargando, VistaError } from '../components/StateViews';
import { colors, espaciado, fuentes, radios, sombra, tamanos, tipografia } from '../theme/theme';

interface Props {
  onAbrirReceta: (id: number) => void;
  onPublicar: () => void;
  onMisPublicaciones: () => void;
  recetaPublicada?: number;
}

const ORDENES: { valor: OrdenComunidad; texto: string }[] = [
  { valor: 'para_ti', texto: 'Para ti' },
  { valor: 'recientes', texto: 'Recientes' },
  { valor: 'mejor_calificadas', texto: 'Mejor calificadas' },
];

export default function ComunidadScreen({
  onAbrirReceta,
  onPublicar,
  onMisPublicaciones,
  recetaPublicada,
}: Props) {
  const [orden, setOrden] = useState<OrdenComunidad>('recientes');
  const [busqueda, setBusqueda] = useState('');
  const [etiquetaId, setEtiquetaId] = useState<number | null>(null);
  const [coleccion, setColeccion] = useState<RecetaFeed | null>(null);
  const [mostrarFlotante, setMostrarFlotante] = useState(false);
  const lista = useRef<FlatList<RecetaFeed>>(null);

  const { recetas, etiquetas, cargando, cargandoMas, refrescando, error, cargarMas, refrescar, reintentar } =
    useComunidad(orden, busqueda, etiquetaId);

  // Recién publicada: mostramos las más recientes para que quede hasta arriba
  useEffect(() => {
    if (!recetaPublicada) return;
    setOrden('recientes');
    setEtiquetaId(null);
    lista.current?.scrollToOffset({ offset: 0, animated: true });
  }, [recetaPublicada]);

  // Al regresar al feed (por ejemplo, después de publicar) se actualiza la lista
  const primeraVez = useRef(true);
  const refrescarActual = useRef(refrescar);
  refrescarActual.current = refrescar;
  useFocusEffect(
    useCallback(() => {
      if (primeraVez.current) {
        primeraVez.current = false;
        return;
      }
      refrescarActual.current();
    }, [])
  );

  const alHacerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const pasoLimite = e.nativeEvent.contentOffset.y > 300;
    if (pasoLimite !== mostrarFlotante) setMostrarFlotante(pasoLimite);
  };

  const encabezado = (
    <View>
      <View style={estilos.barraSuperior}>
        <View style={estilos.espacioIcono} />
        <Image
          source={require('../assets/images/cookea-logo.png')}
          style={estilos.logo}
          resizeMode="contain"
        />
        <Pressable
          onPress={onMisPublicaciones}
          hitSlop={6}
          style={estilos.botonMis}
          accessibilityRole="button"
          accessibilityLabel="Mis publicaciones"
        >
          <Icono nombre="document-text-linear" size={22} color={colors.primario} />
        </Pressable>
      </View>

      <View style={estilos.bloqueTitulo}>
        <Text style={estilos.titulo}>Comunidad</Text>
        <View style={estilos.lineaTitulo} />
        <Text style={estilos.subtitulo}>Recetas que comparten otras familias</Text>
      </View>

      <SearchBar placeholder="Busca recetas de otros" onBuscar={setBusqueda} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={estilos.filaChips}
      >
        {ORDENES.map((o) => {
          const activo = orden === o.valor;
          return (
            <Pressable
              key={o.valor}
              onPress={() => setOrden(o.valor)}
              style={[estilos.chip, activo && estilos.chipActivo]}
              accessibilityRole="tab"
              accessibilityState={{ selected: activo }}
            >
              {o.valor === 'para_ti' && (
                <Icono nombre="chef-hat-heart-linear" size={16} color={activo ? colors.sobreAcento : colors.acentoOscuro} />
              )}
              <Text style={[estilos.textoChip, activo && estilos.textoChipActivo]}>{o.texto}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {etiquetas.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={estilos.filaEtiquetas}
        >
          {etiquetas.map((e) => {
            const activa = etiquetaId === e.id;
            return (
              <Pressable
                key={e.id}
                onPress={() => setEtiquetaId(activa ? null : e.id)}
                style={[estilos.etiqueta, activa && estilos.etiquetaActiva]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: activa }}
              >
                {activa && <Icono nombre="check-linear" size={14} color={colors.sobrePrimario} />}
                <Text style={[estilos.textoEtiqueta, activa && estilos.textoEtiquetaActiva]}>{e.nombre}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {orden === 'para_ti' && (
        <View style={estilos.notaParaTi}>
          <Icono nombre="lightbulb-linear" size={18} color={colors.calidoIntenso} />
          <Text style={estilos.textoNotaParaTi}>Ordenadas según tu alacena, tus gustos y lo que debes usar pronto.</Text>
        </View>
      )}

      <Pressable
        onPress={onPublicar}
        style={({ pressed }) => [estilos.invitacion, pressed && { opacity: 0.92 }]}
        accessibilityRole="button"
        accessibilityLabel="Publicar una receta de familia"
      >
        <View style={estilos.medioCirculo}>
          <Image
            source={IMAGENES_MASCOTA.asomarse!}
            style={estilos.mascota}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        </View>
        <View style={estilos.textosInvitacion}>
          <Text style={estilos.tituloInvitacion}>¿Tienes una receta de familia?</Text>
          <Text style={estilos.subInvitacion}>Compártela con la comunidad</Text>
        </View>
        <View style={estilos.botonInvitacion}>
          <Icono nombre="add-linear" size={16} color={colors.primario} />
          <Text style={estilos.textoBotonInvitacion}>Publicar</Text>
        </View>
      </Pressable>
    </View>
  );

  const vacio = cargando ? (
    <VistaCargando mensaje="Cargando recetas..." />
  ) : error ? (
    <VistaError mensaje={error} onReintentar={reintentar} />
  ) : (
    busqueda || etiquetaId != null ? (
      <EstadoVacio
        imagen={require('../assets/images/vacios/lupa_cuchara.webp')}
        titulo="No encontramos recetas"
        texto={busqueda ? `Nada coincide con "${busqueda}". Prueba con otra palabra.` : 'No hay recetas con esa etiqueta todavía.'}
        accion={etiquetaId != null ? { texto: 'Quitar etiqueta', onPress: () => setEtiquetaId(null) } : undefined}
      />
    ) : (
      <EstadoVacio
        imagen={require('../assets/images/vacios/mesa_compartida.webp')}
        titulo="Aún no hay recetas"
        texto="Sé la primera persona en compartir la suya."
        accion={{ texto: 'Publicar receta', onPress: onPublicar }}
      />
    )
  );

  return (
    <SafeAreaView style={estilos.pantalla} edges={['top']}>
      <FlatList
        ref={lista}
        data={recetas}
        keyExtractor={(r) => String(r.id)}
        renderItem={({ item }) => (
          <TarjetaRecetaComunidad
            receta={item}
            onPress={() => onAbrirReceta(item.id)}
            onColeccion={() => setColeccion(item)}
          />
        )}
        ListHeaderComponent={encabezado}
        ListEmptyComponent={vacio}
        ListFooterComponent={
          cargandoMas ? <ActivityIndicator color={colors.acento} style={estilos.cargandoMas} /> : null
        }
        onEndReached={cargarMas}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={refrescar}
            colors={[colors.acento]}
            tintColor={colors.acento}
          />
        }
        onScroll={alHacerScroll}
        scrollEventThrottle={100}
        contentContainerStyle={estilos.lista}
        keyboardShouldPersistTaps="handled"
      />

      {mostrarFlotante && (
        <Pressable onPress={onPublicar} style={estilos.botonFlotante} accessibilityRole="button">
          <Icono nombre="add-linear" size={20} color={colors.sobrePrimario} />
          <Text style={estilos.textoFlotante}>Publicar</Text>
        </Pressable>
      )}
      <HojaColeccion visible={!!coleccion} receta={coleccion} onCerrar={() => setColeccion(null)} />
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  lista: {
    paddingHorizontal: espaciado.md,
    paddingBottom: 104,
  },
  barraSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: espaciado.sm,
    marginBottom: espaciado.sm,
  },
  espacioIcono: {
    width: 44,
  },
  botonMis: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 140,
    height: 40,
  },
  bloqueTitulo: {
    alignItems: 'center',
    marginBottom: espaciado.md,
  },
  titulo: {
    ...tipografia.tituloGrande,
    color: colors.primario,
  },
  lineaTitulo: {
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.acento,
    marginTop: 5,
    marginBottom: espaciado.sm,
  },
  subtitulo: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.base,
    letterSpacing: 0.3,
    color: colors.acentoOscuro,
    textAlign: 'center',
  },
  filaChips: {
    gap: espaciado.sm,
    paddingVertical: espaciado.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1.5,
    borderColor: colors.acento,
    borderRadius: radios.pill,
    paddingHorizontal: espaciado.md,
    paddingVertical: 8,
  },
  chipActivo: {
    backgroundColor: colors.acento,
  },
  textoChip: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.base,
    letterSpacing: 0.3,
    color: colors.acentoOscuro,
  },
  textoChipActivo: {
    color: colors.sobreAcento,
  },
  filaEtiquetas: {
    gap: 8,
    paddingBottom: espaciado.md,
  },
  etiqueta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.superficie,
    borderRadius: radios.pill,
    paddingHorizontal: 14,
    minHeight: 36,
  },
  etiquetaActiva: {
    backgroundColor: colors.primario,
  },
  textoEtiqueta: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.chico,
    color: colors.textoSuave,
  },
  textoEtiquetaActiva: {
    color: colors.sobrePrimario,
  },
  notaParaTi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.calidoSuave,
    borderRadius: radios.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: espaciado.md,
  },
  textoNotaParaTi: {
    flex: 1,
    fontFamily: fuentes.semibold,
    fontSize: tamanos.chico,
    lineHeight: 18,
    color: colors.texto,
  },
  invitacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 96,
    backgroundColor: colors.primario,
    borderRadius: radios.lg,
    paddingRight: espaciado.md,
    marginBottom: espaciado.lg,
    overflow: 'hidden',
  },
  medioCirculo: {
    alignSelf: 'stretch',
    width: 84,
    overflow: 'hidden',
  },
  mascota: {
    position: 'absolute',
    left: 0,
    top: 6,
    width: 84,
    height: 134,
  },
  textosInvitacion: {
    flex: 1,
    gap: 2,
  },
  tituloInvitacion: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.destacado,
    lineHeight: 22,
    color: colors.sobrePrimario,
  },
  subInvitacion: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.chico,
    letterSpacing: 0.3,
    color: colors.neutro,
  },
  botonInvitacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.superficieCalida,
    borderRadius: radios.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  textoBotonInvitacion: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.base,
    color: colors.primario,
  },
  cargandoMas: {
    marginVertical: espaciado.md,
  },
  botonFlotante: {
    position: 'absolute',
    right: espaciado.md,
    bottom: espaciado.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primario,
    borderRadius: radios.pill,
    paddingHorizontal: 22,
    paddingVertical: 14,
    ...sombra,
  },
  textoFlotante: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    letterSpacing: 0.3,
    color: colors.sobrePrimario,
  },
});