import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAlacena } from '../hooks/useAlacena';
import { AlacenaItem } from '../types/alacena';
import { GrupoAlacena, grupoDeCategoria, normalizar } from '../constants/categorias';
import Icono from '../components/Icono';
import { SearchBar } from '../components/SearchBar';
import { Esqueleto } from '../components/Esqueleto';
import { EstadoVacio } from '../components/EstadoVacio';
import { AlacenaItemCard } from '../components/alacena/alacenaItemCard';
import { SwipeableRow } from '../components/alacena/swipeableRow';
import { GRUPOS, TarjetasGrupo } from '../components/alacena/TarjetasGrupo';
import { AgregarIngredienteModal } from '../components/alacena/agregarIngredienteModal';
import { EditarItemModal } from '../components/alacena/editarItemModal';
import { BotonQueCocino } from '../components/recomendador/botonQueCocino';
import { mostrarAviso } from '../lib/avisos';
import { colors, espaciado, fuentes, radios, tamanos } from '../theme/theme';

const ORDEN_SECCIONES: GrupoAlacena[] = ['refrigerados', 'verduras', 'despensa'];

function nombreGrupo(clave: GrupoAlacena) {
  return GRUPOS.find((g) => g.clave === clave)?.nombre ?? '';
}

export function AlacenaScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { items, cargando, error, cargar, agregarVarios, cambiarCantidad, fijarUsarPronto, eliminar } =
    useAlacena();

  const [busqueda, setBusqueda] = useState('');
  const [versionBuscador, setVersionBuscador] = useState(0);
  const [grupo, setGrupo] = useState<GrupoAlacena>('todo');
  const [agregando, setAgregando] = useState(false);
  const [itemEditando, setItemEditando] = useState<AlacenaItem | null>(null);
  const [refrescando, setRefrescando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const conteos = useMemo(() => {
    const c: Record<GrupoAlacena, number> = { todo: items.length, refrigerados: 0, verduras: 0, despensa: 0, pronto: 0 };
    items.forEach((i) => {
      c[grupoDeCategoria(i.ingredientes.categoria)] += 1;
      if (i.usar_pronto) c.pronto += 1;
    });
    return c;
  }, [items]);

  const secciones = useMemo(() => {
    const q = normalizar(busqueda);
    const visibles = items.filter((i) => {
      if (q && !normalizar(i.ingredientes.nombre).includes(q)) return false;
      if (grupo === 'todo') return true;
      if (grupo === 'pronto') return i.usar_pronto;
      return grupoDeCategoria(i.ingredientes.categoria) === grupo;
    });

    if (grupo !== 'todo') {
      return visibles.length ? [{ clave: grupo, titulo: nombreGrupo(grupo), data: visibles }] : [];
    }
    return ORDEN_SECCIONES.map((g) => ({
      clave: g,
      titulo: nombreGrupo(g),
      data: visibles.filter((i) => grupoDeCategoria(i.ingredientes.categoria) === g),
    })).filter((s) => s.data.length > 0);
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

  function limpiarBusqueda() {
    setBusqueda('');
    setVersionBuscador((v) => v + 1);
  }

  const buscando = busqueda.trim().length > 0;
  const hayItems = !cargando && items.length > 0;

  const encabezado = (
    <View>
      <View style={[estilos.superior, { paddingTop: insets.top + espaciado.sm }]}>
        {navigation.canGoBack() ? (
          <Pressable onPress={() => navigation.goBack()} style={estilos.botonAtras} accessibilityLabel="Regresar">
            <Icono nombre="arrow-left-linear" size={22} color={colors.texto} />
          </Pressable>
        ) : (
          <View />
        )}
        {hayItems && (
          <Text style={estilos.contador}>
            {items.length} {items.length === 1 ? 'ingrediente' : 'ingredientes'}
          </Text>
        )}
      </View>

      <Text style={estilos.titulo}>Mi alacena</Text>

      {(hayItems || cargando) && (
        <>
          <View style={estilos.buscador}>
            <SearchBar key={versionBuscador} placeholder="Busca en tu alacena" onBuscar={setBusqueda} />
          </View>

          <View style={{ marginTop: espaciado.md }}>
            <TarjetasGrupo seleccionado={grupo} conteos={conteos} onElegir={setGrupo} />
          </View>
        </>
      )}

      {hayItems && conteos.pronto > 0 && grupo !== 'pronto' && !buscando && (
        <Pressable onPress={() => setGrupo('pronto')} style={estilos.aviso} accessibilityRole="button">
          <Icono nombre="hourglass-linear" size={22} color={colors.destacadoIntenso} />
          <Text style={estilos.textoAviso}>
            <Text style={estilos.textoAvisoFuerte}>
              {conteos.pronto} {conteos.pronto === 1 ? 'ingrediente' : 'ingredientes'}
            </Text>{' '}
            conviene usarlos pronto
          </Text>
          <Text style={estilos.verAviso}>Ver</Text>
        </Pressable>
      )}

      {hayItems && !buscando && <BotonQueCocino onPress={() => navigation.navigate('QueCocino')} />}
    </View>
  );

  function vacio() {
    if (cargando) {
      return (
        <View style={estilos.esqueletos}>
          {[0, 1, 2, 3].map((i) => (
            <Esqueleto key={i} ancho="100%" alto={84} radio={20} estilo={{ marginBottom: espaciado.sm }} />
          ))}
        </View>
      );
    }
    if (error) {
      return (
        <EstadoVacio
          icono="danger-triangle-linear"
          titulo="No pudimos cargar tu alacena"
          texto={error}
          accion={{ texto: 'Reintentar', onPress: cargar }}
        />
      );
    }
    if (items.length === 0) {
      return (
        <EstadoVacio
          imagen={require('../assets/images/vacios/alacena_vacia.webp')}
          titulo="Tu alacena está vacía"
          texto="Agrega lo que tienes en casa o tu despensa BAMX y te diremos qué puedes cocinar."
          accion={{ texto: 'Agregar ingredientes', onPress: () => setAgregando(true) }}
        />
      );
    }
    if (buscando) {
      return (
        <EstadoVacio
          imagen={require('../assets/images/vacios/olla_vacia.webp')}
          compacto
          titulo={`No encontramos «${busqueda.trim()}»`}
          texto="Revisa cómo lo escribiste o agrégalo a tu alacena."
          accion={{ texto: 'Limpiar búsqueda', onPress: limpiarBusqueda }}
        />
      );
    }

    if (grupo === 'pronto') {
      return (
        <EstadoVacio
          imagen={require('../assets/images/vacios/pronto_vacio.webp')}
          compacto
          titulo="Nada por usar pronto"
          texto="Toca un ingrediente y activa «Usar pronto» si se va a echar a perder."
        />
      );
    }

    const datosGrupo = GRUPOS.find((g) => g.clave === grupo);
    return (
      <EstadoVacio
        compacto
        icono={datosGrupo?.icono}
        titulo={grupo === 'pronto' ? 'Nada por usar pronto' : `Sin ${nombreGrupo(grupo).toLowerCase()}`}
        texto={
          grupo === 'pronto'
            ? 'Toca un ingrediente y activa «Usar pronto» si se va a echar a perder.'
            : 'Cuando agregues algo de este grupo aparecerá aquí.'
        }
      />
    );
  }

  return (
    <View style={estilos.pantalla}>
      <SectionList
        sections={cargando || error ? [] : secciones}
        keyExtractor={(i) => String(i.id)}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={estilos.lista}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={alJalar} tintColor={colors.encabezado} />}
        ListHeaderComponent={encabezado}
        ListEmptyComponent={vacio()}
        renderSectionHeader={({ section }) => (
          <View style={estilos.encabezadoSeccion}>
            <Text style={estilos.tituloSeccion}>{section.titulo}</Text>
            <Text style={estilos.contador}>{section.data.length}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={estilos.fila}>
            <SwipeableRow onEliminar={() => avisarSiFalla(eliminar(item))}>
              <AlacenaItemCard item={item} onPress={() => setItemEditando(item)} />
            </SwipeableRow>
          </View>
        )}
      />

      {hayItems && (
        <Pressable
          onPress={() => setAgregando(true)}
          style={({ pressed }) => [estilos.fab, pressed && { opacity: 0.9 }]}
          accessibilityRole="button"
          accessibilityLabel="Agregar ingredientes"
        >
          <Icono nombre="add-linear" size={22} color={colors.sobrePrimario} />
          <Text style={estilos.textoFab}>Agregar</Text>
        </Pressable>
      )}

      <AgregarIngredienteModal
        visible={agregando}
        onCerrar={() => setAgregando(false)}
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
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  lista: {
    paddingBottom: 130,
    flexGrow: 1,
  },
  superior: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: espaciado.md,
  },
  botonAtras: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contador: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.base,
    color: colors.textoSuave,
  },
  titulo: {
    fontFamily: fuentes.titulo,
    fontSize: 31,
    lineHeight: 39,
    color: colors.texto,
    paddingHorizontal: espaciado.md,
    marginTop: espaciado.sm,
    marginBottom: espaciado.md,
  },
  buscador: {
    paddingHorizontal: espaciado.md,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.destacadoSuave,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: espaciado.md,
    marginTop: espaciado.md,
  },
  textoAviso: {
    flex: 1,
    fontFamily: fuentes.regular,
    fontSize: tamanos.base,
    lineHeight: 20,
    color: colors.destacadoOscuro,
  },
  textoAvisoFuerte: {
    fontFamily: fuentes.negrita,
  },
  verAviso: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.base,
    color: colors.destacadoOscuro,
  },
  encabezadoSeccion: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: espaciado.md,
    marginTop: espaciado.lg,
    marginBottom: espaciado.sm,
  },
  tituloSeccion: {
    fontFamily: fuentes.titulo,
    fontSize: 20,
    lineHeight: 27,
    color: colors.texto,
  },
  fila: {
    paddingHorizontal: espaciado.md,
  },
  esqueletos: {
    paddingHorizontal: espaciado.md,
    marginTop: espaciado.lg,
  },
  fab: {
    position: 'absolute',
    right: espaciado.md,
    bottom: espaciado.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 56,
    paddingHorizontal: 22,
    borderRadius: radios.pill,
    backgroundColor: colors.primario,
    shadowColor: colors.primario,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  textoFab: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.sobrePrimario,
  },
});
