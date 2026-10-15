import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RecetaRecetario, useRecetario } from '../hooks/useRecetario';
import { SearchBar } from '../components/SearchBar';
import { VistaError } from '../components/StateViews';
import { Esqueleto } from '../components/Esqueleto';
import Icono, { NombreIcono } from '../components/Icono';
import { TarjetaRecetario } from '../components/recetario/TarjetaRecetario';
import { HojaColeccion } from '../components/recetario/HojaColeccion';
import { HojaFiltros, OrdenRecetario } from '../components/recetario/HojaFiltros';
import { HojaAgregarSemana } from '../components/receta/HojaAgregarSemana';
import { EstadoVacio } from '../components/EstadoVacio';
import { normalizar } from '../constants/categorias';
import { colors, espaciado, fuentes, radios, tamanos } from '../theme/theme';

type Seleccion = 'todas' | 'tengo' | number;

const IMAGEN_SIN_RESULTADOS = require('../assets/images/vacios/olla_vacia.webp');
const IMAGEN_SIN_RECETAS = require('../assets/images/vacios/sarten_vacio.webp');

const ICONOS_CATEGORIA: [string[], NombreIcono, string, string][] = [
  [['econom', 'barat'], 'wallet-money-linear', colors.calidoSuave, colors.calidoIntenso],
  [['rendid', 'familia'], 'users-group-rounded-linear', colors.serenoSuave, colors.serenoIntenso],
  [['rapid', 'express'], 'stopwatch-linear', colors.resaltadoSuave, colors.calidoOscuro],
  [['sin estufa', 'sin fuego', 'frio', 'fria'], 'snowflake-linear', colors.serenoSuave, colors.serenoIntenso],
  [['desayuno'], 'sun-linear', colors.resaltadoSuave, colors.calidoOscuro],
  [['cena'], 'moon-linear', colors.serenoSuave, colors.serenoIntenso],
  [['bebida', 'agua', 'licuado'], 'tea-cup-linear', colors.destacadoSuave, colors.destacadoIntenso],
  [['postre', 'dulce'], 'donut-linear', colors.destacadoSuave, colors.destacadoIntenso],
  [['verdura', 'vegetar', 'vegan'], 'leaf-linear', colors.acentoSuave, colors.acentoIntenso],
  [['saludable', 'nutrit', 'ligera'], 'health-linear', colors.acentoSuave, colors.acentoIntenso],
  [['estufa', 'caliente', 'sopa', 'guiso'], 'fire-linear', colors.destacadoSuave, colors.destacadoIntenso],
];

function estiloCategoria(nombre: string) {
  const n = normalizar(nombre);
  const encontrado = ICONOS_CATEGORIA.find(([claves]) => claves.some((c) => n.includes(c)));
  if (encontrado) return { icono: encontrado[1], fondo: encontrado[2], color: encontrado[3] };
  return { icono: 'tag-linear' as NombreIcono, fondo: colors.acentoSuave, color: colors.acentoIntenso };
}

