import React, { useCallback, useRef, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { OrdenComunidad, useComunidad } from '../hooks/useComunidad';
import { TarjetaRecetaComunidad } from '../components/comunidad/TarjetaRecetaComunidad';
import { SearchBar } from '../components/SearchBar';
import { VistaCargando, VistaError } from '../components/StateViews';
import { colors, espaciado, fuentes, radios, sombra, tamanos, tipografia } from '../theme/theme';

interface Props {
  onAbrirReceta: (id: number) => void;
  onPublicar: () => void;
  onMisPublicaciones: () => void;
  onGuardar?: (id: number) => void;
}

const ORDENES: { valor: OrdenComunidad; texto: string }[] = [
  { valor: 'recientes', texto: 'Recientes' },
  { valor: 'mejor_calificadas', texto: 'Mejor calificadas' },
];

export default function ComunidadScreen({
  onAbrirReceta,
  onPublicar,
  onMisPublicaciones,
  onGuardar,
}: Props) {
  const [orden, setOrden] = useState<OrdenComunidad>('recientes');
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFlotante, setMostrarFlotante] = useState(false);

  const { recetas, cargando, cargandoMas, refrescando, error, cargarMas, refrescar, reintentar } =
    useComunidad(orden, busqueda);

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
        <Pressable onPress={onMisPublicaciones} hitSlop={10} accessibilityLabel="Mis publicaciones">
          <Ionicons name="reader-outline" size={24} color={colors.primario} />
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
            >
              <Text style={[estilos.textoChip, activo && estilos.textoChipActivo]}>{o.texto}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={estilos.invitacion}>
        <View style={estilos.iconoInvitacion}>
          <Ionicons name="restaurant-outline" size={22} color={colors.texto} />
        </View>
        <View style={estilos.textosInvitacion}>
          <Text style={estilos.tituloInvitacion}>¿Tienes una receta de familia?</Text>
          <Text style={estilos.subInvitacion}>Compártela con la comunidad</Text>
        </View>
        <Pressable onPress={onPublicar} style={estilos.botonInvitacion}>
          <Ionicons name="add" size={16} color={colors.primario} />
          <Text style={estilos.textoBotonInvitacion}>Publicar</Text>
        </Pressable>
      </View>
    </View>
  );

  const vacio = cargando ? (
    <VistaCargando mensaje="Cargando recetas..." />
  ) : error ? (
    <VistaError mensaje={error} onReintentar={reintentar} />
  ) : (
    <View style={estilos.vacio}>
      <Ionicons name="people-outline" size={40} color={colors.neutro} />
      <Text style={tipografia.subtitulo}>
        {busqueda ? 'No encontramos recetas' : 'Aún no hay recetas'}
      </Text>
      <Text style={[tipografia.chico, estilos.centrado]}>
        {busqueda ? 'Prueba con otra palabra.' : 'Sé la primera persona en compartir la suya.'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={estilos.pantalla} edges={['top']}>
      <FlatList
        data={recetas}
        keyExtractor={(r) => String(r.id)}
        renderItem={({ item }) => (
          <TarjetaRecetaComunidad
            receta={item}
            onPress={() => onAbrirReceta(item.id)}
            onGuardar={() => onGuardar?.(item.id)}
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
        <Pressable onPress={onPublicar} style={estilos.botonFlotante}>
          <Ionicons name="add" size={20} color={colors.sobrePrimario} />
          <Text style={estilos.textoFlotante}>Publicar</Text>
        </Pressable>
      )}
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
    width: 24,
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
  invitacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.primario,
    borderRadius: radios.lg,
    padding: espaciado.md,
    marginBottom: espaciado.lg,
  },
  iconoInvitacion: {
    width: 44,
    height: 44,
    borderRadius: radios.md,
    backgroundColor: colors.calido,
    alignItems: 'center',
    justifyContent: 'center',
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
  vacio: {
    alignItems: 'center',
    gap: espaciado.sm,
    paddingVertical: espaciado.xl,
  },
  centrado: {
    textAlign: 'center',
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