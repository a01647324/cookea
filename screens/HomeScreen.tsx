import React, { useCallback, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useUserProfile } from '../hooks/useUserProfile';
import { useWeekPlan } from '../hooks/useWeekPlan';
import { useRecomendaciones } from '../hooks/useRecomendaciones';
import { useComunidad } from '../hooks/useComunidad';
import { SearchBar } from '../components/SearchBar';
import { EncabezadoSeccion } from '../components/EncabezadoSeccion';
import { Esqueleto } from '../components/Esqueleto';
import { VistaError } from '../components/StateViews';
import Icono from '../components/Icono';
import { TarjetaHoy } from '../components/inicio/TarjetaHoy';
import { Acceso, AccesosRapidos } from '../components/inicio/AccesosRapidos';
import { TipDelDia } from '../components/inicio/TipDelDia';
import { TarjetaComunidadMini } from '../components/inicio/TarjetaComunidadMini';
import { TarjetaRecomendada } from '../components/recomendador/tarjetaRecomendada';
import TarjetaPersonaliza from '../perfil/TarjetaPersonaliza';
import { colors, coloresTarjetaReceta, espaciado, fuentes, radios, tamanos } from '../theme/theme';

function iniciales(alias?: string | null) {
  if (!alias) return '';
  return alias.trim().slice(0, 2).toUpperCase();
}

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const { perfil, recargar: recargarPerfil } = useUserProfile();
  const { dias, cargando: cargandoPlan, error: errorPlan, recargar: recargarPlan } = useWeekPlan();
  const {
    items: destacadas,
    alacenaVacia,
    cargando: cargandoDestacadas,
    error: errorDestacadas,
    recargar: recargarDestacadas,
  } = useRecomendaciones(6, true);
  const { recetas: deComunidad, refrescar: refrescarComunidad } = useComunidad('recientes', '');

  const [refrescando, setRefrescando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      recargarPlan();
      recargarPerfil();
    }, [recargarPlan, recargarPerfil])
  );

  async function alJalarParaRefrescar() {
    setRefrescando(true);
    try {
      await Promise.all([
        recargarPlan(),
        recargarDestacadas(),
        recargarPerfil(),
        Promise.resolve(refrescarComunidad()),
      ]);
    } finally {
      setRefrescando(false);
    }
  }

  const irASemana = (fecha?: string) =>
    navigation.navigate('TuSemana', fecha ? { fechaInicial: fecha } : undefined);

  const abrirComunidad = (recetaId?: number) =>
    recetaId
      ? navigation.navigate('Comunidad', { screen: 'DetalleComunidad', params: { recetaId }, initial: false })
      : navigation.navigate('Comunidad', { screen: 'ComunidadFeed' });

  const accesos: Acceso[] = [
    {
      clave: 'recetas',
      titulo: 'Recetas',
      icono: 'notebook-linear',
      fondo: colors.calidoSuave,
      color: colors.calidoIntenso,
      onPress: () => navigation.navigate('Recetario'),
    },
    {
      clave: 'alacena',
      titulo: 'Alacena',
      icono: 'box-linear',
      fondo: colors.acentoSuave,
      color: colors.acentoIntenso,
      onPress: () => navigation.navigate('Alacena'),
    },
    {
      clave: 'favoritos',
      titulo: 'Favoritos',
      icono: 'heart-linear',
      fondo: colors.destacadoSuave,
      color: colors.destacadoIntenso,
      onPress: () => navigation.navigate('Favoritos'),
    },
    {
      clave: 'comunidad',
      titulo: 'Comunidad',
      icono: 'users-group-rounded-linear',
      fondo: colors.serenoSuave,
      color: colors.serenoIntenso,
      onPress: () => abrirComunidad(),
    },
  ];

  return (
    <View style={estilos.pantalla}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={estilos.contenido}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={alJalarParaRefrescar}
            tintColor={colors.primario}
            colors={[colors.primario]}
            progressViewOffset={insets.top}
          />
        }
      >
        <View style={[estilos.bloque, { paddingTop: insets.top + espaciado.sm }]}>
          <View style={estilos.filaSuperior}>
            <View style={estilos.lado} />
            <Image source={require('../assets/images/cookea-logo.png')} style={estilos.logo} resizeMode="contain" />
            <View style={[estilos.lado, estilos.ladoDerecho]}>
              <Pressable
                onPress={() => navigation.navigate('Cuenta')}
                style={estilos.avatar}
                accessibilityRole="button"
                accessibilityLabel="Ir a mi perfil"
              >
                {perfil ? (
                  <Text style={estilos.textoAvatar}>{iniciales(perfil.alias)}</Text>
                ) : (
                  <Icono nombre="user-circle-linear" size={22} color={colors.primario} />
                )}
              </Pressable>
            </View>
          </View>

          <Text style={estilos.saludo}>{perfil ? `Hola, ${perfil.alias}` : 'Hola'}</Text>
          <Text style={estilos.titulo}>¿Qué cocinamos hoy?</Text>

          <SearchBar
            placeholder="Buscar recetas"
            buscarAlEscribir={false}
            onBuscar={(texto) => {
              if (texto.trim().length > 0) {
                navigation.navigate('Recetario', { busquedaInicial: texto.trim() });
              }
            }}
          />
        </View>

        <View style={estilos.montada}>
          <TarjetaHoy
            dias={dias}
            cargando={cargandoPlan}
            error={errorPlan}
            onReintentar={recargarPlan}
            onAbrirReceta={(id) => navigation.navigate('RecetaDetalle', { recetaId: id })}
            onCocinar={(id) => navigation.navigate('ModoCocina', { recetaId: id })}
            onPlanear={irASemana}
          />
        </View>

        <Pressable onPress={() => irASemana()} hitSlop={8} style={estilos.verSemana}>
          <Text style={estilos.textoVerSemana}>Ver mi semana</Text>
          <Icono nombre="alt-arrow-right-linear" size={16} color={colors.acentoOscuro} />
        </Pressable>

        <TarjetaPersonaliza />

        <View style={estilos.seccion}>
          <AccesosRapidos accesos={accesos} />
        </View>

        <View style={estilos.seccion}>
          <TipDelDia />
        </View>

        <View style={estilos.seccion}>
          <EncabezadoSeccion
            titulo="Recomendadas para ti"
            accion="¿Qué cocino hoy?"
            onAccion={() => navigation.navigate('QueCocino')}
          />
          {alacenaVacia && !cargandoDestacadas && !errorDestacadas && (
            <Text style={estilos.aviso}>
              Agrega ingredientes a tu alacena para recomendaciones a tu medida.
            </Text>
          )}

          {cargandoDestacadas && destacadas.length === 0 ? (
            <View style={estilos.carrusel}>
              <Esqueleto ancho={180} alto={245} radio={radios.lg} />
              <Esqueleto ancho={180} alto={245} radio={radios.lg} />
            </View>
          ) : errorDestacadas && destacadas.length === 0 ? (
            <VistaError mensaje="No pudimos cargar las recomendaciones." onReintentar={recargarDestacadas} />
          ) : destacadas.length === 0 ? (
            <View style={estilos.vacio}>
              <Text style={estilos.textoVacio}>Pronto verás aquí recetas pensadas para ti.</Text>
              <Pressable onPress={() => navigation.navigate('Recetario')} style={estilos.botonVacio}>
                <Text style={estilos.textoBotonVacio}>Explorar el recetario</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.carrusel}>
              {destacadas.map((rec, indice) => (
                <TarjetaRecomendada
                  key={rec.receta.id}
                  recomendacion={rec}
                  variante="carrusel"
                  colorFondo={coloresTarjetaReceta[indice % coloresTarjetaReceta.length]}
                  onPress={() => navigation.navigate('RecetaDetalle', { recetaId: rec.receta.id })}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {deComunidad.length > 0 && (
          <View style={estilos.seccion}>
            <EncabezadoSeccion titulo="Nuevas en la comunidad" accion="Ver más" onAccion={() => abrirComunidad()} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.carruselMini}>
              {deComunidad.slice(0, 6).map((receta) => (
                <TarjetaComunidadMini key={receta.id} receta={receta} onPress={() => abrirComunidad(receta.id)} />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
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
  bloque: {
    backgroundColor: colors.encabezado,
    paddingHorizontal: espaciado.md,
    paddingBottom: 76,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  filaSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lado: {
    width: 44,
  },
  ladoDerecho: {
    alignItems: 'flex-end',
  },
  logo: {
    width: 150,
    height: 42,
    tintColor: colors.sobreEncabezado,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.superficieCalida,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoAvatar: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.cuerpo,
    color: colors.primario,
  },
  saludo: {
    fontFamily: fuentes.negrita,
    fontSize: 22,
    lineHeight: 29,
    color: colors.resaltado,
    marginTop: espaciado.lg,
  },
  titulo: {
    fontFamily: fuentes.titulo,
    fontSize: 29,
    lineHeight: 37,
    color: colors.sobreEncabezado,
    marginTop: 2,
    marginBottom: espaciado.md,
  },
  montada: {
    marginTop: -56,
    paddingHorizontal: espaciado.md,
  },
  verSemana: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 2,
    paddingHorizontal: espaciado.md + 4,
    paddingTop: espaciado.sm,
  },
  textoVerSemana: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.base,
    color: colors.acentoOscuro,
  },
  seccion: {
    marginTop: espaciado.lg,
  },
  carrusel: {
    flexDirection: 'row',
    gap: espaciado.md,
    paddingHorizontal: espaciado.md,
  },
  carruselMini: {
    gap: espaciado.sm,
    paddingHorizontal: espaciado.md,
    paddingBottom: espaciado.sm,
  },
  aviso: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.base,
    lineHeight: 20,
    color: colors.textoSuave,
    paddingHorizontal: espaciado.md,
    marginTop: -4,
    marginBottom: espaciado.sm,
  },
  vacio: {
    marginHorizontal: espaciado.md,
    backgroundColor: colors.superficie,
    borderRadius: radios.lg,
    padding: espaciado.md,
    alignItems: 'center',
  },
  textoVacio: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.cuerpo,
    lineHeight: 22,
    color: colors.textoSuave,
    textAlign: 'center',
  },
  botonVacio: {
    marginTop: espaciado.sm,
    minHeight: 46,
    paddingHorizontal: espaciado.lg,
    borderRadius: radios.pill,
    backgroundColor: colors.primario,
    justifyContent: 'center',
  },
  textoBotonVacio: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.cuerpo,
    color: colors.sobrePrimario,
  },
});
