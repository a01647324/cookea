import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useRecipes } from '../hooks/useRecipes';
import { SearchBar } from '../components/SearchBar';
import { VistaCargando, VistaError, VistaVacia } from '../components/StateViews';
import { colors, coloresTarjetaReceta, espaciado, tipografia, radios } from '../theme/theme';
import { RecetarioRecipeItem } from '../components/RecetarioRecipeItem';
import { useAlbums } from '../hooks/useAlbums';
import {
  MomentoComida,
  RecetaResumen,
} from '../types/database';
import {
  formatearFechaLocal,
  inicioDeSemana,
  sumarDias,
  useWeeklyPlanner,
} from '../hooks/useWeeklyPlanner';

import { Ionicons } from '@expo/vector-icons';

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
  const {
    albumes,
    cargando: cargandoAlbumes,
    error: errorAlbumes,
    crearAlbum,
    agregarRecetaAAlbum,
  } = useAlbums();
  
  
  const [
    recetaParaColeccion,
    setRecetaParaColeccion,
  ] = useState<RecetaResumen | null>(
    null
  );
  
  
  const coleccionesPropias =
    albumes.filter(
      album =>
        album.tipo === 'propio'
    );

  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [tiempoMaximo, setTiempoMaximo] = useState<number | null>(null);
  const [orden, setOrden] = useState<'nombre' | 'tiempo'>('nombre');
  const [creandoColeccion, setCreandoColeccion] = useState(false);

  const [nombreNuevaColeccion, setNombreNuevaColeccion] =
    useState('');

  const [guardandoColeccion, setGuardandoColeccion] =
    useState(false);

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

  const [recetaParaSemana, setRecetaParaSemana] =
  useState<RecetaResumen | null>(null);

  const [diaSeleccionado, setDiaSeleccionado] =
  useState<string | null>(null);

  const [momentoSeleccionado, setMomentoSeleccionado] =
    useState<MomentoComida | null>(null);

  const [guardandoSemana, setGuardandoSemana] =
    useState(false);

  const fechaReferencia = new Date();

  const {
    guardarReceta,
    error: errorSemana,
  } = useWeeklyPlanner(fechaReferencia);

  const inicioSemana =
  inicioDeSemana(fechaReferencia);

const nombresDias = [
  'Lun',
  'Mar',
  'Mié',
  'Jue',
  'Vie',
  'Sáb',
  'Dom',
];

