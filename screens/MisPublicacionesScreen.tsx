import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { MiPublicacion, useMisPublicaciones } from '../hooks/useMisPublicaciones';
import { MenuHoja, OpcionMenu } from '../components/MenuHoja';
import { ConfirmarHoja } from '../components/ConfirmarHoja';
import { VistaCargando, VistaError } from '../components/StateViews';
import { colors, espaciado, fuentes, radios, sombra, tamanos, tipografia } from '../theme/theme';

interface Props {
  onVolver: () => void;
  onAbrir: (id: number) => void;
  onEditar: (id: number) => void;
  onPublicar: () => void;
}

type Filtro = 'todas' | 'publicadas' | 'revision';

const FONDOS = [colors.calido, colors.acento];

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

  const pestanas: { valor: Filtro; texto: string; cantidad: number }[] = [
    { valor: 'todas', texto: 'Todas', cantidad: recetas.length },
    { valor: 'publicadas', texto: 'Publicadas', cantidad: publicadas.length },
    ...(enRevision.length > 0 ? [{ valor: 'revision' as Filtro, texto: 'En revisión', cantidad: enRevision.length }] : []),
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
    if (!ok) Alert.alert('No pudimos eliminarla', 'Revisa tu conexión e intenta de nuevo.');
  };

  const opcionesMenu: OpcionMenu[] = seleccionada
    ? [
        {
          texto: 'Ver receta',
          icono: 'eye-outline',
          onPress: () => {
            setHoja(null);
            onAbrir(seleccionada.id);
          },
        },
        {
          texto: 'Editar receta',
          icono: 'create-outline',
          onPress: () => {
            setHoja(null);
            onEditar(seleccionada.id);
          },
        },
        {
          texto: 'Eliminar receta',
          descripcion: 'Se borrará para todos',
          icono: 'trash-outline',
          peligro: true,
          onPress: () => cambiarHoja('eliminar'),
        },
      ]
    : [];

  const renderTarjeta = ({ item, index }: { item: MiPublicacion; index: number }) => {
    const oculta = !item.visible;
    const fondo = oculta ? colors.fondoHundido : FONDOS[index % FONDOS.length];
    const colorTexto = oculta ? colors.textoSuave : fondo === colors.acento ? colors.sobreAcento : colors.texto;

    return (
      <Pressable
        onPress={() => onAbrir(item.id)}
        style={({ pressed }) => [estilos.tarjeta, { backgroundColor: fondo }, pressed && { opacity: 0.92 }]}
      >
        {item.foto_url ? (
          <Image
            source={{ uri: item.foto_url }}
            style={[estilos.foto, oculta && estilos.fotoOculta]}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[estilos.foto, estilos.fotoRespaldo, oculta && estilos.fotoOculta]}>
            <Ionicons name="restaurant-outline" size={34} color={colors.superficieCalida} />
          </View>
        )}

        <View style={estilos.textos}>
          <Text style={[estilos.nombre, { color: colorTexto }]} numberOfLines={2}>
            {item.nombre}
          </Text>

          {oculta ? (
            <View style={{ gap: 6 }}>
              <View style={estilos.pildoraRevision}>
                <Ionicons name="eye-off-outline" size={13} color={colors.primario} />
                <Text style={estilos.textoRevision}>En revisión</Text>
              </View>
              <Text style={[tipografia.chico, { color: colors.textoSuave }]} numberOfLines={2}>
                Oculta por reportes mientras la revisamos.
              </Text>
            </View>
          ) : (
            <View style={estilos.datos}>
              {item.total === 0 ? (
                <>
                  <Ionicons name="sparkles" size={13} color={colorTexto} />
                  <Text style={[estilos.dato, { color: colorTexto }]}>Nueva</Text>
                </>
              ) : (
                <>
                  <Ionicons name="star" size={13} color={colorTexto} />
                  <Text style={[estilos.dato, { color: colorTexto }]}>
                    {item.promedio} ({item.total})
                  </Text>
                </>
              )}
              <Text style={[estilos.dato, { color: colorTexto }]}>·</Text>
              <Ionicons name="chatbubble-outline" size={13} color={colorTexto} />
              <Text style={[estilos.dato, { color: colorTexto }]}>{item.comentarios}</Text>
              <Text style={[estilos.dato, { color: colorTexto }]}>· {haceCuanto(item.creado_en)}</Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={() => abrirMenu(item)}
          hitSlop={10}
          style={estilos.botonMenu}
          accessibilityLabel={`Opciones de ${item.nombre}`}
        >
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.sobreAcento} />
        </Pressable>
      </Pressable>
    );
  };

  const encabezado = (
    <View style={estilos.encabezado}>
      <View style={estilos.barraSuperior}>
        <Pressable onPress={onVolver} hitSlop={10} accessibilityLabel="Regresar">
          <Ionicons name="arrow-back" size={24} color={colors.primario} />
        </Pressable>
        <Pressable onPress={onPublicar} style={estilos.botonMas} accessibilityLabel="Publicar receta">
          <Ionicons name="add" size={24} color={colors.sobrePrimario} />
        </Pressable>
      </View>

      <Text style={estilos.titulo}>Mis publicaciones</Text>
      {recetas.length > 0 && (
        <View style={estilos.resumen}>
          {promedioGeneral != null && (
            <>
              <Ionicons name="star" size={14} color={colors.calido} />
              <Text style={tipografia.chico}>{promedioGeneral.toFixed(1)} de promedio ·</Text>
            </>
          )}
          <Text style={tipografia.chico}>
            {totalComentarios} {totalComentarios === 1 ? 'comentario recibido' : 'comentarios recibidos'}
          </Text>
        </View>
      )}

      {recetas.length > 0 && (
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
                <Text style={[estilos.numeroPestana, activa && estilos.textoActivo]}>{p.cantidad}</Text>
                <Text style={[estilos.textoPestana, activa && estilos.textoActivo]}>{p.texto}</Text>
              </Pressable>
            );
          })}
        </View>
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
            <View style={estilos.vacio}>
              <View style={estilos.iconoVacio}>
                <Ionicons name="restaurant-outline" size={38} color={colors.textoSuave} />
              </View>
              <Text style={estilos.tituloVacio}>Aún no compartes recetas</Text>
              <Text style={estilos.textoVacio}>
                Tu receta de familia puede ayudar a otras personas a cocinar con lo que tienen.
              </Text>
              <Pressable onPress={onPublicar} style={estilos.botonVacio}>
                <Ionicons name="add" size={18} color={colors.sobrePrimario} />
                <Text style={estilos.textoBotonVacio}>Publicar mi primera receta</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={[tipografia.cuerpo, estilos.sinFiltro]}>No hay recetas en esta sección.</Text>
          )
        }
        contentContainerStyle={estilos.lista}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => cargar(true)}
            colors={[colors.acento]}
            tintColor={colors.acento}
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
    gap: espaciado.sm,
    marginBottom: espaciado.xs,
  },
  barraSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: espaciado.sm,
  },
  botonMas: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    ...tipografia.tituloGrande,
    color: colors.primario,
    marginTop: espaciado.xs,
  },
  resumen: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  pestanas: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.borde,
    marginTop: espaciado.sm,
  },
  pestana: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: espaciado.sm,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  pestanaActiva: {
    borderBottomColor: colors.acento,
  },
  numeroPestana: {
    fontFamily: fuentes.titulo,
    fontSize: 20,
    color: colors.textoTenue,
  },
  textoPestana: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.base,
    color: colors.textoTenue,
  },
  textoActivo: {
    color: colors.primario,
  },
  tarjeta: {
    height: 136,
    borderRadius: radios.lg,
    overflow: 'hidden',
    ...sombra,
  },
  foto: {
    position: 'absolute',
    right: -28,
    top: -8,
    width: 152,
    height: 152,
    borderRadius: 76,
  },
  fotoRespaldo: {
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
    paddingVertical: 14,
    paddingLeft: espaciado.md,
    paddingRight: 140,
  },
  nombre: {
    fontFamily: fuentes.titulo,
    fontSize: 20,
    lineHeight: 25,
  },
  datos: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  dato: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.chico,
  },
  pildoraRevision: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: colors.calidoSuave,
    borderRadius: radios.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  textoRevision: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.chico,
    color: colors.primario,
  },
  botonMenu: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.vidrio,
    borderWidth: 1,
    borderColor: colors.vidrioBorde,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vacio: {
    alignItems: 'center',
    gap: espaciado.sm,
    paddingTop: espaciado.xl,
    paddingHorizontal: espaciado.md,
  },
  iconoVacio: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.calidoSuave,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espaciado.xs,
  },
  tituloVacio: {
    ...tipografia.titulo,
    fontSize: 21,
    color: colors.primario,
    textAlign: 'center',
  },
  textoVacio: {
    ...tipografia.cuerpo,
    color: colors.textoSuave,
    textAlign: 'center',
  },
  botonVacio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primario,
    borderRadius: radios.pill,
    paddingHorizontal: 22,
    minHeight: 52,
    marginTop: espaciado.sm,
  },
  textoBotonVacio: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.sobrePrimario,
  },
  sinFiltro: {
    color: colors.textoSuave,
    textAlign: 'center',
    marginTop: espaciado.lg,
  },
});