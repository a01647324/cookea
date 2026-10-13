import React from 'react';

import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  useNavigation,
  useRoute,
} from '@react-navigation/native';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  useAlbumRecipes,
} from '../hooks/useAlbumRecipes';

import {
  useRecipes,
} from '../hooks/useRecipes';

import {
  RecipeCard,
} from '../components/RecipeCard';

import {
  colors,
  coloresTarjetaReceta,
  espaciado,
  radios,
  tipografia,
} from '../theme/theme';


export function ColeccionDetalleScreen() {

  const navigation =
    useNavigation<any>();

  const route =
    useRoute<any>();


  const {
    albumId,
    nombre,
    tipo,
    abrirSelector = false,
  } = route.params;


  const {
    recetas,
    cargando,
    error,
    agregarReceta,
    quitarReceta,
  } = useAlbumRecipes(
    albumId
  );


  const [
    selectorVisible,
    setSelectorVisible,
  ] = React.useState(
    abrirSelector
  );


  const [
    busqueda,
    setBusqueda,
  ] = React.useState('');


  const {
    recetas: recetasDisponibles,
    cargando:
      cargandoDisponibles,
  } = useRecipes({
    busqueda,
    modoHogar: true,
  });


  // Recetas pasadas se llena
  // automáticamente desde yaLaPrepare.ts
  const esHistorial =
    tipo === 'ya_preparadas';


  async function agregar(
    recetaId: number
  ) {

    const ok =
      await agregarReceta(
        recetaId
      );

    if (ok) {
      setSelectorVisible(
        false
      );

      setBusqueda('');
    }
  }


  function confirmarEliminar(
    recetaId: number
  ) {

    Alert.alert(
      'Quitar receta',
      '¿Quieres quitar esta receta de la colección?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Quitar',
          style:
            'destructive',
          onPress: () => {
            void quitarReceta(
              recetaId
            );
          },
        },
      ]
    );
  }


  return (

    <SafeAreaView
      style={estilos.pantalla}
      edges={['top']}
    >

      <View
        style={estilos.header}
      >

        <Pressable
          style={
            estilos.botonHeader
          }
          onPress={() =>
            navigation.goBack()
          }
        >

          <Ionicons
            name="arrow-back"
            size={24}
            color={
              colors.textoPrincipal
            }
          />

        </Pressable>


        <Text
          style={
            estilos.titulo
          }
          numberOfLines={1}
        >
          {nombre}
        </Text>

      </View>


      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          estilos.contenido
        }
      >

        {esHistorial && (

          <Text
            style={
              estilos.explicacion
            }
          >
            Aquí aparecen las recetas
            que ya has preparado.
          </Text>

        )}


        {!esHistorial && (

          <Pressable
            style={
              estilos.botonAgregar
            }
            onPress={() =>
              setSelectorVisible(
                true
              )
            }
          >

            <Ionicons
              name="add"
              size={22}
              color={
                colors.textoSobreColor
              }
            />

            <Text
              style={
                estilos.textoAgregar
              }
            >
              Agregar receta
            </Text>

          </Pressable>

        )}


        {cargando ? (

          <ActivityIndicator
            size="large"
            color={
              colors.oliva
            }
          />

        ) : error ? (

          <Text
            style={
              estilos.error
            }
          >
            {error}
          </Text>

        ) : recetas.length === 0 ? (

          <View
            style={
              estilos.vacio
            }
          >

            <Ionicons
              name="restaurant-outline"
              size={42}
              color={
                colors
                  .textoSecundario
              }
            />

            <Text
              style={
                estilos.textoVacio
              }
            >
              {esHistorial
                ? 'Todavía no has preparado recetas.'
                : 'Esta colección todavía está vacía.'}
            </Text>

          </View>

        ) : (

          recetas.map(
            (
              receta,
              indice
            ) => (

              <View
                key={
                  receta.id
                }
                style={
                  estilos.recetaContenedor
                }
              >

                <RecipeCard
                  receta={
                    receta
                  }
                  variante="lista"
                  colorFondo={
                    coloresTarjetaReceta[
                      indice %
                        coloresTarjetaReceta.length
                    ]
                  }
                  onPress={() =>
                    navigation.navigate(
                      'RecetaDetalle',
                      {
                        recetaId:
                          receta.id,
                      }
                    )
                  }
                />


                <Pressable
                  style={
                    estilos.quitar
                  }
                  onPress={() =>
                    confirmarEliminar(
                      receta.id
                    )
                  }
                >

                  <Ionicons
                    name="trash-outline"
                    size={16}
                    color={
                      colors.error
                    }
                  />

                  <Text
                    style={
                      estilos.textoQuitar
                    }
                  >
                    Quitar
                  </Text>

                </Pressable>

              </View>

            )
          )

        )}

      </ScrollView>


      {/* SELECTOR DE RECETAS */}

      <Modal
        visible={
          selectorVisible
        }
        animationType="slide"
        onRequestClose={() =>
          setSelectorVisible(
            false
          )
        }
      >

        <SafeAreaView
          style={
            estilos.selectorPantalla
          }
        >

          <View
            style={
              estilos.selectorHeader
            }
          >

            <Pressable
              style={
                estilos.botonHeader
              }
              onPress={() =>
                setSelectorVisible(
                  false
                )
              }
            >

              <Ionicons
                name="close"
                size={26}
                color={
                  colors
                    .textoPrincipal
                }
              />

            </Pressable>


            <Text
              style={
                tipografia.subtitulo
              }
            >
              Escoger receta
            </Text>

          </View>


          <View
            style={
              estilos.busquedaContenedor
            }
          >

            <Ionicons
              name="search"
              size={18}
              color={
                colors.textoSecundario
              }
            />


            <TextInput
              value={
                busqueda
              }
              onChangeText={
                setBusqueda
              }
              placeholder="Buscar receta"
              placeholderTextColor={
                colors
                  .textoSecundario
              }
              style={
                estilos.inputBuscar
              }
            />

          </View>


          <ScrollView
            contentContainerStyle={
              estilos.listaSelector
            }
          >

            {cargandoDisponibles ? (

              <ActivityIndicator
                size="large"
                color={
                  colors.oliva
                }
              />

            ) : (

              recetasDisponibles.map(
                (
                  receta,
                  indice
                ) => (

                  <RecipeCard
                    key={
                      receta.id
                    }
                    receta={
                      receta
                    }
                    variante="lista"
                    colorFondo={
                      coloresTarjetaReceta[
                        indice %
                          coloresTarjetaReceta.length
                      ]
                    }
                    onPress={() =>
                      void agregar(
                        receta.id
                      )
                    }
                  />

                )
              )

            )}

          </ScrollView>

        </SafeAreaView>

      </Modal>

    </SafeAreaView>

  );
}


