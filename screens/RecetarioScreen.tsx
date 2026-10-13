import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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

  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [tiempoMaximo, setTiempoMaximo] = useState<number | null>(null);
  const [orden, setOrden] = useState<'nombre' | 'tiempo'>('nombre');

  const recetasFiltradas = useMemo(() => {
    let resultado = [...recetas];

    if (tiempoMaximo !== null) {
      resultado = resultado.filter(
        receta => receta.tiempo_min <= tiempoMaximo
      );
    }

    if (orden === 'tiempo') {
      resultado.sort((a, b) => a.tiempo_min - b.tiempo_min);
    } else {
      resultado.sort((a, b) =>
        a.nombre.localeCompare(b.nombre, 'es')
      );
    }

    return resultado;
  }, [recetas, tiempoMaximo, orden]);

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
          onFiltro={() => setMostrarFiltros(!mostrarFiltros)}
        />
      </View>

      {mostrarFiltros && (
      <View style={estilos.panelFiltros}>
        <Text style={estilos.tituloFiltros}>Filtrar recetas</Text>

        <Text style={estilos.etiquetaFiltro}>
          Tiempo de preparación
        </Text>

        <View style={estilos.opcionesFiltro}>
          {([
            { titulo: 'Todos', valor: null },
            { titulo: '15 min', valor: 15 },
            { titulo: '30 min', valor: 30 },
            { titulo: '60 min', valor: 60 },
          ] as { titulo: string; valor: number | null }[]).map(opcion => (
            <Pressable
              key={opcion.titulo}
              onPress={() => setTiempoMaximo(opcion.valor)}
              style={[
                estilos.chipFiltro,
                tiempoMaximo === opcion.valor && estilos.chipActivo,
              ]}
            >
              <Text
                style={[
                  estilos.textoChip,
                  tiempoMaximo === opcion.valor && estilos.textoChipActivo,
                ]}
              >
                {opcion.titulo}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={estilos.etiquetaFiltro}>Ordenar por</Text>

        <View style={estilos.opcionesFiltro}>
          <Pressable
            onPress={() => setOrden('nombre')}
            style={[
              estilos.chipFiltro,
              orden === 'nombre' && estilos.chipActivo,
            ]}
          >
            <Text
              style={[
                estilos.textoChip,
                orden === 'nombre' && estilos.textoChipActivo,
              ]}
            >
              Nombre
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setOrden('tiempo')}
            style={[
              estilos.chipFiltro,
              orden === 'tiempo' && estilos.chipActivo,
            ]}
          >
            <Text
              style={[
                estilos.textoChip,
                orden === 'tiempo' && estilos.textoChipActivo,
              ]}
            >
              Menor tiempo
            </Text>
          </Pressable>
        </View>
      </View>
    )}




      {cargando ? (
        <VistaCargando mensaje="Buscando recetas..." />
      ) : error ? (
        <VistaError mensaje={error} onReintentar={recargar} />
      ) : recetasFiltradas.length === 0? (
        <VistaVacia
          mensaje={
            busqueda.trim().length > 0
              ? `No encontramos recetas para "${busqueda}" con los filtros seleccionados.`
              : 'No hay recetas que coincidan con los filtros seleccionados.'
          }
        />
      ) : (
        <FlatList
          data={recetasFiltradas}
          keyExtractor={(receta) => String(receta.id)}
          contentContainerStyle={estilos.lista}
          renderItem={({ item, index }) => (
            <RecipeCard
              receta={item}
              variante="recetario"
              colorFondo={
                coloresTarjetaReceta[index % coloresTarjetaReceta.length]
              }
              onPress={() =>
                navigation.navigate('RecetaDetalle', {
                  recetaId: item.id,
                })
              }
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


  panelFiltros: {
    backgroundColor: colors.surface,
    marginHorizontal: espaciado.md,
    marginBottom: espaciado.md,
    padding: espaciado.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borde,
  },

  tituloFiltros: {
    ...tipografia.subtitulo,
    marginBottom: espaciado.md,
  },

  etiquetaFiltro: {
    ...tipografia.cuerpo,
    fontWeight: '600',
    marginBottom: espaciado.sm,
  },

  opcionesFiltro: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaciado.sm,
    marginBottom: espaciado.md,
  },

  chipFiltro: {
    borderWidth: 1,
    borderColor: colors.oliva,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  chipActivo: {
    backgroundColor: colors.oliva,
  },

  textoChip: {
    color: colors.olivaOscuro,
    fontSize: 12,
    fontWeight: '600',
  },

  textoChipActivo: {
    color: colors.surface,
  },
});