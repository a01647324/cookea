import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useRecipes } from '../hooks/useRecipes';
import { SearchBar } from '../components/SearchBar';
import { RecipeCard } from '../components/RecipeCard';
import { VistaCargando, VistaError, VistaVacia } from '../components/StateViews';
import { colors, coloresTarjetaReceta, espaciado, tipografia } from '../theme/theme';

/**
 * RecetarioScreen

 *   1. El usuario entra a Recetas (o llega desde el buscador del Home, por
 *      eso leemos `route.params?.busquedaInicial`).
 *   2. Escribe un término -> SearchBar llama a `setBusqueda` (con debounce).
 *   3. `useRecipes` vuelve a pedir datos al backend con el nuevo texto.
 *   4. Se listan los resultados; si no hay ninguno, mostramos el mensaje de
 *      "no encontrado" que pide el manual, con opción de intentar otra
 *      búsqueda (el usuario ya tiene el teclado/barra visible arriba).
 *
 * El filtro de alergias no se puede quitar
 */
export function RecetarioScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [busqueda, setBusqueda] = useState<string>(route.params?.busquedaInicial ?? '');
  const { recetas, cargando, error, recargar } = useRecipes({ busqueda });

  return (
    <SafeAreaView style={estilos.pantalla} edges={['top']}>
      <View style={estilos.encabezado}>
        <Pressable onPress={() => navigation.goBack()} style={estilos.botonAtras}>
          <Text style={estilos.flecha}>←</Text>
        </Pressable>
        <Text style={tipografia.titulo}>COOKEA</Text>
        <View style={estilos.espacioDerecho} />
      </View>

      <View style={estilos.buscadorContenedor}>
        <SearchBar
          valorInicial={busqueda}
          onBuscar={setBusqueda}
          onFiltro={() => {
            // Stub para este stage: aquí se abriría un modal de filtros
            // (alérgenos del hogar, "solo con lo que tengo", etc.)
          }}
        />
      </View>

      {cargando ? (
        <VistaCargando mensaje="Buscando recetas..." />
      ) : error ? (
        <VistaError mensaje={error} onReintentar={recargar} />
      ) : recetas.length === 0 ? (
        <VistaVacia
          mensaje={
            busqueda.trim().length > 0
              ? `No encontramos recetas para "${busqueda}". Intenta con otro término.`
              : 'Aún no hay recetas disponibles.'
          }
        />
      ) : (
        <FlatList
          data={recetas}
          keyExtractor={(receta) => String(receta.id)}
          contentContainerStyle={estilos.lista}
          renderItem={({ item, index }) => (
            <RecipeCard
              receta={item}
              colorFondo={coloresTarjetaReceta[index % coloresTarjetaReceta.length]}
              onPress={() => navigation.navigate('RecetaDetalle', { recetaId: item.id })}
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
    paddingTop: espaciado.sm,
    paddingHorizontal: espaciado.md,
  },
  botonAtras: {
    width: 32,
    height: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  flecha: {
    fontSize: 20,
    color: colors.textoPrincipal,
  },
  espacioDerecho: {
    width: 32, 
  },
  buscadorContenedor: {
    paddingHorizontal: espaciado.md,
    marginVertical: espaciado.md,
  },
  lista: {
    paddingHorizontal: espaciado.md,
    paddingBottom: espaciado.xl,
  },
});