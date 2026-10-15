import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAlbums } from '../hooks/useAlbums';
import { RecetaGuardada, useRecetasGuardadas } from '../hooks/useRecetasGuardadas';
import { SearchBar } from '../components/SearchBar';
import { Esqueleto } from '../components/Esqueleto';
import { VistaError } from '../components/StateViews';
import { EstadoVacio } from '../components/EstadoVacio';
import Icono, { NombreIcono } from '../components/Icono';
import { CollageAlbum } from '../components/favoritos/CollageAlbum';
import { TarjetaAlbumReceta } from '../components/favoritos/TarjetaAlbumReceta';
import { HojaNombreColeccion } from '../components/favoritos/HojaNombreColeccion';
import { AlbumConConteo } from '../types/database';
import { colors, espaciado, fuentes, radios, tamanos } from '../theme/theme';

type Estilo = { icono: NombreIcono; fondo: string; color: string };

const ESTILO_ALBUM: Record<string, Estilo> = {
  favoritos: { icono: 'heart-linear', fondo: colors.destacadoSuave, color: colors.destacadoIntenso },
  hacer_despues: { icono: 'clock-circle-linear', fondo: colors.resaltadoSuave, color: colors.calidoOscuro },
  ya_preparadas: { icono: 'check-circle-linear', fondo: colors.acentoSuave, color: colors.acentoIntenso },
  propio: { icono: 'folder-linear', fondo: colors.calidoSuave, color: colors.calidoIntenso },
};

export function nombreVisible(album: AlbumConConteo) {
  if (album.tipo === 'ya_preparadas') return 'Recetas pasadas';
  if (album.tipo === 'hacer_despues') return 'Hacer después';
  if (album.tipo === 'favoritos') return 'Favoritos';
  return album.nombre;
}