const estilos =
  StyleSheet.create({

    pantalla: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal:
        espaciado.md,
      paddingVertical:
        espaciado.sm,
    },

    botonHeader: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    titulo: {
      ...tipografia.titulo,
      flex: 1,
      marginLeft:
        espaciado.sm,
    },

    contenido: {
      padding:
        espaciado.md,
      paddingBottom:
        espaciado.xl,
    },

    explicacion: {
      color:
        colors.textoSecundario,
      marginBottom:
        espaciado.md,
    },

    botonAgregar: {
      backgroundColor:
        colors.oliva,
      borderRadius:
        radios.lg,
      paddingVertical: 14,
      flexDirection: 'row',
      justifyContent:
        'center',
      alignItems: 'center',
      gap: 6,
      marginBottom:
        espaciado.lg,
    },

    textoAgregar: {
      color:
        colors.textoSobreColor,
      fontWeight: '700',
    },

    error: {
      color:
        colors.error,
      textAlign: 'center',
      marginTop:
        espaciado.lg,
    },

    vacio: {
      backgroundColor:
        colors.surface,
      borderRadius:
        radios.lg,
      padding:
        espaciado.xl,
      alignItems: 'center',
      marginTop:
        espaciado.lg,
    },

    textoVacio: {
      color:
        colors.textoSecundario,
      textAlign: 'center',
      marginTop:
        espaciado.sm,
    },

    recetaContenedor: {
      marginBottom:
        espaciado.sm,
    },

    quitar: {
      alignSelf:
        'flex-end',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: -8,
      marginBottom:
        espaciado.sm,
    },

    textoQuitar: {
      color:
        colors.error,
      fontSize: 12,
      fontWeight: '600',
    },

    selectorPantalla: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    selectorHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal:
        espaciado.md,
      paddingVertical:
        espaciado.sm,
    },

    busquedaContenedor: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor:
        colors.surface,
      borderWidth: 1,
      borderColor:
        colors.borde,
      borderRadius:
        radios.md,
      marginHorizontal:
        espaciado.md,
      marginBottom:
        espaciado.md,
      paddingHorizontal:
        espaciado.md,
    },

    inputBuscar: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal:
        espaciado.sm,
      color:
        colors.textoPrincipal,
      fontSize: 16,
    },

    listaSelector: {
      padding:
        espaciado.md,
      paddingBottom:
        espaciado.xl,
    },

  });