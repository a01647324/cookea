import React, { useMemo, useState } from 'react';
import { FlatList, ImageSourcePropType, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAlbumRecipes } from '../hooks/useAlbumRecipes';
import { useAccionesAlbum } from '../hooks/useAccionesAlbum';
import { SearchBar } from '../components/SearchBar';
import { Esqueleto } from '../components/Esqueleto';
import { VistaError } from '../components/StateViews';
import { EstadoVacio } from '../components/EstadoVacio';
import { MenuHoja } from '../components/MenuHoja';
import { ConfirmarHoja } from '../components/ConfirmarHoja';
import Icono, { NombreIcono } from '../components/Icono';
import { TarjetaAlbumReceta } from '../components/favoritos/TarjetaAlbumReceta';
import { HojaSelectorRecetas } from '../components/favoritos/HojaSelectorRecetas';
import { HojaNombreColeccion } from '../components/favoritos/HojaNombreColeccion';
import { RecetaResumen, TipoAlbum } from '../types/database';
import { colors, espaciado, fuentes, radios, tamanos } from '../theme/theme';

type Hoja = 'selector' | 'menu' | 'renombrar' | 'eliminar' | 'quitar' | null;

const CONFIG: Record<
  TipoAlbum,
  {
    icono: NombreIcono;
    fondo: string;
    color: string;
    imagen: ImageSourcePropType;
    vacioTitulo: string;
    vacioTexto: string;
    descripcion?: string;
  }
> = {
  favoritos: {
    imagen: require('../assets/images/vacios/canasta_vacia.webp'),
    icono: 'heart-linear',
    fondo: colors.destacadoSuave,
    color: colors.destacadoIntenso,
    vacioTitulo: 'Aún no tienes favoritas',
    vacioTexto: 'Toca la estrella en cualquier receta para guardarla aquí.',
  },
  hacer_despues: {
    imagen: require('../assets/images/vacios/reloj_cocina.webp'),
    icono: 'clock-circle-linear',
    fondo: colors.resaltadoSuave,
    color: colors.calidoOscuro,
    vacioTitulo: 'Nada pendiente por ahora',
    vacioTexto: 'Usa «Después» en el recetario para guardar lo que quieras cocinar pronto.',
  },
  ya_preparadas: {
    imagen: require('../assets/images/vacios/plato_limpio.webp'),
    icono: 'check-circle-linear',
    fondo: colors.acentoSuave,
    color: colors.acentoIntenso,
    vacioTitulo: 'Todavía no has preparado recetas',
    vacioTexto: 'Cuando cocines una receta, toca «Ya la preparé» y aparecerá aquí.',
    descripcion: 'Aquí aparecen las recetas que ya preparaste.',
  },
  propio: {
    imagen: require('../assets/images/vacios/caja_recetas.webp'),
    icono: 'folder-linear',
    fondo: colors.calidoSuave,
    color: colors.calidoIntenso,
    vacioTitulo: 'Esta colección está vacía',
    vacioTexto: 'Agrega las recetas que quieras tener juntas.',
  },
};