export function FavoritosScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const { albumes, cargando, error, recargar, crearAlbum } = useAlbums();
  const idsAlbumes = useMemo(() => albumes.map((a) => a.id), [albumes]);
  const { porAlbum, recargar: recargarRecetas } = useRecetasGuardadas(idsAlbumes);

  const [busqueda, setBusqueda] = useState('');
  const [creando, setCreando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [refrescando, setRefrescando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      recargar();
      recargarRecetas();
    }, [recargar, recargarRecetas])
  );

  const buscar = (tipo: string) => albumes.find((a) => a.tipo === tipo);
  const favoritos = buscar('favoritos');
  const despues = buscar('hacer_despues');
  const preparadas = buscar('ya_preparadas');
  const propias = albumes.filter((a) => a.tipo === 'propio');

  const resultados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return [];
    const vistas = new Map<number, { receta: RecetaGuardada; albumes: string[] }>();
    albumes.forEach((album) => {
      (porAlbum[album.id] ?? []).forEach((r) => {
        if (!r.nombre.toLowerCase().includes(texto)) return;
        const actual = vistas.get(r.id) ?? { receta: r, albumes: [] };
        actual.albumes.push(nombreVisible(album));
        vistas.set(r.id, actual);
      });
    });
    return [...vistas.values()];
  }, [busqueda, albumes, porAlbum]);

  function abrir(album: AlbumConConteo, abrirSelector = false) {
    navigation.navigate('ColeccionDetalle', {
      albumId: album.id,
      nombre: nombreVisible(album),
      tipo: album.tipo,
      abrirSelector,
    });
  }

  async function crear(nombre: string) {
    setGuardando(true);
    const album = await crearAlbum(nombre);
    setGuardando(false);
    if (album) {
      setCreando(false);
      navigation.navigate('ColeccionDetalle', {
        albumId: album.id,
        nombre: album.nombre,
        tipo: 'propio',
        abrirSelector: true,
      });
    }
  }

  async function refrescar() {
    setRefrescando(true);
    try {
      await Promise.all([recargar(), recargarRecetas()]);
    } finally {
      setRefrescando(false);
    }
  }

  function collage(album: AlbumConConteo | undefined, alto: number) {
    if (!album) return null;
    const estilo = ESTILO_ALBUM[album.tipo] ?? ESTILO_ALBUM.propio;
    const fotos = (porAlbum[album.id] ?? []).filter((r) => r.foto_url).slice(0, 3).map((r) => r.foto_url);
    return (
      <CollageAlbum
        nombre={nombreVisible(album)}
        cantidad={album.cantidad_recetas}
        fotos={fotos}
        alto={alto}
        {...estilo}
        onPress={() => abrir(album)}
      />
    );
  }

  return (
    <View style={estilos.pantalla}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[estilos.contenido, { paddingTop: insets.top + espaciado.sm }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={colors.primario} colors={[colors.primario]} />
        }
      >
        <View style={estilos.superior}>
          <Pressable onPress={() => navigation.goBack()} style={estilos.botonBlanco} accessibilityLabel="Regresar">
            <Icono nombre="arrow-left-linear" size={22} color={colors.texto} />
          </Pressable>
          <Pressable
            onPress={() => favoritos && abrir(favoritos, true)}
            style={estilos.botonVerde}
            accessibilityLabel="Agregar recetas a favoritos"
          >
            <Icono nombre="add-linear" size={22} color={colors.sobreEncabezado} />
          </Pressable>
        </View>

        <Text style={estilos.titulo}>Mis recetas</Text>
        <Text style={estilos.descripcion}>Guarda tus recetas y ordénalas en colecciones.</Text>

        <View style={estilos.buscador}>
          <SearchBar placeholder="Busca en tus recetas" onBuscar={setBusqueda} />
        </View>

        {busqueda.trim() ? (
          <View style={{ marginTop: espaciado.lg }}>
            <Text style={[estilos.tituloSeccion, estilos.margen, { marginBottom: espaciado.lg }]}>
              {resultados.length} {resultados.length === 1 ? 'resultado' : 'resultados'}
            </Text>
            {resultados.length === 0 ? (
              <EstadoVacio
                imagen={require('../assets/images/vacios/olla_vacia.webp')}
                titulo={`No tienes guardada «${busqueda.trim()}»`}
                texto="Búscala en el recetario y guárdala con la estrella."
                accion={{ texto: 'Ir al recetario', onPress: () => navigation.navigate('Recetario') }}
              />
            ) : (
              resultados.map(({ receta, albumes: en }, i) => (
                <TarjetaAlbumReceta
                  key={receta.id}
                  receta={receta}
                  indice={i}
                  detalle={en.join(', ')}
                  onAbrir={() => navigation.navigate('RecetaDetalle', { recetaId: receta.id })}
                />
              ))
            )}
          </View>
        ) : cargando && albumes.length === 0 ? (
          <View style={estilos.margen}>
            <Esqueleto ancho="100%" alto={150} radio={18} estilo={{ marginTop: espaciado.lg }} />
            <View style={estilos.fila}>
              <Esqueleto ancho="48%" alto={110} radio={18} />
              <Esqueleto ancho="48%" alto={110} radio={18} />
            </View>
          </View>
        ) : error && albumes.length === 0 ? (
          <VistaError mensaje="No pudimos cargar tus recetas guardadas." onReintentar={recargar} />
        ) : (
          <>
            <View style={[estilos.margen, { marginTop: espaciado.lg }]}>{collage(favoritos, 150)}</View>
            <View style={[estilos.fila, estilos.margen]}>
              <View style={estilos.mitad}>{collage(despues, 110)}</View>
              <View style={estilos.mitad}>{collage(preparadas, 110)}</View>
            </View>

            <View style={[estilos.encabezadoSeccion, estilos.margen]}>
              <Text style={estilos.tituloSeccion}>Mis colecciones</Text>
              <Pressable onPress={() => setCreando(true)} hitSlop={10} style={estilos.crear}>
                <Icono nombre="add-linear" size={16} color={colors.acentoIntenso} />
                <Text style={estilos.textoCrear}>Crear</Text>
              </Pressable>
            </View>

            <View style={[estilos.cuadricula, estilos.margen]}>
              {propias.map((album) => (
                <View key={album.id} style={estilos.mitad}>
                  {collage(album, 110)}
                </View>
              ))}
              <Pressable onPress={() => setCreando(true)} style={[estilos.mitad, estilos.nueva]}>
                <Icono nombre="add-folder-linear" size={28} color={colors.textoSuave} />
                <Text style={estilos.textoNueva}>Nueva colección</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      <HojaNombreColeccion
        visible={creando}
        titulo="Nueva colección"
        textoBoton="Crear"
        guardando={guardando}
        error={error}
        onGuardar={crear}
        onCerrar={() => setCreando(false)}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  contenido: {
    paddingBottom: 120,
  },
  margen: {
    paddingHorizontal: espaciado.md,
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
  botonVerde: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.encabezado,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontFamily: fuentes.titulo,
    fontSize: 31,
    lineHeight: 39,
    color: colors.texto,
    paddingHorizontal: espaciado.md,
    marginTop: espaciado.md,
  },
  descripcion: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.cuerpo,
    lineHeight: 22,
    color: colors.textoSuave,
    paddingHorizontal: espaciado.md,
    marginTop: 2,
  },
  buscador: {
    paddingHorizontal: espaciado.md,
    marginTop: espaciado.md,
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: espaciado.md,
  },
  mitad: {
    width: '48%',
  },
  encabezadoSeccion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: espaciado.lg,
    marginBottom: espaciado.sm,
  },
  tituloSeccion: {
    fontFamily: fuentes.titulo,
    fontSize: 20,
    lineHeight: 27,
    color: colors.texto,
    marginBottom: espaciado.sm,
  },
  crear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  textoCrear: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.cuerpo,
    color: colors.acentoIntenso,
  },
  cuadricula: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: espaciado.md,
  },
  nueva: {
    height: 110,
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.textoTenue,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  textoNueva: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.chico,
    color: colors.textoSuave,
  },
});