export function RecetarioScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const busquedaInicial: string = route.params?.busquedaInicial ?? '';
  const [busqueda, setBusqueda] = useState(busquedaInicial);
  const [versionBuscador, setVersionBuscador] = useState(0);
  const { recetas, alacenaVacia, cargando, error, recargar } = useRecetario(busqueda);

  const [seleccion, setSeleccion] = useState<Seleccion>('todas');
  const [tiempoMaximo, setTiempoMaximo] = useState<number | null>(null);
  const [orden, setOrden] = useState<OrdenRecetario>('nombre');
  const [hoja, setHoja] = useState<'filtros' | 'coleccion' | 'semana' | null>(null);
  const [recetaActiva, setRecetaActiva] = useState<RecetaRecetario | null>(null);
  const [refrescando, setRefrescando] = useState(false);

  useEffect(() => {
    setBusqueda(busquedaInicial);
    setVersionBuscador((v) => v + 1);
  }, [busquedaInicial]);

  const categorias = useMemo(() => {
    const vistas = new Map<number, string>();
    recetas.forEach((r) => r.etiquetas.forEach((e) => vistas.set(e.id, e.nombre)));
    return [...vistas.entries()]
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }, [recetas]);

  const recetasFiltradas = useMemo(() => {
    let lista = [...recetas];
    if (seleccion === 'tengo') lista = lista.filter((r) => r.faltan === 0);
    else if (typeof seleccion === 'number') lista = lista.filter((r) => r.etiquetas.some((e) => e.id === seleccion));
    if (tiempoMaximo !== null) lista = lista.filter((r) => r.tiempo_min <= tiempoMaximo);

    if (orden === 'tiempo') lista.sort((a, b) => a.tiempo_min - b.tiempo_min);
    else if (orden === 'alacena') lista.sort((a, b) => (a.faltan ?? 99) - (b.faltan ?? 99));
    else lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    return lista;
  }, [recetas, seleccion, tiempoMaximo, orden]);

  const filtrosActivos = tiempoMaximo !== null || orden !== 'nombre';

  const tituloSeccion =
    seleccion === 'todas'
      ? busqueda.trim()
        ? `Resultados para «${busqueda.trim()}»`
        : 'Todas las recetas'
      : seleccion === 'tengo'
        ? 'Con lo que tengo'
        : categorias.find((c) => c.id === seleccion)?.nombre ?? 'Recetas';

  function limpiarBusqueda() {
    setBusqueda('');
    setVersionBuscador((v) => v + 1);
  }

  function limpiarTodo() {
    limpiarBusqueda();
    setSeleccion('todas');
    setTiempoMaximo(null);
    setOrden('nombre');
  }

  async function refrescar() {
    setRefrescando(true);
    try {
      await recargar();
    } finally {
      setRefrescando(false);
    }
  }

  function abrirHoja(tipo: 'coleccion' | 'semana', receta: RecetaRecetario) {
    setRecetaActiva(receta);
    setHoja(tipo);
  }

  const opciones: { clave: Seleccion; nombre: string; icono: NombreIcono; fondo: string; color: string }[] = [
    { clave: 'todas', nombre: 'Todas', icono: 'widget-linear', fondo: colors.superficie, color: colors.textoSuave },
    ...(alacenaVacia
      ? []
      : [{ clave: 'tengo' as Seleccion, nombre: 'Con lo que tengo', icono: 'check-circle-linear' as NombreIcono, fondo: colors.acentoSuave, color: colors.acentoIntenso }]),
    ...categorias.map((c) => ({ clave: c.id as Seleccion, nombre: c.nombre, ...estiloCategoria(c.nombre) })),
  ];

  const encabezado = (
    <View>
      <View style={[estilos.superior, { paddingTop: insets.top + espaciado.sm }]}>
        <Pressable onPress={() => navigation.goBack()} style={estilos.botonAtras} accessibilityLabel="Regresar">
          <Icono nombre="arrow-left-linear" size={22} color={colors.texto} />
        </Pressable>
        {!cargando && (
          <Text style={estilos.contador}>
            {recetas.length} {recetas.length === 1 ? 'receta' : 'recetas'}
          </Text>
        )}
      </View>

      <Text style={estilos.titulo}>Recetario</Text>

      <View style={estilos.filaBuscador}>
        <View style={{ flex: 1 }}>
          <SearchBar key={versionBuscador} valorInicial={busqueda} placeholder="Busca una receta" onBuscar={setBusqueda} />
        </View>
        <Pressable onPress={() => setHoja('filtros')} style={estilos.botonFiltro} accessibilityLabel="Filtrar recetas">
          <Icono nombre="tuning-2-linear" size={22} color={colors.sobreEncabezado} />
          {filtrosActivos && <View style={estilos.puntoFiltro} />}
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.categorias}>
        {opciones.map((o) => {
          const activa = seleccion === o.clave;
          return (
            <Pressable
              key={String(o.clave)}
              onPress={() => setSeleccion(o.clave)}
              style={estilos.categoria}
              accessibilityRole="button"
              accessibilityState={{ selected: activa }}
            >
              <View style={[estilos.circulo, { backgroundColor: activa ? colors.encabezado : o.fondo }]}>
                <Icono nombre={o.icono} size={24} color={activa ? colors.sobreEncabezado : o.color} />
              </View>
              <Text style={[estilos.nombreCategoria, activa && estilos.nombreCategoriaActiva]} numberOfLines={2}>
                {o.nombre}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={estilos.encabezadoSeccion}>
        <Text style={estilos.tituloSeccion} numberOfLines={1}>
          {tituloSeccion}
        </Text>
        {!cargando && <Text style={estilos.contador}>{recetasFiltradas.length}</Text>}
      </View>
    </View>
  );

  function vacio() {
    if (cargando) {
      return (
        <View style={estilos.esqueletos}>
          {[0, 1].map((i) => (
            <View key={i} style={{ marginBottom: espaciado.lg }}>
              <Esqueleto ancho="100%" alto={185} radio={radios.lg} />
              <Esqueleto ancho="60%" alto={20} estilo={{ marginTop: espaciado.sm }} />
              <Esqueleto ancho="40%" alto={14} estilo={{ marginTop: 6 }} />
            </View>
          ))}
        </View>
      );
    }
    if (error) return <VistaError mensaje={error} onReintentar={recargar} />;

    const conBusqueda = busqueda.trim().length > 0;
    return (
      <EstadoVacio
        imagen={conBusqueda ? IMAGEN_SIN_RESULTADOS : IMAGEN_SIN_RECETAS}
        titulo={conBusqueda ? `No encontramos «${busqueda.trim()}»` : 'Aún no hay recetas aquí'}
        texto={
          seleccion === 'tengo'
            ? 'Todavía no tienes todos los ingredientes de ninguna receta. Prueba con "Lo que más tengo" en los filtros.'
            : conBusqueda
              ? 'Revisa cómo está escrito o prueba con otra palabra.'
              : 'Prueba con otra categoría o quita algunos filtros.'
        }
        accion={{ texto: 'Ver todas las recetas', onPress: limpiarTodo }}
      />
    );
  }

  return (
    <View style={estilos.pantalla}>
      <FlatList
        data={cargando && recetas.length === 0 ? [] : recetasFiltradas}
        keyExtractor={(r) => String(r.id)}
        ListHeaderComponent={encabezado}
        ListEmptyComponent={vacio}
        contentContainerStyle={estilos.lista}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={colors.primario} colors={[colors.primario]} />
        }
        renderItem={({ item }) => (
          <TarjetaRecetario
            receta={item}
            onAbrir={() => navigation.navigate('RecetaDetalle', { recetaId: item.id })}
            onColeccion={() => abrirHoja('coleccion', item)}
            onSemana={() => abrirHoja('semana', item)}
          />
        )}
      />

      <HojaFiltros
        visible={hoja === 'filtros'}
        tiempoMaximo={tiempoMaximo}
        orden={orden}
        conAlacena={!alacenaVacia}
        onTiempo={setTiempoMaximo}
        onOrden={setOrden}
        onLimpiar={() => {
          setTiempoMaximo(null);
          setOrden('nombre');
        }}
        onCerrar={() => setHoja(null)}
      />
      <HojaColeccion visible={hoja === 'coleccion'} receta={recetaActiva} onCerrar={() => setHoja(null)} />
      {recetaActiva && (
        <HojaAgregarSemana
          visible={hoja === 'semana'}
          recetaId={recetaActiva.id}
          nombreReceta={recetaActiva.nombre}
          onCerrar={() => setHoja(null)}
        />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  lista: {
    paddingBottom: 120,
  },
  superior: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    marginTop: espaciado.md,
    marginBottom: espaciado.md,
  },
  filaBuscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
    paddingHorizontal: espaciado.md,
  },
  botonFiltro: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.encabezado,
    alignItems: 'center',
    justifyContent: 'center',
  },
  puntoFiltro: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.resaltado,
    borderWidth: 1.5,
    borderColor: colors.encabezado,
  },
  categorias: {
    gap: espaciado.sm,
    paddingHorizontal: espaciado.md,
    paddingTop: espaciado.lg,
  },
  categoria: {
    width: 78,
    alignItems: 'center',
  },
  circulo: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  nombreCategoria: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.chico,
    lineHeight: 17,
    color: colors.textoSuave,
    textAlign: 'center',
  },
  nombreCategoriaActiva: {
    fontFamily: fuentes.negrita,
    color: colors.texto,
  },
  encabezadoSeccion: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: espaciado.sm,
    paddingHorizontal: espaciado.md,
    marginTop: espaciado.lg,
    marginBottom: espaciado.md,
  },
  tituloSeccion: {
    flex: 1,
    fontFamily: fuentes.titulo,
    fontSize: 20,
    lineHeight: 27,
    color: colors.texto,
  },
  esqueletos: {
    paddingHorizontal: espaciado.md,
  },
});
