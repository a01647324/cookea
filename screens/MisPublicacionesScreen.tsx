import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import Icono from '../components/Icono';
import { MiPublicacion, useMisPublicaciones } from '../hooks/useMisPublicaciones';
import { MenuHoja, OpcionMenu } from '../components/MenuHoja';
import { ConfirmarHoja } from '../components/ConfirmarHoja';
import { VistaCargando, VistaError } from '../components/StateViews';
import { EstadoVacio } from '../components/EstadoVacio';
import { mostrarAviso } from '../lib/avisos';
import { colors, espaciado, fuentes, radios, sombra, tamanos } from '../theme/theme';

interface Props {
  onVolver: () => void;
  onAbrir: (id: number) => void;
  onEditar: (id: number) => void;
  onPublicar: () => void;
}

type Filtro = 'todas' | 'publicadas' | 'revision';

// Color de cada tarjeta (se van turnando) y el color del texto que se lee bien encima
const COLORES = [
  { fondo: colors.calido, texto: colors.texto },
  { fondo: colors.encabezado, texto: colors.sobreEncabezado },
  { fondo: colors.destacado, texto: colors.texto },
  { fondo: colors.serenoIntenso, texto: colors.sobrePrimario },
];

const ALTO_TARJETA = 140;

function haceCuanto(fecha: string) {
  const dias = Math.floor((Date.now() - new Date(fecha).getTime()) / 86400000);
  if (dias === 0) return 'hoy';
  if (dias === 1) return 'ayer';
  if (dias < 30) return `hace ${dias} días`;
  return new Date(fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

export default function MisPublicacionesScreen({ onVolver, onAbrir, onEditar, onPublicar }: Props) {
  const { recetas, cargando, refrescando, error, cargar, eliminar } = useMisPublicaciones();
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [seleccionada, setSeleccionada] = useState<MiPublicacion | null>(null);
  const [hoja, setHoja] = useState<'menu' | 'eliminar' | null>(null);
  const [eliminando, setEliminando] = useState(false);

  // Recarga cada vez que la pantalla vuelve a estar a la vista (por ejemplo, después de editar)
  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const publicadas = recetas.filter((r) => r.visible);
  const enRevision = recetas.filter((r) => !r.visible);
  const lista = filtro === 'publicadas' ? publicadas : filtro === 'revision' ? enRevision : recetas;

  const calificadas = publicadas.filter((r) => r.total > 0);
  const promedioGeneral = calificadas.length
    ? calificadas.reduce((suma, r) => suma + Number(r.promedio) * r.total, 0) /
      calificadas.reduce((suma, r) => suma + r.total, 0)
    : null;
  const totalComentarios = recetas.reduce((suma, r) => suma + r.comentarios, 0);

  const pestanas: { valor: Filtro; texto: string }[] = [
    { valor: 'todas', texto: `Todas (${recetas.length})` },
    { valor: 'publicadas', texto: `Publicadas (${publicadas.length})` },
    ...(enRevision.length > 0 ? [{ valor: 'revision' as Filtro, texto: `En revisión (${enRevision.length})` }] : []),
  ];

  const abrirMenu = (receta: MiPublicacion) => {
    setSeleccionada(receta);
    setHoja('menu');
  };

  const cambiarHoja = (siguiente: 'menu' | 'eliminar' | null) => {
    setHoja(null);
    setTimeout(() => setHoja(siguiente), 300);
  };

  const confirmarEliminar = async () => {
    if (!seleccionada) return;
    setEliminando(true);
    const ok = await eliminar(seleccionada);
    setEliminando(false);
    setHoja(null);
    if (ok) mostrarAviso('Receta eliminada', undefined, 'exito');
    else mostrarAviso('No pudimos eliminarla', 'Revisa tu conexión e intenta de nuevo.', 'error');
  };

  const opcionesMenu: OpcionMenu[] = seleccionada
    ? [
        {
          texto: 'Ver receta',
          icono: 'eye-linear',
          onPress: () => {
            setHoja(null);
            onAbrir(seleccionada.id);
          },
        },
        {
          texto: 'Editar receta',
          icono: 'pen-linear',
          onPress: () => {
            setHoja(null);
            onEditar(seleccionada.id);
          },
        },
        {
          texto: 'Eliminar receta',
          descripcion: 'Se borrará para todos',
          icono: 'trash-bin-trash-linear',
          peligro: true,
          onPress: () => cambiarHoja('eliminar'),
        },
      ]
    : [];

  const renderTarjeta = ({ item, index }: { item: MiPublicacion; index: number }) => {
    const oculta = !item.visible;
    const color = oculta ? { fondo: colors.fondoHundido, texto: colors.textoSuave } : COLORES[index % COLORES.length];

    return (
      <Pressable
        onPress={() => onAbrir(item.id)}
        style={({ pressed }) => [estilos.tarjeta, { backgroundColor: color.fondo }, pressed && { opacity: 0.92 }]}
        accessibilityRole="button"
        accessibilityLabel={item.nombre}
      >
        <View style={[estilos.marcoFoto, oculta && estilos.fotoOculta]}>
          {item.foto_url ? (
            <Image
              source={{ uri: item.foto_url }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={estilos.fotoRespaldo}>
              <Icono nombre="chef-hat-linear" size={34} color={colors.superficie} />
            </View>
          )}
        </View>

        <View style={estilos.textos}>
          <Text style={[estilos.nombre, { color: color.texto }]} numberOfLines={2}>
            {item.nombre}
          </Text>

          {oculta ? (
            <View style={{ gap: 6 }}>
              <View style={estilos.pildoraRevision}>
                <Icono nombre="eye-closed-linear" size={14} color={colors.primario} />
                <Text style={estilos.textoRevision}>En revisión</Text>
              </View>
              <Text style={estilos.notaRevision} numberOfLines={2}>
                Oculta por reportes mientras la revisamos.
              </Text>
            </View>
          ) : (
            <View style={estilos.datos}>
              {item.total === 0 ? (
                <View style={estilos.pildoraNueva}>
                  <Text style={estilos.textoNueva}>Nueva</Text>
                </View>
              ) : (
                <View style={estilos.dato}>
                  <Icono nombre="star-bold" size={14} color={color.texto} />
                  <Text style={[estilos.textoDato, { color: color.texto }]}>
                    {item.promedio} ({item.total})
                  </Text>
                </View>
              )}
              <View style={estilos.dato}>
                <Icono nombre="chat-round-line-linear" size={14} color={color.texto} />
                <Text style={[estilos.textoDato, { color: color.texto }]}>{item.comentarios}</Text>
              </View>
              <Text style={[estilos.textoDato, { color: color.texto }]}>{haceCuanto(item.creado_en)}</Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={() => abrirMenu(item)}
          hitSlop={10}
          style={estilos.botonMenu}
          accessibilityRole="button"
          accessibilityLabel={`Opciones de ${item.nombre}`}
        >
          <Icono nombre="menu-dots-linear" size={18} color={colors.primario} />
        </Pressable>
      </Pressable>
    );
  };

  const encabezado = (
    <View style={estilos.encabezado}>
      <View style={estilos.barraSuperior}>
        <Pressable onPress={onVolver} hitSlop={6} style={estilos.botonCirculo} accessibilityRole="button" accessibilityLabel="Regresar">
          <Icono nombre="arrow-left-linear" size={22} color={colors.primario} />
        </Pressable>
        <Text style={estilos.titulo} accessibilityRole="header">
          Mis publicaciones
        </Text>
        <Pressable
          onPress={onPublicar}
          hitSlop={6}
          style={[estilos.botonCirculo, estilos.botonMas]}
          accessibilityRole="button"
          accessibilityLabel="Publicar receta"
        >
          <Icono nombre="add-linear" size={22} color={colors.sobrePrimario} />
        </Pressable>
      </View>

      {recetas.length > 0 && (
        <>
          <View style={estilos.resumen}>
            <View style={estilos.cuadro}>
              <Text style={estilos.numero}>{recetas.length}</Text>
              <Text style={estilos.etiquetaCuadro}>{recetas.length === 1 ? 'receta' : 'recetas'}</Text>
            </View>
            <View style={estilos.cuadro}>
              <Text style={estilos.numero}>{promedioGeneral != null ? promedioGeneral.toFixed(1) : '–'}</Text>
              <Text style={estilos.etiquetaCuadro}>promedio</Text>
            </View>
            <View style={estilos.cuadro}>
              <Text style={estilos.numero}>{totalComentarios}</Text>
              <Text style={estilos.etiquetaCuadro}>{totalComentarios === 1 ? 'comentario' : 'comentarios'}</Text>
            </View>
          </View>

          <View style={estilos.pestanas}>
            {pestanas.map((p) => {
              const activa = filtro === p.valor;
              return (
                <Pressable
                  key={p.valor}
                  onPress={() => setFiltro(p.valor)}
                  style={[estilos.pestana, activa && estilos.pestanaActiva]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activa }}
                >
                  <Text style={[estilos.textoPestana, activa && estilos.textoPestanaActiva]} numberOfLines={1}>
                    {p.texto}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </View>
  );

  if (cargando && recetas.length === 0) {
    return (
      <SafeAreaView style={estilos.pantalla} edges={['top']}>
        <VistaCargando mensaje="Cargando tus recetas..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={estilos.pantalla} edges={['top']}>
      <FlatList
        data={lista}
        keyExtractor={(r) => String(r.id)}
        renderItem={renderTarjeta}
        ListHeaderComponent={encabezado}
        ListEmptyComponent={
          error ? (
            <VistaError mensaje={error} onReintentar={() => cargar()} />
          ) : recetas.length === 0 ? (
            <EstadoVacio
              imagen={require('../assets/images/vacios/vitrina_vacia.webp')}
              titulo="Aún no compartes recetas"
              texto="Tu receta de familia puede ayudar a otras personas a cocinar con lo que tienen."
              accion={{ texto: 'Publicar mi primera receta', onPress: onPublicar }}
            />
          ) : (
            <EstadoVacio compacto icono="list-check-linear" titulo="No hay recetas en esta sección" />
          )
        }
        contentContainerStyle={estilos.lista}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => cargar(true)}
            colors={[colors.encabezado]}
            tintColor={colors.encabezado}
          />
        }
      />

      <MenuHoja
        visible={hoja === 'menu'}
        titulo={seleccionada?.nombre}
        opciones={opcionesMenu}
        onCerrar={() => setHoja(null)}
      />
      <ConfirmarHoja
        visible={hoja === 'eliminar'}
        titulo="¿Eliminar tu receta?"
        mensaje="Se borrarán también sus calificaciones y comentarios. No se puede deshacer."
        textoConfirmar="Eliminar"
        cargando={eliminando}
        onConfirmar={confirmarEliminar}
        onCerrar={() => setHoja(null)}
      />
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
    paddingBottom: espaciado.xl,
    gap: 14,
  },
  encabezado: {
    gap: espaciado.md,
    marginBottom: espaciado.xs,
  },
  barraSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: espaciado.sm,
  },
  botonCirculo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonMas: {
    backgroundColor: colors.primario,
  },
  titulo: {
    flex: 1,
    fontFamily: fuentes.titulo,
    fontSize: 22,
    lineHeight: 30,
    color: colors.primario,
    textAlign: 'center',
  },
  resumen: {
    flexDirection: 'row',
    gap: espaciado.sm,
  },
  cuadro: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.superficie,
    borderRadius: radios.md,
    paddingVertical: 12,
  },
  numero: {
    fontFamily: fuentes.titulo,
    fontSize: 22,
    lineHeight: 29,
    color: colors.texto,
  },
  etiquetaCuadro: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.chico,
    color: colors.textoSuave,
  },
  pestanas: {
    flexDirection: 'row',
    backgroundColor: colors.fondoHundido,
    borderRadius: radios.pill,
    padding: 5,
  },
  pestana: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    borderRadius: radios.pill,
    paddingHorizontal: 6,
  },
  pestanaActiva: {
    backgroundColor: colors.primario,
  },
  textoPestana: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.base,
    color: colors.textoSuave,
  },
  textoPestanaActiva: {
    color: colors.sobrePrimario,
  },
  tarjeta: {
    height: ALTO_TARJETA,
    borderRadius: 24,
    overflow: 'hidden',
    ...sombra,
  },
  marcoFoto: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 132,
    borderTopLeftRadius: ALTO_TARJETA / 2,
    borderBottomLeftRadius: ALTO_TARJETA / 2,
    overflow: 'hidden',
  },
  fotoRespaldo: {
    flex: 1,
    backgroundColor: colors.neutro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fotoOculta: {
    opacity: 0.45,
  },
  textos: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingLeft: espaciado.md,
    paddingRight: 146,
  },
  nombre: {
    fontFamily: fuentes.titulo,
    fontSize: 21,
    lineHeight: 27,
  },
  datos: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  dato: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  textoDato: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.chico,
  },
  pildoraNueva: {
    backgroundColor: colors.superficie,
    borderRadius: radios.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  textoNueva: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.mini,
    color: colors.texto,
  },
  pildoraRevision: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: colors.superficie,
    borderRadius: radios.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  textoRevision: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.chico,
    color: colors.primario,
  },
  notaRevision: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.chico,
    lineHeight: 18,
    color: colors.textoSuave,
  },
  botonMenu: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
