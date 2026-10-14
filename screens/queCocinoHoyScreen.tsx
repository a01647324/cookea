import React, { useMemo, useState } from 'react';
import { Image, Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, coloresTarjetaReceta, espaciado, radios, tipografia } from '../theme/theme';
import { useRecomendaciones } from '../hooks/useRecomendaciones';
import { agruparPorFaltantes } from '../lib/recomendador/recomendar';
import { TarjetaRecomendada } from '../components/recomendador/tarjetaRecomendada';
import { VistaCargando, VistaError, VistaVacia } from '../components/StateViews';

export function QueCocinoHoyScreen() {
  const navigation = useNavigation<any>();
  const { items, alacenaVacia, cargando, error, recargar } = useRecomendaciones(80);
  const [refrescando, setRefrescando] = useState(false);

  const secciones = useMemo(() => agruparPorFaltantes(items), [items]);

  async function alJalar() {
    setRefrescando(true);
    await recargar();
    setRefrescando(false);
  }

  const encabezadoLista = (
    <View>
      <View style={estilos.tituloBloque}>
        <Text style={tipografia.titulo}>¿Qué cocino hoy?</Text>
        <Text style={estilos.subtitulo}>
          {alacenaVacia
            ? 'Te mostramos ideas. Agrega ingredientes para verlas a tu medida.'
            : 'Ordenadas según lo que tienes en tu alacena.'}
        </Text>
      </View>

      {alacenaVacia && (
        <Pressable
          onPress={() => navigation.navigate('Alacena')}
          style={estilos.avisoVacia}
          accessibilityRole="button"
        >
          <Text style={estilos.avisoVaciaTexto}>
            Tu alacena está vacía. Toca aquí para agregar lo que tienes →
          </Text>
        </Pressable>
      )}

      <Text style={estilos.nota}>
        Ya quitamos las recetas con tus alergias. Aun así, revisa la lista de ingredientes antes de cocinar.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={estilos.pantalla} edges={['top']}>
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

      {cargando ? (
        <VistaCargando mensaje="Buscando qué puedes cocinar..." />
      ) : error ? (
        <VistaError mensaje={error} onReintentar={recargar} />
      ) : (
        <SectionList
          sections={secciones}
          keyExtractor={(r) => String(r.receta.id)}
          ListHeaderComponent={encabezadoLista}
          ListEmptyComponent={<VistaVacia mensaje="Todavía no hay recetas disponibles para recomendarte." />}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={estilos.contenido}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={alJalar} />}
          renderSectionHeader={({ section }) => (
            <View style={estilos.seccionFila}>
              <Text style={tipografia.subtitulo}>{section.titulo}</Text>
              <Text style={tipografia.chico}>{section.data.length}</Text>
            </View>
          )}
          renderItem={({ item, index }) => (
            <TarjetaRecomendada
              recomendacion={item}
              colorFondo={coloresTarjetaReceta[index % coloresTarjetaReceta.length]}
              onPress={() => navigation.navigate('RecetaDetalle', { recetaId: item.receta.id })}
            />
          )}
        />
      )}
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
    paddingVertical: espaciado.sm,
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
  contenido: {
    paddingHorizontal: espaciado.md,
    paddingBottom: espaciado.xl,
  },
  tituloBloque: {
    marginTop: espaciado.sm,
  },
  subtitulo: {
    ...tipografia.cuerpo,
    color: colors.textoSecundario,
    marginTop: espaciado.xs,
  },
  avisoVacia: {
    backgroundColor: colors.mostaza,
    borderRadius: radios.md,
    padding: espaciado.md,
    marginTop: espaciado.md,
  },
  avisoVaciaTexto: {
    color: colors.textoPrincipal,
    fontWeight: '600',
    fontSize: 14,
  },
  nota: {
    ...tipografia.chico,
    marginTop: espaciado.md,
  },
  seccionFila: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: espaciado.lg,
    marginBottom: espaciado.sm,
  },
});