export function ColeccionDetalleScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const { albumId, tipo, abrirSelector = false } = route.params as {
    albumId: number;
    nombre: string;
    tipo: TipoAlbum;
    abrirSelector?: boolean;
  };
  const config = CONFIG[tipo] ?? CONFIG.propio;
  const esHistorial = tipo === 'ya_preparadas';
  const esPropia = tipo === 'propio';

  const { recetas, cargando, error, recargar, agregarReceta, quitarReceta } = useAlbumRecipes(albumId);
  const acciones = useAccionesAlbum(albumId);

  const [nombre, setNombre] = useState<string>(route.params.nombre);
  const [hoja, setHoja] = useState<Hoja>(abrirSelector && !esHistorial ? 'selector' : null);
  const [buscando, setBuscando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [porQuitar, setPorQuitar] = useState<RecetaResumen | null>(null);
  const [quitando, setQuitando] = useState(false);
  const [refrescando, setRefrescando] = useState(false);

  const idsEnAlbum = useMemo(() => new Set(recetas.map((r) => r.id)), [recetas]);
  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return texto ? recetas.filter((r) => r.nombre.toLowerCase().includes(texto)) : recetas;
  }, [recetas, busqueda]);

  function cambiarHoja(siguiente: Hoja) {
    setHoja(null);
    setTimeout(() => setHoja(siguiente), 300);
  }

  async function confirmarQuitar() {
    if (!porQuitar) return;
    setQuitando(true);
    await quitarReceta(porQuitar.id);
    setQuitando(false);
    setPorQuitar(null);
    setHoja(null);
  }

  async function renombrar(nuevo: string) {
    if (await acciones.renombrar(nuevo)) {
      setNombre(nuevo.trim());
      setHoja(null);
    }
  }

  async function eliminar() {
    if (await acciones.eliminar()) {
      setHoja(null);
      navigation.goBack();
    }
  }

  async function refrescar() {
    setRefrescando(true);
    try {
      await recargar();
    } finally {
      setRefrescando(false);
    }
  }

  const encabezado = (
    <View style={{ paddingBottom: espaciado.lg }}>
      <View style={[estilos.superior, { paddingTop: insets.top + espaciado.sm }]}>
        <Pressable onPress={() => navigation.goBack()} style={estilos.botonBlanco} accessibilityLabel="Regresar">
          <Icono nombre="arrow-left-linear" size={22} color={colors.texto} />
        </Pressable>
        {esPropia && (
          <Pressable onPress={() => setHoja('menu')} style={estilos.botonBlanco} accessibilityLabel="Opciones de la colección">
            <Icono nombre="menu-dots-linear" size={22} color={colors.texto} />
          </Pressable>
        )}
      </View>

      <View style={estilos.titular}>
        <View style={[estilos.circulo, { backgroundColor: config.fondo }]}>
          <Icono nombre={config.icono} size={24} color={config.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={estilos.titulo} numberOfLines={2}>
            {nombre}
          </Text>
          <Text style={estilos.cantidad}>
            {recetas.length} {recetas.length === 1 ? 'receta' : 'recetas'}
          </Text>
        </View>
      </View>
      {!!config.descripcion && <Text style={estilos.descripcion}>{config.descripcion}</Text>}

      {recetas.length > 0 && (
        <View style={estilos.botones}>
          {!esHistorial && (
            <Pressable onPress={() => setHoja('selector')} style={estilos.botonAgregar}>
              <Icono nombre="add-linear" size={20} color={colors.sobreEncabezado} />
              <Text style={estilos.textoAgregar}>Agregar recetas</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => {
              setBuscando((v) => !v);
              setBusqueda('');
            }}
            style={[estilos.botonBuscar, buscando && estilos.botonBuscarActivo, esHistorial && { flex: 1 }]}
            accessibilityLabel="Buscar en este álbum"
          >
            <Icono nombre={buscando ? 'close-linear' : 'magnifer-linear'} size={20} color={colors.texto} />
            {esHistorial && <Text style={estilos.textoBuscar}>{buscando ? 'Cerrar búsqueda' : 'Buscar'}</Text>}
          </Pressable>
        </View>
      )}

      {buscando && (
        <View style={estilos.buscador}>
          <SearchBar placeholder={`Busca en ${nombre}`} onBuscar={setBusqueda} />
        </View>
      )}
    </View>
  );

  function vacio() {
    if (cargando) {
      return (
        <View style={{ paddingHorizontal: espaciado.md }}>
          {[0, 1, 2].map((i) => (
            <Esqueleto key={i} ancho="100%" alto={96} radio={22} estilo={{ marginBottom: espaciado.md }} />
          ))}
        </View>
      );
    }
    if (error) return <VistaError mensaje="No pudimos cargar las recetas de este álbum." onReintentar={recargar} />;
    if (busqueda.trim()) {
      return (
        <EstadoVacio
          imagen={require('../assets/images/vacios/olla_vacia.webp')}
          titulo={`No encontramos «${busqueda.trim()}»`}
          texto="Prueba con otra palabra."
        />
      );
    }
    return (
      <EstadoVacio
        imagen={config.imagen}
        titulo={config.vacioTitulo}
        texto={config.vacioTexto}
        accion={
          esHistorial
            ? { texto: 'Ir al recetario', onPress: () => navigation.navigate('Recetario') }
            : { texto: 'Agregar recetas', onPress: () => setHoja('selector') }
        }
      />
    );
  }

  return (
    <View style={estilos.pantalla}>
      <FlatList
        data={cargando && recetas.length === 0 ? [] : visibles}
        keyExtractor={(r) => String(r.id)}
        ListHeaderComponent={encabezado}
        ListEmptyComponent={vacio}
        contentContainerStyle={estilos.lista}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={colors.primario} colors={[colors.primario]} />
        }
        renderItem={({ item, index }) => (
          <TarjetaAlbumReceta
            receta={item}
            indice={index}
            onAbrir={() => navigation.navigate('RecetaDetalle', { recetaId: item.id })}
            onQuitar={() => {
              setPorQuitar(item);
              setHoja('quitar');
            }}
          />
        )}
      />

      <HojaSelectorRecetas
        visible={hoja === 'selector'}
        nombreAlbum={nombre}
        idsEnAlbum={idsEnAlbum}
        onAgregar={agregarReceta}
        onCerrar={() => setHoja(null)}
      />
      <MenuHoja
        visible={hoja === 'menu'}
        titulo={nombre}
        opciones={[
          { texto: 'Cambiar nombre', icono: 'create-outline', onPress: () => cambiarHoja('renombrar') },
          {
            texto: 'Eliminar colección',
            descripcion: 'Las recetas no se borran, solo esta colección.',
            icono: 'trash-outline',
            peligro: true,
            onPress: () => cambiarHoja('eliminar'),
          },
        ]}
        onCerrar={() => setHoja(null)}
      />
      <HojaNombreColeccion
        visible={hoja === 'renombrar'}
        titulo="Cambiar nombre"
        textoBoton="Guardar"
        nombreInicial={nombre}
        guardando={acciones.ocupado}
        error={acciones.error}
        onGuardar={renombrar}
        onCerrar={() => {
          acciones.limpiarError();
          setHoja(null);
        }}
      />
      <ConfirmarHoja
        visible={hoja === 'eliminar'}
        titulo="¿Eliminar esta colección?"
        mensaje={acciones.error ?? `"${nombre}" desaparecerá, pero sus recetas seguirán en el recetario.`}
        textoConfirmar="Eliminar"
        cargando={acciones.ocupado}
        onConfirmar={eliminar}
        onCerrar={() => {
          acciones.limpiarError();
          setHoja(null);
        }}
      />
      <ConfirmarHoja
        visible={hoja === 'quitar'}
        titulo="¿Quitar esta receta?"
        mensaje={porQuitar ? `${porQuitar.nombre} saldrá de "${nombre}". Puedes volver a agregarla cuando quieras.` : ''}
        textoConfirmar="Quitar"
        icono="remove-circle-outline"
        cargando={quitando}
        onConfirmar={confirmarQuitar}
        onCerrar={() => {
          setPorQuitar(null);
          setHoja(null);
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
    paddingBottom: 120,
  },
  superior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: espaciado.md,
  },
  botonBlanco: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titular: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
    paddingHorizontal: espaciado.md,
    marginTop: espaciado.md,
  },
  circulo: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontFamily: fuentes.titulo,
    fontSize: 27,
    lineHeight: 34,
    color: colors.texto,
  },
  cantidad: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.base,
    color: colors.textoSuave,
  },
  descripcion: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.cuerpo,
    lineHeight: 22,
    color: colors.textoSuave,
    paddingHorizontal: espaciado.md,
    marginTop: espaciado.sm,
  },
  botones: {
    flexDirection: 'row',
    gap: espaciado.sm,
    paddingHorizontal: espaciado.md,
    marginTop: espaciado.md,
  },
  botonAgregar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 50,
    borderRadius: radios.pill,
    backgroundColor: colors.encabezado,
  },
  textoAgregar: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.cuerpo,
    color: colors.sobreEncabezado,
  },
  botonBuscar: {
    minWidth: 50,
    minHeight: 50,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: espaciado.sm,
    borderRadius: radios.pill,
    borderWidth: 1.5,
    borderColor: colors.borde,
    backgroundColor: colors.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonBuscarActivo: {
    backgroundColor: colors.resaltadoSuave,
    borderColor: colors.resaltado,
  },
  textoBuscar: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.cuerpo,
    color: colors.texto,
  },
  buscador: {
    paddingHorizontal: espaciado.md,
    marginTop: espaciado.sm,
  },
});