const diasSemana =
  nombresDias.map(
    (nombre, index) => {
      const fecha =
        sumarDias(
          inicioSemana,
          index
        );

      return {
        nombre,
        fecha:
          formatearFechaLocal(fecha),
        numero:
          fecha.getDate(),
      };
    }
  );

  const momentos: {
    valor: MomentoComida;
    texto: string;
    icono: keyof typeof Ionicons.glyphMap;
  }[] = [
    {
      valor: 'desayuno',
      texto: 'Desayuno',
      icono: 'sunny-outline',
    },
    {
      valor: 'comida',
      texto: 'Comida',
      icono: 'restaurant-outline',
    },
    {
      valor: 'cena',
      texto: 'Cena',
      icono: 'moon-outline',
    },
    {
      valor: 'bebida',
      texto: 'Bebida',
      icono: 'cafe-outline',
    },
  ];

  async function agregarAMiSemana() {
    if (
      !recetaParaSemana ||
      !diaSeleccionado ||
      !momentoSeleccionado
    ) {
      Alert.alert(
        'Faltan datos',
        'Selecciona un día y un momento.'
      );
  
      return;
    }
  
    setGuardandoSemana(true);
  
    const ok =
      await guardarReceta(
        diaSeleccionado,
        momentoSeleccionado,
        recetaParaSemana.id
      );
  
    setGuardandoSemana(false);
  
    if (ok) {
      const nombreReceta =
        recetaParaSemana.nombre;
  
      setRecetaParaSemana(null);
      setDiaSeleccionado(null);
      setMomentoSeleccionado(null);
  
      Alert.alert(
        'Agregada a tu semana',
        `${nombreReceta} se agregó a tu plan semanal.`
      );
    }
  }

  async function guardarEnColeccion(
    albumId: number
  ) {
    if (!recetaParaColeccion) {
      return;
    }
  
    const ok =
      await agregarRecetaAAlbum(
        albumId,
        recetaParaColeccion.id
      );
  
    if (ok) {
      const nombreReceta =
        recetaParaColeccion.nombre;
  
      setRecetaParaColeccion(
        null
      );
  
      Alert.alert(
        'Guardada',
        `${nombreReceta} se agregó a tu colección.`
      );
    }
  }

  async function crearYAgregarColeccion() {
    if (!recetaParaColeccion) return;
  
    const nombreLimpio =
      nombreNuevaColeccion.trim();
  
    if (!nombreLimpio) {
      Alert.alert(
        'Nombre requerido',
        'Escribe un nombre para la colección.'
      );
      return;
    }
  
    setGuardandoColeccion(true);
  
    const albumCreado =
      await crearAlbum(nombreLimpio);
  
    if (!albumCreado) {
      setGuardandoColeccion(false);
      return;
    }
  
    const ok =
      await agregarRecetaAAlbum(
        albumCreado.id,
        recetaParaColeccion.id
      );
  
    setGuardandoColeccion(false);
  
    if (ok) {
      const nombreReceta =
        recetaParaColeccion.nombre;
  
      setNombreNuevaColeccion('');
      setCreandoColeccion(false);
      setRecetaParaColeccion(null);
  
      Alert.alert(
        'Guardada',
        `${nombreReceta} se agregó a "${albumCreado.nombre}".`
      );
    }
  }

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
            <RecetarioRecipeItem
          
              receta={item}
          
              colorFondo={
                coloresTarjetaReceta[
                  index %
                    coloresTarjetaReceta.length
                ]
              }
          
              onAbrir={() =>
                navigation.navigate(
                  'RecetaDetalle',
                  {
                    recetaId: item.id,
                  }
                )
              }
          
              onColeccion={(
                receta
              ) =>
                setRecetaParaColeccion(
                  receta
                )
              }

              onSemana={(receta) => {
                setRecetaParaSemana(receta);
                setDiaSeleccionado(null);
                setMomentoSeleccionado(null);
              }}
          
            />
          )}
        />
      )}
      <Modal
  visible={
    recetaParaColeccion !==
    null
  }
  transparent
  animationType="fade"
  onRequestClose={() =>
    setRecetaParaColeccion(
      null
    )
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

      <View
        style={
          estilos.modalHeader
        }
      >

        <View>

          <Text
            style={
              tipografia.subtitulo
            }
          >
            Agregar a colección
          </Text>

          {recetaParaColeccion && (

            <Text
              style={
                estilos.nombreRecetaModal
              }
              numberOfLines={1}
            >
              {
                recetaParaColeccion.nombre
              }
            </Text>

          )}

        </View>


        <Pressable
          style={
            estilos.cerrarModal
          }
          onPress={() =>
            setRecetaParaColeccion(
              null
            )
          }
        >

          <Ionicons
            name="close"
            size={24}
            color={
              colors.textoPrincipal
            }
          />

        </Pressable>

      </View>


      {cargandoAlbumes ? (

        <ActivityIndicator
          size="large"
          color={
            colors.oliva
          }
        />

      ) : errorAlbumes ? (

        <Text
          style={
            estilos.errorModal
          }
        >
          {errorAlbumes}
        </Text>

      ) : coleccionesPropias.length ===
        0 ? (

        <View
          style={
            estilos.sinColecciones
          }
        >

          <Ionicons
            name="folder-open-outline"
            size={36}
            color={
              colors.textoSecundario
            }
          />

          <Text
            style={
              estilos.textoSinColecciones
            }
          >
            Todavía no tienes
            colecciones propias.
          </Text>

          <Text
            style={
              estilos.ayudaColeccion
            }
          >
            Puedes crear una desde
            Favoritos.
          </Text>

        </View>

      ) : (
      <>
        <ScrollView
          style={
            estilos.listaColecciones
          }
        >

          {coleccionesPropias.map(
            album => (

              <Pressable
                key={
                  album.id
                }
                style={
                  estilos.opcionColeccion
                }
                onPress={() =>
                  void guardarEnColeccion(
                    album.id
                  )
                }
              >

                <View
                  style={
                    estilos.iconoColeccion
                  }
                >

                  <Ionicons
                    name="folder"
                    size={22}
                    color={
                      colors.terracota
                    }
                  />

                </View>


                <View
                  style={
                    estilos.infoColeccion
                  }
                >

                  <Text
                    style={
                      estilos.nombreColeccion
                    }
                  >
                    {album.nombre}
                  </Text>

                  <Text
                    style={
                      estilos.cantidadColeccion
                    }
                  >
                    {
                      album.cantidad_recetas
                    }{' '}
                    {album.cantidad_recetas ===
                    1
                      ? 'receta'
                      : 'recetas'}
                  </Text>

                </View>


                <Ionicons
                  name="add-circle-outline"
                  size={24}
                  color={
                    colors.oliva
                  }
                />

              </Pressable>

            )
          )}
        

        </ScrollView>
        {!creandoColeccion ? (
          <Pressable
            style={estilos.botonNuevaColeccion}
            onPress={() =>
              setCreandoColeccion(true)
            }
          >
            <Ionicons
              name="add-circle-outline"
              size={22}
              color={colors.olivaOscuro}
            />
        
            <Text
              style={estilos.textoNuevaColeccion}
            >
              Crear nueva colección
            </Text>
          </Pressable>
        ) : (
          <View
            style={estilos.crearColeccionContenedor}
          >
            <TextInput
              value={nombreNuevaColeccion}
              onChangeText={setNombreNuevaColeccion}
              placeholder="Nombre de la colección"
              placeholderTextColor={
                colors.textoSecundario
              }
              style={estilos.inputNuevaColeccion}
              maxLength={40}
            />
        
            <View
              style={estilos.botonesNuevaColeccion}
            >
              <Pressable
                onPress={() => {
                  setCreandoColeccion(false);
                  setNombreNuevaColeccion('');
                }}
              >
                <Text
                  style={estilos.cancelarColeccion}
                >
                  Cancelar
                </Text>
              </Pressable>
        
              <Pressable
                disabled={guardandoColeccion}
                style={estilos.guardarColeccion}
                onPress={() =>
                  void crearYAgregarColeccion()
                }
              >
                <Text
                  style={estilos.textoGuardarColeccion}
                >
                  {guardandoColeccion
                    ? 'Creando...'
                    : 'Crear y agregar'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </>
      )}

    </View>

  </View>

</Modal>
<Modal
  visible={recetaParaSemana !== null}
  transparent
  animationType="fade"
  onRequestClose={() =>
    setRecetaParaSemana(null)
  }
>
  <View style={estilos.modalFondo}>

    <View style={estilos.modalTarjeta}>

      <View style={estilos.modalHeader}>
        <View>
          <Text style={tipografia.subtitulo}>
            Agregar a mi semana
          </Text>

          {recetaParaSemana && (
            <Text
              style={
                estilos.nombreRecetaModal
              }
            >
              {recetaParaSemana.nombre}
            </Text>
          )}
        </View>

        <Pressable
          style={estilos.cerrarModal}
          onPress={() =>
            setRecetaParaSemana(null)
          }
        >
          <Ionicons
            name="close"
            size={24}
            color={colors.textoPrincipal}
          />
        </Pressable>
      </View>


      <Text style={estilos.tituloSeccionSemana}>
        Elige un día
      </Text>

      <View style={estilos.diasSemana}>
        {diasSemana.map((dia) => {

          const activo =
            diaSeleccionado ===
            dia.fecha;

          return (
            <Pressable
              key={dia.fecha}
              style={[
                estilos.diaSemana,
                activo &&
                  estilos.diaSemanaActivo,
              ]}
              onPress={() =>
                setDiaSeleccionado(
                  dia.fecha
                )
              }
            >
              <Text
                style={[
                  estilos.nombreDiaSemana,
                  activo &&
                    estilos.textoDiaActivo,
                ]}
              >
                {dia.nombre}
              </Text>

              <Text
                style={[
                  estilos.numeroDiaSemana,
                  activo &&
                    estilos.textoDiaActivo,
                ]}
              >
                {dia.numero}
              </Text>
            </Pressable>
          );
        })}
      </View>


      <Text style={estilos.tituloSeccionSemana}>
        Momento
      </Text>

      <View style={estilos.momentosSemana}>

        {momentos.map((momento) => {

          const activo =
            momentoSeleccionado ===
            momento.valor;

          return (
            <Pressable
              key={momento.valor}
              style={[
                estilos.momentoSemana,
                activo &&
                  estilos.momentoSemanaActivo,
              ]}
              onPress={() =>
                setMomentoSeleccionado(
                  momento.valor
                )
              }
            >
              <Ionicons
                name={momento.icono}
                size={20}
                color={
                  activo
                    ? colors.textoSobreColor
                    : colors.olivaOscuro
                }
              />

              <Text
                style={[
                  estilos.textoMomentoSemana,
                  activo &&
                    estilos.textoMomentoActivo,
                ]}
              >
                {momento.texto}
              </Text>
            </Pressable>
          );
        })}

      </View>


      {errorSemana && (
        <Text style={estilos.errorModal}>
          {errorSemana}
        </Text>
      )}


      <Pressable
        disabled={
          !diaSeleccionado ||
          !momentoSeleccionado ||
          guardandoSemana
        }
        style={[
          estilos.botonAgregarSemana,
          (
            !diaSeleccionado ||
            !momentoSeleccionado ||
            guardandoSemana
          ) &&
            estilos.botonAgregarSemanaDesactivado,
        ]}
        onPress={() =>
          void agregarAMiSemana()
        }
      >
        {guardandoSemana ? (
          <ActivityIndicator
            color={colors.textoSobreColor}
          />
        ) : (
          <>
            <Ionicons
              name="calendar"
              size={19}
              color={
                colors.textoSobreColor
              }
            />

            <Text
              style={
                estilos.textoAgregarSemana
              }
            >
              Agregar a mi semana
            </Text>
          </>
        )}
      </Pressable>

    </View>

  </View>
</Modal>
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
  modalFondo: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.40)',
    justifyContent: 'center',
    padding: espaciado.lg,
  },
  
  modalTarjeta: {
    backgroundColor:
      colors.surface,
  
    borderRadius: 20,
  
    padding: espaciado.lg,
  
    maxHeight: '70%',
  },
  
  modalHeader: {
    flexDirection: 'row',
  
    alignItems: 'center',
  
    justifyContent:
      'space-between',
  
    marginBottom:
      espaciado.lg,
  },
  
  cerrarModal: {
    width: 40,
    height: 40,
  
    alignItems: 'center',
  
    justifyContent:
      'center',
  },
  
  nombreRecetaModal: {
    color:
      colors.textoSecundario,
  
    fontSize: 12,
  
    marginTop: 3,
  
    maxWidth: 240,
  },
  
  listaColecciones: {
    maxHeight: 350,
  },
  
  opcionColeccion: {
    flexDirection: 'row',
  
    alignItems: 'center',
  
    backgroundColor:
      colors.background,
  
    borderWidth: 1,
  
    borderColor:
      colors.borde,
  
    borderRadius:
      radios.md,
  
    padding:
      espaciado.md,
  
    marginBottom:
      espaciado.sm,
  },
  
  iconoColeccion: {
    width: 42,
    height: 42,
  
    borderRadius: 21,
  
    backgroundColor:
      colors.surfaceMuted,
  
    alignItems: 'center',
  
    justifyContent:
      'center',
  
    marginRight:
      espaciado.md,
  },
  
  infoColeccion: {
    flex: 1,
  },
  
  nombreColeccion: {
    color:
      colors.textoPrincipal,
  
    fontWeight: '700',
  
    fontSize: 14,
  },
  
  cantidadColeccion: {
    color:
      colors.textoSecundario,
  
    fontSize: 12,
  
    marginTop: 2,
  },
  
  sinColecciones: {
    alignItems: 'center',
  
    paddingVertical:
      espaciado.lg,
  },
  
  textoSinColecciones: {
    color:
      colors.textoPrincipal,
  
    fontWeight: '600',
  
    textAlign: 'center',
  
    marginTop:
      espaciado.sm,
  },
  
  ayudaColeccion: {
    color:
      colors.textoSecundario,
  
    fontSize: 12,
  
    textAlign: 'center',
  
    marginTop:
      espaciado.xs,
  },
  
  errorModal: {
    color:
      colors.error,
  
    textAlign: 'center',
  
    padding:
      espaciado.md,
  },
  botonNuevaColeccion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.oliva,
  
    borderRadius: radios.md,
  
    paddingVertical: 12,
    marginTop: espaciado.sm,
  
    gap: 6,
  },
  
  textoNuevaColeccion: {
    color: colors.olivaOscuro,
    fontWeight: '700',
    fontSize: 14,
  },
  
  crearColeccionContenedor: {
    marginTop: espaciado.md,
  },
  
  inputNuevaColeccion: {
    borderWidth: 1,
    borderColor: colors.borde,
  
    backgroundColor: colors.background,
  
    borderRadius: radios.md,
  
    paddingHorizontal: espaciado.md,
    paddingVertical: 12,
  
    color: colors.textoPrincipal,
    fontSize: 16,
  },
  
  botonesNuevaColeccion: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  
    marginTop: espaciado.sm,
    gap: espaciado.md,
  },
  
  cancelarColeccion: {
    color: colors.textoSecundario,
    fontWeight: '600',
  },
  
  guardarColeccion: {
    backgroundColor: colors.oliva,
  
    borderRadius: radios.md,
  
    paddingHorizontal: espaciado.md,
    paddingVertical: 10,
  },
  
  textoGuardarColeccion: {
    color: colors.textoSobreColor,
    fontWeight: '700',
  },
  tituloSeccionSemana: {
    color: colors.textoPrincipal,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: espaciado.sm,
    marginTop: espaciado.sm,
  },
  
  diasSemana: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
    marginBottom: espaciado.md,
  },
  
  diaSemana: {
    flex: 1,
    minHeight: 58,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: radios.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  
  diaSemanaActivo: {
    backgroundColor: colors.oliva,
    borderColor: colors.oliva,
  },
  
  nombreDiaSemana: {
    fontSize: 11,
    color: colors.textoSecundario,
    fontWeight: '600',
  },
  
  numeroDiaSemana: {
    fontSize: 16,
    color: colors.textoPrincipal,
    fontWeight: '700',
    marginTop: 2,
  },
  
  textoDiaActivo: {
    color: colors.textoSobreColor,
  },
  
  momentosSemana: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaciado.sm,
    marginBottom: espaciado.md,
  },
  
  momentoSemana: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: radios.md,
    backgroundColor: colors.background,
  },
  
  momentoSemanaActivo: {
    backgroundColor: colors.oliva,
    borderColor: colors.oliva,
  },
  
  textoMomentoSemana: {
    fontSize: 13,
    color: colors.olivaOscuro,
    fontWeight: '600',
  },
  
  textoMomentoActivo: {
    color: colors.textoSobreColor,
  },
  
  botonAgregarSemana: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: colors.oliva,
    borderRadius: radios.md,
    paddingVertical: 13,
    marginTop: espaciado.sm,
  },
  
  botonAgregarSemanaDesactivado: {
    opacity: 0.45,
  },
  
  textoAgregarSemana: {
    color: colors.textoSobreColor,
    fontWeight: '700',
    fontSize: 14,
  },
});