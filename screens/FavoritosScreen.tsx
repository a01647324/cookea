import React from 'react';

import {
  ActivityIndicator,
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
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  useAlbums,
} from '../hooks/useAlbums';

import {
  AlbumConConteo,
} from '../types/database';

import {
  colors,
  espaciado,
  radios,
  tipografia,
} from '../theme/theme';


function nombreVisible(
  album: AlbumConConteo
) {

  if (
    album.tipo ===
    'ya_preparadas'
  ) {
    return 'Recetas pasadas';
  }

  return album.nombre;
}


function iconoAlbum(
  tipo: string
) {

  if (tipo === 'favoritos') {
    return 'heart';
  }

  if (
    tipo ===
    'hacer_despues'
  ) {
    return 'time';
  }

  if (
    tipo ===
    'ya_preparadas'
  ) {
    return 'restaurant';
  }

  return 'folder';
}


export function FavoritosScreen() {

  const navigation =
    useNavigation<any>();


  const {
    albumes,
    cargando,
    error,
    recargar,
    crearAlbum,
  } = useAlbums();


  const [
    modalVisible,
    setModalVisible,
  ] = React.useState(false);

  const [
    nombreNueva,
    setNombreNueva,
  ] = React.useState('');

  const [
    guardando,
    setGuardando,
  ] = React.useState(false);


  useFocusEffect(
    React.useCallback(() => {

      void recargar();

    }, [recargar])
  );


  const favoritos =
    albumes.find(
      (album) =>
        album.tipo ===
        'favoritos'
    );


  const predeterminados =
    albumes.filter(
      (album) =>
        album.tipo ===
          'favoritos' ||
        album.tipo ===
          'hacer_despues' ||
        album.tipo ===
          'ya_preparadas'
    );


  const personalizados =
    albumes.filter(
      (album) =>
        album.tipo ===
        'personalizado'
    );


  function abrirAlbum(
    album: AlbumConConteo
  ) {

    navigation.navigate(
      'ColeccionDetalle',
      {
        albumId: album.id,
        nombre:
          nombreVisible(album),
        tipo: album.tipo,
      }
    );
  }


  async function guardarColeccion() {

    setGuardando(true);

    const ok =
      await crearAlbum(
        nombreNueva
      );

    setGuardando(false);

    if (ok) {

      setNombreNueva('');

      setModalVisible(false);
    }
  }


  function agregarFavorito() {

    if (!favoritos) {
      return;
    }

    navigation.navigate(
      'ColeccionDetalle',
      {
        albumId:
          favoritos.id,

        nombre:
          'Favoritos',

        tipo:
          favoritos.tipo,

        abrirSelector: true,
      }
    );
  }


  return (

    <SafeAreaView
      style={estilos.pantalla}
      edges={['top']}
    >

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          estilos.contenido
        }
      >

        {/* HEADER */}

        <View style={estilos.header}>

          <Pressable
            style={
              estilos.botonAtras
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
              estilos.tituloPrincipal
            }
          >
            Mis recetas
          </Text>

        </View>


        <Text
          style={
            estilos.descripcion
          }
        >
          Guarda tus recetas favoritas
          y organízalas en colecciones.
        </Text>


        {/* AGREGAR FAVORITO */}

        <Pressable
          style={
            estilos.botonFavorito
          }
          onPress={
            agregarFavorito
          }
        >

          <Ionicons
            name="heart"
            size={20}
            color={
              colors.textoSobreColor
            }
          />

          <Text
            style={
              estilos.textoBotonFavorito
            }
          >
            Agregar favorito
          </Text>

        </Pressable>


        {cargando ? (

          <ActivityIndicator
            size="large"
            color={
              colors.oliva
            }
            style={{
              marginTop:
                espaciado.xl,
            }}
          />

        ) : (

          <>

            {error && (

              <Text
                style={
                  estilos.error
                }
              >
                {error}
              </Text>

            )}


            {/* PREDETERMINADOS */}

            <Text
              style={
                estilos.tituloSeccion
              }
            >
              MIS RECETAS
            </Text>


            <View
              style={
                estilos.grid
              }
            >

              {predeterminados.map(
                (album) => (

                  <Pressable
                    key={album.id}
                    style={
                      estilos.tarjeta
                    }
                    onPress={() =>
                      abrirAlbum(
                        album
                      )
                    }
                  >

                    <View
                      style={
                        estilos.iconoContenedor
                      }
                    >

                      <Ionicons
                        name={
                          iconoAlbum(
                            album.tipo
                          ) as any
                        }
                        size={30}
                        color={
                          colors
                            .olivaOscuro
                        }
                      />

                    </View>


                    <Text
                      style={
                        estilos.nombreAlbum
                      }
                    >
                      {
                        nombreVisible(
                          album
                        )
                      }
                    </Text>


                    <Text
                      style={
                        estilos.conteo
                      }
                    >
                      {
                        album
                          .cantidad_recetas
                      }{' '}
                      {album
                        .cantidad_recetas ===
                      1
                        ? 'receta'
                        : 'recetas'}
                    </Text>

                  </Pressable>

                )
              )}

            </View>


            {/* COLECCIONES */}

            <View
              style={
                estilos.encabezadoColecciones
              }
            >

              <Text
                style={
                  estilos.tituloSeccion
                }
              >
                MIS COLECCIONES
              </Text>


              <Pressable
                onPress={() =>
                  setModalVisible(
                    true
                  )
                }
              >

                <Text
                  style={
                    estilos.crearTexto
                  }
                >
                  + Crear
                </Text>

              </Pressable>

            </View>


            {personalizados.length ===
            0 ? (

              <View
                style={
                  estilos.vacio
                }
              >

                <Ionicons
                  name="folder-open-outline"
                  size={36}
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
                  Todavía no tienes
                  colecciones.
                </Text>

              </View>

            ) : (

              <View
                style={
                  estilos.grid
                }
              >

                {personalizados.map(
                  (album) => (

                    <Pressable
                      key={
                        album.id
                      }
                      style={
                        estilos.tarjeta
                      }
                      onPress={() =>
                        abrirAlbum(
                          album
                        )
                      }
                    >

                      <View
                        style={
                          estilos.iconoContenedor
                        }
                      >

                        <Ionicons
                          name="folder"
                          size={30}
                          color={
                            colors
                              .terracota
                          }
                        />

                      </View>


                      <Text
                        style={
                          estilos.nombreAlbum
                        }
                        numberOfLines={
                          2
                        }
                      >
                        {album.nombre}
                      </Text>


                      <Text
                        style={
                          estilos.conteo
                        }
                      >
                        {
                          album
                            .cantidad_recetas
                        }{' '}
                        recetas
                      </Text>

                    </Pressable>

                  )
                )}

              </View>

            )}

          </>

        )}

      </ScrollView>


      {/* MODAL NUEVA COLECCIÓN */}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setModalVisible(false)
        }
      >

        <View
          style={
            estilos.modalFondo
          }
        >

          <View
            style={
              estilos.modalTarjeta
            }
          >

            <Text
              style={
                tipografia.subtitulo
              }
            >
              Crear colección
            </Text>


            <TextInput
              value={
                nombreNueva
              }
              onChangeText={
                setNombreNueva
              }
              placeholder="Ej. Desayunos con avena"
              placeholderTextColor={
                colors
                  .textoSecundario
              }
              style={
                estilos.input
              }
              maxLength={40}
            />


            <View
              style={
                estilos.modalBotones
              }
            >

              <Pressable
                style={
                  estilos.botonCancelar
                }
                onPress={() => {

                  setNombreNueva(
                    ''
                  );

                  setModalVisible(
                    false
                  );
                }}
              >

                <Text
                  style={
                    estilos.textoCancelar
                  }
                >
                  Cancelar
                </Text>

              </Pressable>


              <Pressable
                style={
                  estilos.botonCrear
                }
                disabled={
                  guardando
                }
                onPress={() =>
                  void guardarColeccion()
                }
              >

                <Text
                  style={
                    estilos.textoCrear
                  }
                >
                  {guardando
                    ? 'Creando...'
                    : 'Crear'}
                </Text>

              </Pressable>

            </View>

          </View>

        </View>

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

    contenido: {
      padding:
        espaciado.md,
      paddingBottom:
        espaciado.xl,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom:
        espaciado.sm,
    },

    botonAtras: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight:
        espaciado.sm,
    },

    tituloPrincipal: {
      ...tipografia.titulo,
      fontSize: 24,
    },

    descripcion: {
      color:
        colors.textoSecundario,
      fontSize: 14,
      marginBottom:
        espaciado.md,
    },

    botonFavorito: {
      backgroundColor:
        colors.terracota,
      borderRadius:
        radios.lg,
      paddingVertical: 14,
      paddingHorizontal:
        espaciado.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 8,
      marginBottom:
        espaciado.lg,
    },

    textoBotonFavorito: {
      color:
        colors.textoSobreColor,
      fontWeight: '700',
      fontSize: 15,
    },

    tituloSeccion: {
      fontWeight: '700',
      color:
        colors.textoPrincipal,
      fontSize: 14,
      letterSpacing: 0.5,
      marginBottom:
        espaciado.md,
    },

    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent:
        'space-between',
    },

    tarjeta: {
      width: '48%',
      minHeight: 145,
      backgroundColor:
        colors.surfaceMuted,
      borderRadius:
        radios.lg,
      padding:
        espaciado.md,
      marginBottom:
        espaciado.md,
      justifyContent:
        'space-between',
    },

    iconoContenedor: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor:
        colors.background,
      alignItems: 'center',
      justifyContent:
        'center',
      marginBottom:
        espaciado.sm,
    },

    nombreAlbum: {
      color:
        colors.textoPrincipal,
      fontWeight: '700',
      fontSize: 15,
    },

    conteo: {
      color:
        colors.textoSecundario,
      fontSize: 12,
      marginTop:
        espaciado.xs,
    },

    encabezadoColecciones: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      marginTop:
        espaciado.md,
    },

    crearTexto: {
      color:
        colors.olivaOscuro,
      fontWeight: '700',
      marginBottom:
        espaciado.md,
    },

    vacio: {
      backgroundColor:
        colors.surface,
      borderRadius:
        radios.lg,
      padding:
        espaciado.lg,
      alignItems:
        'center',
    },

    textoVacio: {
      color:
        colors.textoSecundario,
      textAlign: 'center',
      marginTop:
        espaciado.sm,
    },

    error: {
      color:
        colors.error,
      marginBottom:
        espaciado.md,
    },

    modalFondo: {
      flex: 1,
      backgroundColor:
        'rgba(0,0,0,0.35)',
      justifyContent:
        'center',
      padding:
        espaciado.lg,
    },

    modalTarjeta: {
      backgroundColor:
        colors.surface,
      borderRadius:
        radios.lg,
      padding:
        espaciado.lg,
    },

    input: {
      backgroundColor:
        colors.background,
      borderWidth: 1,
      borderColor:
        colors.borde,
      borderRadius:
        radios.md,
      paddingHorizontal:
        espaciado.md,
      paddingVertical: 12,
      color:
        colors.textoPrincipal,
      fontSize: 16,
      marginTop:
        espaciado.md,
    },

    modalBotones: {
      flexDirection: 'row',
      justifyContent:
        'flex-end',
      marginTop:
        espaciado.lg,
      gap: 10,
    },

    botonCancelar: {
      paddingHorizontal:
        espaciado.md,
      paddingVertical: 12,
    },

    textoCancelar: {
      color:
        colors.textoSecundario,
      fontWeight: '600',
    },

    botonCrear: {
      backgroundColor:
        colors.oliva,
      borderRadius:
        radios.md,
      paddingHorizontal:
        espaciado.lg,
      paddingVertical: 12,
    },

    textoCrear: {
      color:
        colors.textoSobreColor,
      fontWeight: '700',
    },

  });