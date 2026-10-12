import React, {
    useMemo,
    useState,
  } from 'react';
  
  import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
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
    colors,
    espaciado,
    radios,
    tipografia,
  } from '../theme/theme';
  
  import {
    MomentoComida,
    PlanSemanalItem,
    RecetaResumen,
  } from '../types/database';
  
  import {
    fechaDesdeTexto,
    formatearFechaLocal,
    inicioDeSemana,
    sumarDias,
    useWeeklyPlanner,
  } from '../hooks/useWeeklyPlanner';
  
  import {
    useRecipes,
  } from '../hooks/useRecipes';
  
  
  
  const NOMBRES_DIAS = [
    'Lun',
    'Mar',
    'Mié',
    'Jue',
    'Vie',
    'Sáb',
    'Dom',
  ];
  
  
  const MESES = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  
  
  const MOMENTOS: {
    clave: MomentoComida;
    titulo: string;
  }[] = [
    {
      clave: 'desayuno',
      titulo: 'Desayuno',
    },
    {
      clave: 'comida',
      titulo: 'Comida',
    },
    {
      clave: 'cena',
      titulo: 'Cena',
    },
    {
      clave: 'bebida',
      titulo: 'Bebidas',
    },
  ];
  
  
  
  export function WeekPlanScreen() {
  
    const navigation =
      useNavigation<any>();
  
    const route =
      useRoute<any>();
  
  
    // Si llegamos desde el "+" del Home,
    // puede venir una fecha específica.
    const fechaInicial =
      route.params?.fechaInicial
        ? fechaDesdeTexto(
            route.params.fechaInicial
          )
        : new Date();
  
  
    const [
      fechaSeleccionada,
      setFechaSeleccionada,
    ] = useState<Date>(fechaInicial);
  
  
    const {
      items,
      cargando,
      error,
      guardarReceta,
      eliminarItem,
    } = useWeeklyPlanner(
      fechaSeleccionada
    );
  
  
    // MODAL PARA ELEGIR RECETA
    const [
      selectorVisible,
      setSelectorVisible,
    ] = useState(false);
  
    const [
      momentoSeleccionado,
      setMomentoSeleccionado,
    ] =
      useState<MomentoComida>('comida');
  
    const [
      busqueda,
      setBusqueda,
    ] = useState('');
  
  
    // Reutilizamos tu hook existente.
    // Por lo tanto respeta alergias y visible=true.
    const {
      recetas,
      cargando: cargandoRecetas,
      error: errorRecetas,
    } = useRecipes({
      busqueda,
      modoHogar: true,
    });
  
  
    // MODAL DEL CALENDARIO
    const [
      calendarioVisible,
      setCalendarioVisible,
    ] = useState(false);
  
    const [
      mesCalendario,
      setMesCalendario,
    ] = useState<Date>(
      new Date(
        fechaSeleccionada.getFullYear(),
        fechaSeleccionada.getMonth(),
        1
      )
    );
  
  
    const fechaSeleccionadaTexto =
      formatearFechaLocal(
        fechaSeleccionada
      );
  
  
    // Los siete días de la semana actual
    const diasSemana =
      useMemo(() => {
  
        const inicio =
          inicioDeSemana(
            fechaSeleccionada
          );
  
        return Array.from(
          { length: 7 },
          (_, index) =>
            sumarDias(inicio, index)
        );
  
      }, [fechaSeleccionada]);
  
  
    // Plan del día seleccionado
    const itemsDelDia =
      items.filter(
        item =>
          item.fecha ===
          fechaSeleccionadaTexto
      );
  
  
    function abrirSelector(
      momento: MomentoComida
    ) {
  
      setMomentoSeleccionado(
        momento
      );
  
      setBusqueda('');
  
      setSelectorVisible(true);
    }
  
  
    async function seleccionarReceta(
      receta: RecetaResumen
    ) {
  
      const exito =
        await guardarReceta(
          fechaSeleccionadaTexto,
          momentoSeleccionado,
          receta.id
        );
  
  
      if (exito) {
  
        setSelectorVisible(false);
  
        setBusqueda('');
      }
  
    }
  
  
    function confirmarEliminar(
      item: PlanSemanalItem
    ) {
  
      Alert.alert(
        'Quitar del plan',
        `¿Quieres quitar "${item.recetas.nombre}" de tu plan?`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Quitar',
            style: 'destructive',
  
            onPress: () =>
              eliminarItem(item.id),
          },
        ]
      );
  
    }
  
  
    function cambiarSemana(
      cantidad: number
    ) {
  
      setFechaSeleccionada(
        anterior =>
          sumarDias(
            anterior,
            cantidad * 7
          )
      );
  
    }
  
  
    function abrirCalendario() {
  
      setMesCalendario(
        new Date(
          fechaSeleccionada.getFullYear(),
          fechaSeleccionada.getMonth(),
          1
        )
      );
  
      setCalendarioVisible(true);
    }
  
  
    // Texto del encabezado de la semana
    const inicioSemana =
      diasSemana[0];
  
    const finSemana =
      diasSemana[6];
  
  
    const rangoSemana =
      inicioSemana.getMonth() ===
      finSemana.getMonth()
        ? `${inicioSemana.getDate()} - ${finSemana.getDate()} ${
            MESES[
              inicioSemana.getMonth()
            ]
          }`
        : `${inicioSemana.getDate()} ${
            MESES[
              inicioSemana.getMonth()
            ]
          } - ${finSemana.getDate()} ${
            MESES[
              finSemana.getMonth()
            ]
          }`;
  
  
    const tituloDia =
      fechaSeleccionada.toLocaleDateString(
        'es-MX',
        {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        }
      );
  
  
    return (
  
      <SafeAreaView
        style={estilos.pantalla}
        edges={['top']}
      >
  
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            estilos.contenido
          }
        >
  
  
          {/* HEADER */}
  
          <View style={estilos.header}>
  
            <Pressable
              style={estilos.botonHeader}
              onPress={() =>
                navigation.goBack()
              }
            >
  
              <Text
                style={
                  estilos.iconoHeader
                }
              >
                ‹
              </Text>
  
            </Pressable>
  
  
            <Image
              source={require(
                '../assets/images/cookea-logo.png'
              )}
              style={estilos.logo}
              resizeMode="contain"
            />
  
  
            <Pressable
              style={estilos.botonHeader}
              onPress={
                abrirCalendario
              }
            >
  
              <Text
                style={
                  estilos.iconoCalendario
                }
              >
                📅
              </Text>
  
            </Pressable>
  
          </View>
  
  
  
          {/* NAVEGACIÓN DE SEMANA */}
  
          <View
            style={
              estilos.navegacionSemana
            }
          >
  
            <Pressable
              onPress={() =>
                cambiarSemana(-1)
              }
              style={
                estilos.botonSemana
              }
            >
  
              <Text
                style={
                  estilos.flechaSemana
                }
              >
                ‹
              </Text>
  
            </Pressable>
  
  
            <View>
  
              <Text
                style={
                  estilos.rangoSemana
                }
              >
                {rangoSemana}
              </Text>
  
              <Text
                style={
                  estilos.anioSemana
                }
              >
                {
                  fechaSeleccionada.getFullYear()
                }
              </Text>
  
            </View>
  
  
            <Pressable
              onPress={() =>
                cambiarSemana(1)
              }
              style={
                estilos.botonSemana
              }
            >
  
              <Text
                style={
                  estilos.flechaSemana
                }
              >
                ›
              </Text>
  
            </Pressable>
  
          </View>
  
  
  
          {/* DÍAS */}
  
          <View style={estilos.dias}>
  
            {diasSemana.map(
              (fecha, index) => {
  
                const seleccionada =
                  formatearFechaLocal(
                    fecha
                  ) ===
                  fechaSeleccionadaTexto;
  
  
                return (
  
                  <Pressable
  
                    key={
                      formatearFechaLocal(
                        fecha
                      )
                    }
  
                    onPress={() =>
                      setFechaSeleccionada(
                        fecha
                      )
                    }
  
                    style={[
                      estilos.dia,
  
                      seleccionada &&
                        estilos.diaSeleccionado,
                    ]}
  
                  >
  
                    <Text
                      style={[
                        estilos.nombreDia,
  
                        seleccionada &&
                          estilos.textoDiaSeleccionado,
                      ]}
                    >
                      {
                        NOMBRES_DIAS[
                          index
                        ]
                      }
                    </Text>
  
  
                    <Text
                      style={[
                        estilos.numeroDia,
  
                        seleccionada &&
                          estilos.textoDiaSeleccionado,
                      ]}
                    >
                      {
                        fecha.getDate()
                      }
                    </Text>
  
                  </Pressable>
  
                );
  
              }
            )}
  
          </View>
  
  
  
          {/* FECHA ACTUAL SELECCIONADA */}
  
          <Text style={estilos.fechaGrande}>
            {tituloDia
              .charAt(0)
              .toUpperCase() +
              tituloDia.slice(1)}
          </Text>
  
  
  
          {/* ERROR */}
  
          {error && (
  
            <View
              style={
                estilos.errorContenedor
              }
            >
  
              <Text style={estilos.error}>
                {error}
              </Text>
  
            </View>
  
          )}
  
  
  
          {/* CARGANDO */}
  
          {cargando ? (
  
            <ActivityIndicator
              size="large"
              color={colors.oliva}
              style={{
                marginTop:
                  espaciado.xl,
              }}
            />
  
          ) : (
  
            <View
              style={
                estilos.secciones
              }
            >
  
              {MOMENTOS.map(
                momento => {
  
                  const elementos =
                    itemsDelDia.filter(
                      item =>
                        item.momento ===
                        momento.clave
                    );
  
  
                  return (
  
                    <View
                      key={
                        momento.clave
                      }
                      style={
                        estilos.seccionComida
                      }
                    >
  
                      <Text
                        style={
                          estilos.tituloMomento
                        }
                      >
                        {
                          momento.titulo
                        }
                      </Text>
  
  
                      {/* VACÍO */}
  
                      {elementos.length ===
                      0 ? (
  
                        <View
                          style={
                            estilos.vacio
                          }
                        >
  
                          <Text
                            style={
                              estilos.vacioTitulo
                            }
                          >
                            No tienes nada planeado aún
                          </Text>
  
  
                          <Text
                            style={
                              estilos.vacioDescripcion
                            }
                          >
                            Escoge una receta para este momento del día.
                          </Text>
  
  
                          <Pressable
                            onPress={() =>
                              abrirSelector(
                                momento.clave
                              )
                            }
                            style={
                              estilos.botonAgregar
                            }
                          >
  
                            <Text
                              style={
                                estilos.textoAgregar
                              }
                            >
                              + Escoger receta
                            </Text>
  
                          </Pressable>
  
                        </View>
  
                      ) : (
  
                        <>
  
                          {elementos.map(
                            item => (
  
                              <View
                                key={
                                  item.id
                                }
                                style={
                                  estilos.tarjetaReceta
                                }
                              >
  
                                {item.recetas
                                  .foto_url ? (
  
                                  <Image
  
                                    source={{
                                      uri:
                                        item
                                          .recetas
                                          .foto_url,
                                    }}
  
                                    style={
                                      estilos.imagenReceta
                                    }
  
                                  />
  
                                ) : (
  
                                  <View
                                    style={[
                                      estilos.imagenReceta,
                                      estilos.imagenVacia,
                                    ]}
                                  />
  
                                )}
  
  
                                <View
                                  style={
                                    estilos.infoReceta
                                  }
                                >
  
                                  <Text
                                    style={
                                      estilos.nombreReceta
                                    }
                                    numberOfLines={
                                      2
                                    }
                                  >
                                    {
                                      item
                                        .recetas
                                        .nombre
                                    }
                                  </Text>
  
  
                                  <Text
                                    style={
                                      estilos.tiempoReceta
                                    }
                                  >
                                    ⏱{' '}
                                    {
                                      item
                                        .recetas
                                        .tiempo_min
                                    }{' '}
                                    min
                                  </Text>
  
  
                                  <View
                                    style={
                                      estilos.accionesReceta
                                    }
                                  >
  
                                    <Pressable
                                      onPress={() =>
                                        abrirSelector(
                                          momento.clave
                                        )
                                      }
                                    >
  
                                      <Text
                                        style={
                                          estilos.cambiar
                                        }
                                      >
                                        {
                                          momento.clave ===
                                          'bebida'
                                            ? 'Agregar otra'
                                            : 'Cambiar receta'
                                        }
                                      </Text>
  
                                    </Pressable>
  
  
                                    <Pressable
                                      onPress={() =>
                                        confirmarEliminar(
                                          item
                                        )
                                      }
                                    >
  
                                      <Text
                                        style={
                                          estilos.eliminar
                                        }
                                      >
                                        Quitar
                                      </Text>
  
                                    </Pressable>
  
                                  </View>
  
                                </View>
  
                              </View>
  
                            )
                          )}
  
  
                          {momento.clave ===
                            'bebida' && (
  
                            <Pressable
                              onPress={() =>
                                abrirSelector(
                                  'bebida'
                                )
                              }
                              style={
                                estilos.agregarBebida
                              }
                            >
  
                              <Text
                                style={
                                  estilos.textoAgregar
                                }
                              >
                                + Agregar bebida
                              </Text>
  
                            </Pressable>
  
                          )}
  
                        </>
  
                      )}
  
                    </View>
  
                  );
  
                }
              )}
  
            </View>
  
          )}
  
        </ScrollView>
  
  
  
        {/* MODAL PARA ESCOGER RECETA */}
  
        <Modal
          visible={selectorVisible}
          animationType="slide"
          transparent
          onRequestClose={() =>
            setSelectorVisible(false)
          }
        >
  
          <View
            style={
              estilos.modalFondo
            }
          >
  
            <View
              style={
                estilos.modalRecetas
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
                      estilos.modalTitulo
                    }
                  >
                    Escoger receta
                  </Text>
  
                  <Text
                    style={
                      estilos.modalSubtitulo
                    }
                  >
                    Para{' '}
                    {
                      MOMENTOS.find(
                        m =>
                          m.clave ===
                          momentoSeleccionado
                      )?.titulo
                    }
                  </Text>
  
                </View>
  
  
                <Pressable
                  onPress={() =>
                    setSelectorVisible(
                      false
                    )
                  }
                >
  
                  <Text
                    style={
                      estilos.cerrarModal
                    }
                  >
                    ✕
                  </Text>
  
                </Pressable>
  
              </View>
  
  
              <TextInput
                value={busqueda}
                onChangeText={
                  setBusqueda
                }
                placeholder="Buscar receta"
                placeholderTextColor={
                  colors.textoSecundario
                }
                style={
                  estilos.buscador
                }
              />
  
  
              {cargandoRecetas ? (
  
                <ActivityIndicator
                  size="large"
                  color={colors.oliva}
                  style={{
                    marginTop: 30,
                  }}
                />
  
              ) : errorRecetas ? (
  
                <Text
                  style={
                    estilos.error
                  }
                >
                  {errorRecetas}
                </Text>
  
              ) : (
  
                <FlatList
  
                  data={recetas}
  
                  keyExtractor={
                    receta =>
                      String(
                        receta.id
                      )
                  }
  
                  showsVerticalScrollIndicator={
                    false
                  }
  
                  contentContainerStyle={{
                    paddingBottom: 30,
                  }}
  
                  ListEmptyComponent={
  
                    <Text
                      style={
                        estilos.sinRecetas
                      }
                    >
                      No encontramos recetas.
                    </Text>
  
                  }
  
                  renderItem={({
                    item,
                  }) => (
  
                    <Pressable
                      style={
                        estilos.opcionReceta
                      }
                      onPress={() =>
                        seleccionarReceta(
                          item
                        )
                      }
                    >
  
                      {item.foto_url ? (
  
                        <Image
                          source={{
                            uri:
                              item.foto_url,
                          }}
                          style={
                            estilos.opcionImagen
                          }
                        />
  
                      ) : (
  
                        <View
                          style={[
                            estilos.opcionImagen,
                            estilos.imagenVacia,
                          ]}
                        />
  
                      )}
  
  
                      <View
                        style={{
                          flex: 1,
                        }}
                      >
  
                        <Text
                          style={
                            estilos.opcionNombre
                          }
                          numberOfLines={
                            2
                          }
                        >
                          {item.nombre}
                        </Text>
  
  
                        <Text
                          style={
                            estilos.opcionTiempo
                          }
                        >
                          ⏱{' '}
                          {
                            item.tiempo_min
                          }{' '}
                          min
                        </Text>
  
                      </View>
  
  
                      <Text
                        style={
                          estilos.flechaReceta
                        }
                      >
                        ›
                      </Text>
  
                    </Pressable>
  
                  )}
  
                />
  
              )}
  
            </View>
  
          </View>
  
        </Modal>
  
  
  
        {/* CALENDARIO */}
  
        <Modal
          visible={calendarioVisible}
          transparent
          animationType="fade"
          onRequestClose={() =>
            setCalendarioVisible(
              false
            )
          }
        >
  
          <View
            style={
              estilos.modalFondoCalendario
            }
          >
  
            <View
              style={
                estilos.calendario
              }
            >
  
              <View
                style={
                  estilos.calendarioHeader
                }
              >
  
                <Pressable
                  onPress={() => {
  
                    const anterior =
                      new Date(
                        mesCalendario
                      );
  
                    anterior.setMonth(
                      anterior.getMonth() -
                        1
                    );
  
                    setMesCalendario(
                      anterior
                    );
  
                  }}
                >
  
                  <Text
                    style={
                      estilos.flechaCalendario
                    }
                  >
                    ‹
                  </Text>
  
                </Pressable>
  
  
                <Text
                  style={
                    estilos.mesCalendario
                  }
                >
                  {
                    MESES[
                      mesCalendario.getMonth()
                    ]
                  }{' '}
                  {
                    mesCalendario.getFullYear()
                  }
                </Text>
  
  
                <Pressable
                  onPress={() => {
  
                    const siguiente =
                      new Date(
                        mesCalendario
                      );
  
                    siguiente.setMonth(
                      siguiente.getMonth() +
                        1
                    );
  
                    setMesCalendario(
                      siguiente
                    );
  
                  }}
                >
  
                  <Text
                    style={
                      estilos.flechaCalendario
                    }
                  >
                    ›
                  </Text>
  
                </Pressable>
  
              </View>
  
  
              <View
                style={
                  estilos.diasCalendarioHeader
                }
              >
  
                {NOMBRES_DIAS.map(
                  dia => (
  
                    <Text
                      key={dia}
                      style={
                        estilos.diaCalendarioHeader
                      }
                    >
                      {dia.charAt(0)}
                    </Text>
  
                  )
                )}
  
              </View>
  
  
              <CalendarioMes
                mes={
                  mesCalendario
                }
                seleccionada={
                  fechaSeleccionada
                }
                onSeleccionar={
                  fecha => {
  
                    setFechaSeleccionada(
                      fecha
                    );
  
                    setCalendarioVisible(
                      false
                    );
  
                  }
                }
              />
  
  
              <Pressable
                style={
                  estilos.botonCerrarCalendario
                }
                onPress={() =>
                  setCalendarioVisible(
                    false
                  )
                }
              >
  
                <Text
                  style={
                    estilos.textoCerrarCalendario
                  }
                >
                  Cerrar
                </Text>
  
              </Pressable>
  
            </View>
  
          </View>
  
        </Modal>
  
      </SafeAreaView>
  
    );
  
  }
  
  
  
  // CALENDARIO SIMPLE SIN LIBRERÍAS EXTERNAS
  
  function CalendarioMes({
    mes,
    seleccionada,
    onSeleccionar,
  }: {
    mes: Date;
    seleccionada: Date;
    onSeleccionar:
      (fecha: Date) => void;
  }) {
  
    const year =
      mes.getFullYear();
  
    const month =
      mes.getMonth();
  
  
    const primerDia =
      new Date(
        year,
        month,
        1
      );
  
  
    const cantidadDias =
      new Date(
        year,
        month + 1,
        0
      ).getDate();
  
  
    // Convertimos:
    // lunes = 0
    // ...
    // domingo = 6
    const offset =
      (primerDia.getDay() + 6) %
      7;
  
  
    const celdas:
      (Date | null)[] = [];
  
  
    for (
      let i = 0;
      i < offset;
      i++
    ) {
      celdas.push(null);
    }
  
  
    for (
      let dia = 1;
      dia <= cantidadDias;
      dia++
    ) {
  
      celdas.push(
        new Date(
          year,
          month,
          dia
        )
      );
  
    }
  
  
    return (
  
      <View
        style={
          estilos.gridCalendario
        }
      >
  
        {celdas.map(
          (fecha, index) => {
  
            if (!fecha) {
  
              return (
                <View
                  key={`vacio-${index}`}
                  style={
                    estilos.celdaCalendario
                  }
                />
              );
  
            }
  
  
            const seleccionadaActual =
              formatearFechaLocal(
                fecha
              ) ===
              formatearFechaLocal(
                seleccionada
              );
  
  
            const hoy =
              formatearFechaLocal(
                fecha
              ) ===
              formatearFechaLocal(
                new Date()
              );
  
  
            return (
  
              <Pressable
  
                key={
                  formatearFechaLocal(
                    fecha
                  )
                }
  
                style={
                  estilos.celdaCalendario
                }
  
                onPress={() =>
                  onSeleccionar(
                    fecha
                  )
                }
  
              >
  
                <View
                  style={[
                    estilos.numeroCalendarioContenedor,
  
                    hoy &&
                      estilos.hoyCalendario,
  
                    seleccionadaActual &&
                      estilos.seleccionCalendario,
                  ]}
                >
  
                  <Text
                    style={[
                      estilos.numeroCalendario,
  
                      seleccionadaActual &&
                        estilos.numeroCalendarioSeleccionado,
                    ]}
                  >
                    {
                      fecha.getDate()
                    }
                  </Text>
  
                </View>
  
              </Pressable>
  
            );
  
          }
        )}
  
      </View>
  
    );
  
  }
  
  
  
  // ESTILOS
  
  const estilos =
    StyleSheet.create({
  
      pantalla: {
        flex: 1,
        backgroundColor:
          colors.background,
      },
  
  
      contenido: {
        paddingBottom: 50,
      },
  
  
      // HEADER
  
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent:
          'space-between',
  
        paddingHorizontal:
          espaciado.md,
  
        paddingTop:
          espaciado.xs,
  
        paddingBottom:
          espaciado.sm,
      },
  
  
      botonHeader: {
        width: 44,
        height: 44,
  
        borderRadius:
          radios.pill,
  
        backgroundColor:
          colors.surface,
  
        alignItems: 'center',
        justifyContent:
          'center',
      },
  
  
      iconoHeader: {
        fontSize: 34,
        color:
          colors.textoPrincipal,
  
        lineHeight: 36,
      },
  
  
      iconoCalendario: {
        fontSize: 20,
      },
  
  
      logo: {
        width: 135,
        height: 42,
      },
  
  
      // SEMANA
  
      navegacionSemana: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent:
          'space-between',
  
        paddingHorizontal:
          espaciado.lg,
  
        marginTop:
          espaciado.sm,
      },
  
  
      botonSemana: {
        width: 36,
        height: 36,
  
        alignItems: 'center',
        justifyContent:
          'center',
      },
  
  
      flechaSemana: {
        fontSize: 32,
        color:
          colors.textoPrincipal,
      },
  
  
      rangoSemana: {
        fontSize: 18,
        fontWeight: '700',
  
        color:
          colors.textoPrincipal,
  
        textAlign: 'center',
      },
  
  
      anioSemana: {
        fontSize: 12,
  
        color:
          colors.textoSecundario,
  
        textAlign: 'center',
  
        marginTop: 2,
      },
  
  
      // DÍAS
  
      dias: {
        flexDirection: 'row',
  
        justifyContent:
          'space-between',
  
        paddingHorizontal:
          espaciado.md,
  
        marginTop:
          espaciado.lg,
      },
  
  
      dia: {
        width: 44,
  
        paddingVertical: 10,
  
        borderRadius: 22,
  
        alignItems: 'center',
  
        backgroundColor:
          colors.surface,
      },
  
  
      diaSeleccionado: {
        backgroundColor:
          colors.oliva,
      },
  
  
      nombreDia: {
        fontSize: 11,
  
        color:
          colors.textoSecundario,
  
        fontWeight: '600',
      },
  
  
      numeroDia: {
        fontSize: 16,
  
        fontWeight: '700',
  
        color:
          colors.textoPrincipal,
  
        marginTop: 5,
      },
  
  
      textoDiaSeleccionado: {
        color:
          colors.textoSobreColor,
      },
  
  
      fechaGrande: {
        ...tipografia.titulo,
  
        paddingHorizontal:
          espaciado.md,
  
        marginTop:
          espaciado.lg,
  
        marginBottom:
          espaciado.md,
  
        textTransform:
          'capitalize',
      },
  
  
      // COMIDAS
  
      secciones: {
        paddingHorizontal:
          espaciado.md,
      },
  
  
      seccionComida: {
        marginBottom:
          espaciado.lg,
      },
  
  
      tituloMomento: {
        fontSize: 15,
  
        fontWeight: '700',
  
        color:
          '#745213',
  
        textTransform:
          'uppercase',
  
        letterSpacing: 0.5,
  
        marginBottom:
          espaciado.sm,
      },
  
  
      vacio: {
        backgroundColor:
          colors.surface,
  
        borderRadius:
          radios.lg,
  
        padding:
          espaciado.md,
  
        borderWidth: 1,
  
        borderColor:
          colors.borde,
      },
  
  
      vacioTitulo: {
        fontSize: 15,
  
        fontWeight: '600',
  
        color:
          colors.textoPrincipal,
      },
  
  
      vacioDescripcion: {
        fontSize: 12,
  
        color:
          colors.textoSecundario,
  
        marginTop: 4,
  
        marginBottom:
          espaciado.md,
      },
  
  
      botonAgregar: {
        alignSelf:
          'flex-start',
  
        backgroundColor:
          colors.surfaceMuted,
  
        borderRadius:
          radios.pill,
  
        paddingHorizontal:
          espaciado.md,
  
        paddingVertical:
          espaciado.sm,
      },
  
  
      textoAgregar: {
        color:
          colors.olivaOscuro,
  
        fontWeight: '700',
  
        fontSize: 13,
      },
  
  
      tarjetaReceta: {
        flexDirection: 'row',
  
        backgroundColor:
          colors.surface,
  
        borderRadius:
          radios.lg,
  
        overflow: 'hidden',
  
        marginBottom:
          espaciado.sm,
  
        borderWidth: 1,
  
        borderColor:
          colors.borde,
      },
  
  
      imagenReceta: {
        width: 105,
        minHeight: 105,
  
        backgroundColor:
          colors.surfaceMuted,
      },
  
  
      imagenVacia: {
        backgroundColor:
          colors.surfaceMuted,
      },
  
  
      infoReceta: {
        flex: 1,
  
        padding:
          espaciado.md,
  
        justifyContent:
          'center',
      },
  
  
      nombreReceta: {
        fontSize: 16,
  
        fontWeight: '700',
  
        color:
          colors.textoPrincipal,
      },
  
  
      tiempoReceta: {
        fontSize: 12,
  
        color:
          colors.textoSecundario,
  
        marginTop: 5,
      },
  
  
      accionesReceta: {
        flexDirection: 'row',
  
        justifyContent:
          'space-between',
  
        alignItems: 'center',
  
        marginTop:
          espaciado.md,
      },
  
  
      cambiar: {
        color:
          colors.olivaOscuro,
  
        fontWeight: '700',
  
        fontSize: 12,
      },
  
  
      eliminar: {
        color:
          colors.vino,
  
        fontWeight: '600',
  
        fontSize: 12,
      },
  
  
      agregarBebida: {
        paddingVertical:
          espaciado.sm,
  
        alignItems: 'center',
      },
  
  
      // ERRORES
  
      errorContenedor: {
        marginHorizontal:
          espaciado.md,
  
        backgroundColor:
          '#FBEFE3',
  
        padding:
          espaciado.sm,
  
        borderRadius:
          radios.sm,
  
        marginBottom:
          espaciado.md,
      },
  
  
      error: {
        color:
          colors.error,
  
        textAlign: 'center',
      },
  
  
      // MODALES
  
      modalFondo: {
        flex: 1,
  
        backgroundColor:
          'rgba(0,0,0,0.35)',
  
        justifyContent:
          'flex-end',
      },
  
  
      modalRecetas: {
        height: '82%',
  
        backgroundColor:
          colors.background,
  
        borderTopLeftRadius: 30,
  
        borderTopRightRadius: 30,
  
        padding:
          espaciado.md,
      },
  
  
      modalHeader: {
        flexDirection: 'row',
  
        justifyContent:
          'space-between',
  
        alignItems: 'center',
  
        marginBottom:
          espaciado.md,
      },
  
  
      modalTitulo: {
        fontSize: 22,
  
        fontWeight: '700',
  
        color:
          colors.textoPrincipal,
      },
  
  
      modalSubtitulo: {
        fontSize: 12,
  
        color:
          colors.textoSecundario,
  
        marginTop: 2,
      },
  
  
      cerrarModal: {
        fontSize: 22,
  
        color:
          colors.textoPrincipal,
      },
  
  
      buscador: {
        backgroundColor:
          colors.surface,
  
        borderRadius:
          radios.pill,
  
        borderWidth: 1,
  
        borderColor:
          colors.borde,
  
        paddingHorizontal:
          espaciado.md,
  
        paddingVertical: 12,
  
        marginBottom:
          espaciado.md,
  
        color:
          colors.textoPrincipal,
      },
  
  
      opcionReceta: {
        flexDirection: 'row',
  
        alignItems: 'center',
  
        backgroundColor:
          colors.surface,
  
        borderRadius:
          radios.md,
  
        padding:
          espaciado.sm,
  
        marginBottom:
          espaciado.sm,
      },
  
  
      opcionImagen: {
        width: 65,
        height: 65,
  
        borderRadius:
          radios.md,
  
        marginRight:
          espaciado.md,
      },
  
  
      opcionNombre: {
        fontSize: 15,
  
        fontWeight: '700',
  
        color:
          colors.textoPrincipal,
      },
  
  
      opcionTiempo: {
        fontSize: 12,
  
        color:
          colors.textoSecundario,
  
        marginTop: 4,
      },
  
  
      flechaReceta: {
        fontSize: 26,
  
        color:
          colors.oliva,
      },
  
  
      sinRecetas: {
        textAlign: 'center',
  
        color:
          colors.textoSecundario,
  
        marginTop: 30,
      },
  
  
      // CALENDARIO
  
      modalFondoCalendario: {
        flex: 1,
  
        backgroundColor:
          'rgba(0,0,0,0.35)',
  
        alignItems: 'center',
  
        justifyContent:
          'center',
  
        padding:
          espaciado.md,
      },
  
  
      calendario: {
        width: '100%',
  
        maxWidth: 400,
  
        backgroundColor:
          colors.background,
  
        borderRadius: 28,
  
        padding:
          espaciado.lg,
      },
  
  
      calendarioHeader: {
        flexDirection: 'row',
  
        alignItems: 'center',
  
        justifyContent:
          'space-between',
  
        marginBottom:
          espaciado.md,
      },
  
  
      mesCalendario: {
        fontSize: 18,
  
        fontWeight: '700',
  
        color:
          colors.textoPrincipal,
      },
  
  
      flechaCalendario: {
        fontSize: 30,
  
        color:
          colors.olivaOscuro,
      },
  
  
      diasCalendarioHeader: {
        flexDirection: 'row',
      },
  
  
      diaCalendarioHeader: {
        width: '14.285%',
  
        textAlign: 'center',
  
        color:
          colors.textoSecundario,
  
        fontSize: 11,
  
        fontWeight: '600',
      },
  
  
      gridCalendario: {
        flexDirection: 'row',
  
        flexWrap: 'wrap',
  
        marginTop:
          espaciado.sm,
      },
  
  
      celdaCalendario: {
        width: '14.285%',
  
        height: 45,
  
        alignItems: 'center',
  
        justifyContent:
          'center',
      },
  
  
      numeroCalendarioContenedor: {
        width: 36,
        height: 36,
  
        borderRadius: 18,
  
        alignItems: 'center',
  
        justifyContent:
          'center',
      },
  
  
      hoyCalendario: {
        borderWidth: 1,
  
        borderColor:
          colors.mostaza,
      },
  
  
      seleccionCalendario: {
        backgroundColor:
          colors.oliva,
      },
  
  
      numeroCalendario: {
        fontSize: 13,
  
        color:
          colors.textoPrincipal,
      },
  
  
      numeroCalendarioSeleccionado: {
        color:
          colors.textoSobreColor,
  
        fontWeight: '700',
      },
  
  
      botonCerrarCalendario: {
        marginTop:
          espaciado.lg,
  
        backgroundColor:
          colors.olivaOscuro,
  
        borderRadius:
          radios.pill,
  
        paddingVertical: 12,
  
        alignItems: 'center',
      },
  
  
      textoCerrarCalendario: {
        color:
          colors.textoSobreColor,
  
        fontWeight: '700',
      },
  
    });