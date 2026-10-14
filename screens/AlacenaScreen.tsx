import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, espaciado, radios, tipografia } from '../theme/theme';
import { useAlacena } from '../hooks/useAlacena';
import { AlacenaItem } from '../types/alacena';
import { GRUPOS_ALACENA, GrupoAlacena, grupoDeCategoria, normalizar } from '../constants/categorias';
import { AlacenaItemCard } from '../components/alacena/alacenaItemCard';
import { SwipeableRow } from '../components/alacena/swipeableRow';
import { ChipsFiltro } from '../components/alacena/chipsFiltro';
import { AgregarIngredienteModal } from '../components/alacena/agregarIngredienteModal';
import { EditarItemModal } from '../components/alacena/editarItemModal';
import { DespensaBamxModal } from '../components/alacena/despensaBamxModal';
import { VistaError } from '../components/StateViews';
import { mostrarAviso } from '../lib/avisos';
import { BotonQueCocino } from '../components/recomendador/botonQueCocino';

export function AlacenaScreen() {
  const navigation = useNavigation<any>();
  const { items, cargando, error, cargar, agregarVarios, cambiarCantidad, fijarUsarPronto, eliminar } =
    useAlacena();

  const [busqueda, setBusqueda] = useState('');
  const [grupo, setGrupo] = useState<GrupoAlacena>('todo');
  const [modalAgregar, setModalAgregar] = useState(false);
  const [modalBamx, setModalBamx] = useState(false);
  const [itemEditando, setItemEditando] = useState<AlacenaItem | null>(null);
  const [refrescando, setRefrescando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const visibles = useMemo(() => {
    const q = normalizar(busqueda);
    return items.filter((i) => {
      if (q && !normalizar(i.ingredientes.nombre).includes(q)) return false;
      if (grupo === 'todo') return true;
      if (grupo === 'pronto') return i.usar_pronto;
      return grupoDeCategoria(i.ingredientes.categoria) === grupo;
    });
  }, [items, busqueda, grupo]);

  async function alJalar() {
    setRefrescando(true);
    await cargar();
    setRefrescando(false);
  }

  async function avisarSiFalla(promesa: Promise<{ ok: boolean; mensaje?: string }>) {
    const r = await promesa;
    if (!r.ok) mostrarAviso('Algo salió mal', r.mensaje ?? 'Intenta de nuevo.');
  }

  function abrirBamxDesdeAgregar() {
    setModalAgregar(false);
    setTimeout(() => setModalBamx(true), 350);
  }

  const hayFiltroActivo = busqueda.trim().length > 0 || grupo !== 'todo';

  return (
    <SafeAreaView style={estilos.pantalla} edges={['top']}>
      {}
      <View style={estilos.encabezado}>
        <View style={estilos.ladoEncabezado}>
          {navigation.canGoBack() && (
            <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
              <Text style={estilos.flecha}>←</Text>
            </Pressable>
          )}
        </View>
        <Image
          source={require('../assets/images/cookea-logo.png')}
          style={estilos.logo}
          resizeMode="contain"
        />
        <View style={estilos.ladoEncabezado} />
      </View>

      <View style={estilos.tituloFila}>
        <Text style={tipografia.titulo}>Mi alacena</Text>
        {!cargando && items.length > 0 && (
          <Text style={tipografia.chico}>
            {items.length} {items.length === 1 ? 'ingrediente' : 'ingredientes'}
          </Text>
        )}
      </View>

      {}
      {!cargando && items.length > 0 && (
        <BotonQueCocino onPress={() => navigation.navigate('QueCocino')} />
      )}

      {}
      <View style={estilos.buscadorContenedor}>
        <View style={estilos.buscador}>
          <TextInput
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Busca un ingrediente"
            placeholderTextColor={colors.textoSecundario}
            style={estilos.input}
          />
          {busqueda.length > 0 ? (
            <Pressable onPress={() => setBusqueda('')} hitSlop={8}>
              <Text style={estilos.iconoBuscador}>✕</Text>
            </Pressable>
          ) : (
            <Text style={estilos.iconoBuscador}>🔍</Text>
          )}
        </View>
      </View>

      <View style={{ marginTop: 12, marginBottom: 6 }}>
        <ChipsFiltro
          opciones={GRUPOS_ALACENA}
          seleccionada={grupo}
          onSeleccionar={(c) => setGrupo(c as GrupoAlacena)}
        />
      </View>

      {}
      {cargando ? (
        <View style={estilos.centro}>
          <ActivityIndicator size="large" color={colors.oliva} />
          <Text style={[tipografia.cuerpo, estilos.textoCentro]}>Cargando tu alacena...</Text>
        </View>
      ) : error ? (
        <VistaError mensaje={error} onReintentar={cargar} />
      ) : (
        <FlatList
          data={visibles}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={estilos.lista}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={alJalar} />}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            items.length === 0 ? (
              <View style={estilos.vacio}>
                <Text style={estilos.vacioIcono}>🧺</Text>
                <Text style={tipografia.subtitulo}>Tu alacena está vacía</Text>
                <Text style={[tipografia.cuerpo, estilos.textoCentro]}>
                  Agrega lo que tienes en casa y te mostraremos recetas que puedes preparar.
                </Text>
                <Pressable onPress={() => setModalAgregar(true)} style={estilos.botonPrimario}>
                  <Text style={estilos.textoBotonPrimario}>Agregar ingredientes</Text>
                </Pressable>
                <Pressable onPress={() => setModalBamx(true)} style={estilos.botonSecundario}>
                  <Text style={estilos.textoBotonSecundario}>Agregar mi despensa BAMX</Text>
                </Pressable>
              </View>
            ) : hayFiltroActivo ? (
              <View style={estilos.vacio}>
                <Text style={tipografia.subtitulo}>Sin resultados</Text>
                <Text style={[tipografia.cuerpo, estilos.textoCentro]}>
                  Ningún ingrediente coincide con tu búsqueda o filtro.
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <SwipeableRow onEliminar={() => avisarSiFalla(eliminar(item))}>
              <AlacenaItemCard
                item={item}
                onCambiarCantidad={(it, nueva) => avisarSiFalla(cambiarCantidad(it, nueva))}
                onPress={() => setItemEditando(item)}
              />
            </SwipeableRow>
          )}
        />
      )}

      {}
      <Pressable
        onPress={() => setModalAgregar(true)}
        style={estilos.fab}
        accessibilityLabel="Agregar ingredientes"
      >
        <Text style={estilos.fabTexto}>+</Text>
      </Pressable>

      {}
      <AgregarIngredienteModal
        visible={modalAgregar}
        onCerrar={() => setModalAgregar(false)}
        onConfirmar={agregarVarios}
        onAbrirBamx={abrirBamxDesdeAgregar}
      />

      <DespensaBamxModal
        visible={modalBamx}
        onCerrar={() => setModalBamx(false)}
        onConfirmar={agregarVarios}
      />

      <EditarItemModal
        item={itemEditando}
        onCerrar={() => setItemEditando(null)}
        onGuardar={async (item, cantidadBase, usarPronto) => {
          if (cantidadBase !== item.cantidad) {
            const r = await cambiarCantidad(item, cantidadBase);
            if (!r.ok) return mostrarAviso('No se pudo guardar', r.mensaje);
          }
          if (usarPronto !== item.usar_pronto) {
            const r = await fijarUsarPronto(item, usarPronto);
            if (!r.ok) return mostrarAviso('No se pudo guardar', r.mensaje);
          }
          setItemEditando(null);
        }}
        onEliminar={async (item) => {
          setItemEditando(null);
          await avisarSiFalla(eliminar(item));
        }}
      />
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.background,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: espaciado.md,
    paddingTop: espaciado.sm,
  },
  ladoEncabezado: {
    width: 40,
  },
  flecha: {
    fontSize: 22,
    color: colors.textoPrincipal,
  },
  logo: {
    width: 130,
    height: 34,
  },
  tituloFila: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: espaciado.md,
    marginTop: espaciado.md,
  },
  buscadorContenedor: {
    paddingHorizontal: espaciado.md,
    marginTop: espaciado.sm,
  },
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radios.pill,
    borderWidth: 1,
    borderColor: colors.borde,
    paddingHorizontal: espaciado.md,
  },
  input: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.textoPrincipal,
  },
  iconoBuscador: {
    fontSize: 16,
    color: colors.textoSecundario,
  },
  lista: {
    paddingHorizontal: espaciado.md,
    paddingTop: espaciado.sm,
    paddingBottom: 120, // espacio para que el botón + no tape la última tarjeta
    flexGrow: 1,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoCentro: {
    textAlign: 'center',
    color: colors.textoSecundario,
    marginTop: 8,
  },
  vacio: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: espaciado.lg,
  },
  vacioIcono: {
    fontSize: 48,
    marginBottom: 8,
  },
  botonPrimario: {
    marginTop: 20,
    backgroundColor: colors.terracota,
    borderRadius: radios.pill,
    paddingVertical: 13,
    paddingHorizontal: 26,
  },
  textoBotonPrimario: {
    color: colors.textoSobreColor,
    fontWeight: '700',
    fontSize: 14,
  },
  botonSecundario: {
    marginTop: 10,
    borderRadius: radios.pill,
    borderWidth: 1,
    borderColor: colors.oliva,
    paddingVertical: 12,
    paddingHorizontal: 22,
  },
  textoBotonSecundario: {
    color: colors.oliva,
    fontWeight: '600',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 22,
    bottom: 28,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.terracota,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3A2E22',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  fabTexto: {
    color: colors.textoSobreColor,
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '300',
  },
});