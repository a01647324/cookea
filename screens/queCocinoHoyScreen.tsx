import React, { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useRecomendaciones } from '../hooks/useRecomendaciones';
import { FiltroSalud, agruparPorFaltantes, contarPorSalud, filtrarPorSalud } from '../lib/recomendador/recomendar';
import { NOMBRE_FILTRO_SALUD } from '../constants/recomendador'; // SALUD
import { TarjetaRecomendada } from '../components/recomendador/tarjetaRecomendada';
import { CarruselRecetas } from '../components/recomendador/CarruselRecetas';
import { ChipsFiltro } from '../components/alacena/chipsFiltro'; // SALUD: se reutiliza el filtro de chips que ya existe
import { VistaError } from '../components/StateViews';
import { EstadoVacio } from '../components/EstadoVacio';
import { Esqueleto } from '../components/Esqueleto';
import Icono from '../components/Icono';
import { colors, espaciado, fuentes, radios, tamanos } from '../theme/theme';
 
export function QueCocinoHoyScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { items, alacenaVacia, cargando, error, recargar } = useRecomendaciones(80);
  const [refrescando, setRefrescando] = useState(false);
 
  // SALUD: filtro por categoría. Se queda en "todas" si la categoría elegida ya no tiene recetas (p. ej. al refrescar).
  const [filtro, setFiltro] = useState<FiltroSalud>('todas');
  const conteos = useMemo(() => contarPorSalud(items), [items]);
  const filtroActivo: FiltroSalud = filtro !== 'todas' && conteos[filtro] === 0 ? 'todas' : filtro;
 
  const opcionesFiltro = useMemo(() => {
    const categorias = (['balanceada', 'aceptable', 'ocasional'] as const)
      .filter((c) => conteos[c] > 0)
      .map((c) => ({ clave: c, etiqueta: `${NOMBRE_FILTRO_SALUD[c]} · ${conteos[c]}` }));
    // Con una sola categoría el filtro no sirve de nada: no se muestra
    return categorias.length >= 2 ? [{ clave: 'todas', etiqueta: `Todas · ${conteos.todas}` }, ...categorias] : [];
  }, [conteos]);
 
  // Primero lo que puedes cocinar (secciones por ingredientes); dentro de cada una, de más a menos saludable
  const secciones = useMemo(
    () => agruparPorFaltantes(filtrarPorSalud(items, filtroActivo), { ordenarPorSalud: true }),
    [items, filtroActivo]
  );
  const [principal, ...resto] = secciones;
 
  async function alJalar() {
    setRefrescando(true);
    await recargar();
    setRefrescando(false);
  }
 
  const abrir = (recetaId: number) => navigation.navigate('RecetaDetalle', { recetaId });
 
  function contenido() {
    if (cargando) {
      return (
        <View style={estilos.bloque}>
          <Esqueleto ancho="55%" alto={22} />
          <View style={estilos.esqueletoCarrusel}>
            <Esqueleto ancho={40} alto={260} radio={24} />
            <Esqueleto ancho="70%" alto={320} radio={24} />
            <Esqueleto ancho={40} alto={260} radio={24} />
          </View>
          <Esqueleto ancho="40%" alto={22} estilo={{ marginTop: espaciado.lg }} />
          <View style={estilos.esqueletoFila}>
            <Esqueleto ancho={160} alto={170} radio={20} />
            <Esqueleto ancho={160} alto={170} radio={20} />
          </View>
        </View>
      );
    }
    if (error) return <VistaError mensaje={error} onReintentar={recargar} />;
    if (!principal) {
      return (
        <EstadoVacio
          imagen={require('../assets/images/vacios/sin_recomendaciones.webp')}
          titulo="Aún no hay recetas para ti"
          texto="No encontramos recetas que puedas preparar. Explora el recetario para encontrar ideas."
          accion={{ texto: 'Ir al recetario', onPress: () => navigation.navigate('Recetario') }}
        />
      );
    }
 
    return (
      <>
        <View style={[estilos.encabezadoSeccion, estilos.bloque]}>
          <Text style={estilos.tituloSeccion}>{principal.titulo}</Text>
          <View style={estilos.contador}>
            <Text style={estilos.textoContador}>
              {principal.data.length} {principal.data.length === 1 ? 'receta' : 'recetas'}
            </Text>
          </View>
        </View>
        <CarruselRecetas key={filtroActivo} items={principal.data} onAbrir={abrir} mostrarSalud />
 
        {resto.map((seccion) => (
          <View key={seccion.clave}>
            <View style={[estilos.encabezadoSeccion, estilos.bloque]}>
              <Text style={estilos.tituloSeccion}>{seccion.titulo}</Text>
              <Text style={estilos.numero}>{seccion.data.length}</Text>
            </View>
            <FlatList
              data={seccion.data}
              horizontal
              keyExtractor={(r) => String(r.receta.id)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={estilos.fila}
              ItemSeparatorComponent={() => <View style={{ width: espaciado.sm }} />}
              renderItem={({ item }) => (
                <TarjetaRecomendada
                  variante="mini"
                  recomendacion={item}
                  mostrarSalud
                  onPress={() => abrir(item.receta.id)}
                />
              )}
            />
          </View>
        ))}
 
        <View style={[estilos.nota, estilos.bloque]}>
          <Icono nombre="health-linear" size={20} color={colors.serenoIntenso} />
          <Text style={estilos.textoNota}>
            Ya quitamos las recetas con tus alergias. Aun así, revisa los ingredientes antes de cocinar.
          </Text>
        </View>
 
        {items.some((r) => r.salud) && (
          <View style={[estilos.nota, estilos.bloque]}>
            <Icono nombre="leaf-linear" size={20} color={colors.serenoIntenso} />
            <Text style={estilos.textoNota}>
              La categoría de salud se basa en el Plato del Bien Comer: verduras y frutas, cereales, leguminosas y
              alimentos de origen animal. Es una guía, no un diagnóstico: «de vez en cuando» no significa «prohibido».
            </Text>
          </View>
        )}
      </>
    );
  }
 
  return (
    <View style={estilos.pantalla}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + espaciado.sm, paddingBottom: 120, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={alJalar} tintColor={colors.encabezado} />}
      >
        <View style={estilos.bloque}>
          {navigation.canGoBack() && (
            <Pressable onPress={() => navigation.goBack()} style={estilos.botonAtras} accessibilityLabel="Regresar">
              <Icono nombre="arrow-left-linear" size={22} color={colors.texto} />
            </Pressable>
          )}
          <Text style={estilos.titulo}>¿Qué cocino hoy?</Text>
          <Text style={estilos.subtitulo}>
            {alacenaVacia ? 'Ideas para empezar a cocinar' : 'Con lo que ya tienes en casa'}
          </Text>
        </View>
 
        {!cargando && !error && opcionesFiltro.length > 0 && (
          <View style={estilos.filtroSalud}>
            <ChipsFiltro opciones={opcionesFiltro} seleccionada={filtroActivo} onSeleccionar={(c) => setFiltro(c as FiltroSalud)} />
          </View>
        )}
 
        {!cargando && !error && alacenaVacia && (
          <Pressable
            onPress={() => navigation.navigate('Alacena')}
            style={[estilos.aviso, estilos.bloque]}
            accessibilityRole="button"
          >
            <Image
              source={require('../assets/images/vacios/alacena_ideas.webp')}
              style={estilos.imagenAviso}
              resizeMode="contain"
            />
            <View style={{ flex: 1 }}>
              <Text style={estilos.tituloAviso}>Tu alacena está vacía</Text>
              <Text style={estilos.textoAviso}>Agrega lo que tienes y te mostramos recetas a tu medida.</Text>
              <View style={estilos.botonAviso}>
                <Text style={estilos.textoBotonAviso}>Ir a mi alacena</Text>
                <Icono nombre="alt-arrow-right-linear" size={16} color={colors.sobreEncabezado} />
              </View>
            </View>
          </Pressable>
        )}
 
        {contenido()}
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  bloque: {
    marginHorizontal: espaciado.md,
  },
  filtroSalud: {
    marginTop: espaciado.md,
  },
  botonAtras: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.superficie,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espaciado.md,
  },
  titulo: {
    fontFamily: fuentes.titulo,
    fontSize: 31,
    lineHeight: 39,
    color: colors.texto,
  },
  subtitulo: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.cuerpo,
    color: colors.textoSuave,
    marginTop: 2,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
    backgroundColor: colors.superficie,
    borderRadius: radios.lg,
    padding: espaciado.sm,
    marginTop: espaciado.md,
  },
  imagenAviso: {
    width: 96,
    height: 96,
  },
  tituloAviso: {
    fontFamily: fuentes.titulo,
    fontSize: 18,
    lineHeight: 24,
    color: colors.texto,
  },
  textoAviso: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.chico,
    lineHeight: 18,
    color: colors.textoSuave,
    marginTop: 2,
  },
  botonAviso: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: colors.encabezado,
    borderRadius: radios.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: espaciado.sm,
  },
  textoBotonAviso: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.chico,
    color: colors.sobreEncabezado,
  },
  encabezadoSeccion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: espaciado.lg,
    marginBottom: espaciado.xs,
  },
  tituloSeccion: {
    flex: 1,
    fontFamily: fuentes.titulo,
    fontSize: 20,
    lineHeight: 27,
    color: colors.texto,
  },
  contador: {
    backgroundColor: colors.acentoSuave,
    borderRadius: radios.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  textoContador: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.chico,
    color: colors.acentoOscuro,
  },
  numero: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.base,
    color: colors.textoSuave,
  },
  fila: {
    paddingHorizontal: espaciado.md,
    paddingVertical: espaciado.xs,
  },
  nota: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
    backgroundColor: colors.serenoSuave,
    borderRadius: radios.md,
    padding: 12,
    marginTop: espaciado.lg,
  },
  textoNota: {
    flex: 1,
    fontFamily: fuentes.regular,
    fontSize: tamanos.chico,
    lineHeight: 18,
    color: colors.texto,
  },
  esqueletoCarrusel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espaciado.sm,
    marginTop: espaciado.md,
    marginHorizontal: -espaciado.md - 20,
  },
  esqueletoFila: {
    flexDirection: 'row',
    gap: espaciado.sm,
    marginTop: espaciado.sm,
  },
});
