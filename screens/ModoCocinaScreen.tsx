
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useRecipeDetail } from '../hooks/useRecipeDetail';
import { VistaCargando, VistaError } from '../components/StateViews';
import { colors, espaciado, radios, tipografia } from '../theme/theme';

function formatearTiempo(segundos: number) {
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;

  return `${String(minutos).padStart(2, '0')}:${String(resto).padStart(2, '0')}`;
}

export function ModoCocinaScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const recetaId: number = route.params?.recetaId;
  const porcionesSeleccionadas: number | undefined =
    route.params?.porciones;

  const { receta, cargando, error, recargar } = useRecipeDetail(recetaId);

  const pasos = useMemo(
    () => [...(receta?.pasos_receta ?? [])].sort((a, b) => a.orden - b.orden),
    [receta?.pasos_receta]
  );

  const [indicePaso, setIndicePaso] = useState(0);
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [temporizadorActivo, setTemporizadorActivo] = useState(false);
  const [modalFinalVisible, setModalFinalVisible] = useState(false);

  const pasoActual = pasos[indicePaso];
  const duracionPaso = pasoActual?.temporizador_seg ?? 0;

  // Reinicia el temporizador cuando cambia el paso.
  useEffect(() => {
    setTemporizadorActivo(false);
    setSegundosRestantes(duracionPaso);
  }, [indicePaso, duracionPaso]);

  // Cuenta regresiva del paso actual.
  useEffect(() => {
    if (!temporizadorActivo || segundosRestantes <= 0) return;

    const intervalo = setInterval(() => {
      setSegundosRestantes(anterior => Math.max(0, anterior - 1));
    }, 1000);

    return () => clearInterval(intervalo);
  }, [temporizadorActivo, segundosRestantes]);

  useEffect(() => {
    if (segundosRestantes === 0) {
      setTemporizadorActivo(false);
    }
  }, [segundosRestantes]);

  function siguientePaso() {
    setTemporizadorActivo(false);

    if (indicePaso < pasos.length - 1) {
      setIndicePaso(anterior => anterior + 1);
    } else {
      setModalFinalVisible(true);
    }
  }

  function anteriorPaso() {
    setTemporizadorActivo(false);
    setIndicePaso(anterior => Math.max(0, anterior - 1));
  }

  function salir() {
    Alert.alert(
      'Salir de Modo Cocina',
      '¿Quieres salir? Se perderá el progreso de esta preparación.',
      [
        { text: 'Seguir cocinando', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  }

  if (cargando) {
    return <VistaCargando mensaje="Preparando tu receta..." />;
  }

  if (error || !receta) {
    return (
      <VistaError
        mensaje={error ?? 'No encontramos la receta.'}
        onReintentar={recargar}
      />
    );
  }

  if (pasos.length === 0) {
    return (
      <SafeAreaView style={estilos.pantalla}>
        <View style={estilos.estadoVacio}>
          <Text style={tipografia.titulo}>Sin pasos disponibles</Text>
          <Text style={estilos.descripcion}>
            Esta receta todavía no tiene instrucciones de preparación.
          </Text>
          <Pressable
            style={estilos.botonPrincipal}
            onPress={() => navigation.goBack()}
          >
            <Text style={estilos.textoBotonPrincipal}>Volver a la receta</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const esUltimoPaso = indicePaso === pasos.length - 1;

  return (
    <SafeAreaView style={estilos.pantalla} edges={['top']}>
      <View style={estilos.encabezado}>
        <Pressable
          onPress={salir}
          style={estilos.botonCerrar}
          accessibilityLabel="Salir de Modo Cocina"
        >
          <Text style={estilos.textoCerrar}>×</Text>
        </Pressable>

        <View style={estilos.progresoContenedor}>
          <Text style={estilos.progresoTexto}>
            Paso {indicePaso + 1} de {pasos.length}
          </Text>

          <View style={estilos.barraProgreso}>
            {pasos.map((paso, indice) => (
              <View
                key={`${paso.orden}-${indice}`}
                style={[
                  estilos.segmento,
                  indice <= indicePaso && estilos.segmentoActivo,
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={estilos.contenido}
        showsVerticalScrollIndicator={false}
      >
        <Text style={estilos.nombreReceta}>{receta.nombre}</Text>

        <Text style={estilos.porcionesCocina}>
        🍽 {porcionesSeleccionadas ?? receta.porciones_base} porciones
        </Text>

        <View style={estilos.tarjetaPaso}>
          <Text style={estilos.etiquetaPaso}>
            INSTRUCCIÓN {indicePaso + 1}
          </Text>

          <Text style={estilos.instruccion}>
            {pasoActual.texto}
          </Text>

          {duracionPaso > 0 && (
            <View style={estilos.temporizador}>
              <Text style={estilos.tiempo}>
                {formatearTiempo(segundosRestantes)}
              </Text>

              <Pressable
                style={estilos.botonTemporizador}
                onPress={() => {
                  if (segundosRestantes === 0) {
                    setSegundosRestantes(duracionPaso);
                    setTemporizadorActivo(true);
                  } else {
                    setTemporizadorActivo(!temporizadorActivo);
                  }
                }}
              >
                <Text style={estilos.textoTemporizador}>
                  {segundosRestantes === 0
                    ? '↻ Reiniciar temporizador'
                    : temporizadorActivo
                      ? 'Ⅱ Pausar temporizador'
                      : '▶ Iniciar temporizador'}
                </Text>
              </Pressable>

              {segundosRestantes !== duracionPaso && (
                <Pressable
                  onPress={() => {
                    setTemporizadorActivo(false);
                    setSegundosRestantes(duracionPaso);
                  }}
                >
                  <Text style={estilos.reiniciar}>Restablecer tiempo</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={estilos.pie}>
        <Pressable
          onPress={anteriorPaso}
          disabled={indicePaso === 0}
          style={[
            estilos.botonSecundario,
            indicePaso === 0 && estilos.botonDeshabilitado,
          ]}
        >
          <Text style={estilos.textoBotonSecundario}>Anterior</Text>
        </Pressable>

        <Pressable
          onPress={siguientePaso}
          style={estilos.botonSiguiente}
        >
          <Text style={estilos.textoBotonSiguiente}>
            {esUltimoPaso ? 'Terminar' : 'Siguiente'}
          </Text>
        </Pressable>
      </View>

      <Modal
        visible={modalFinalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalFinalVisible(false)}
      >
        <View style={estilos.fondoModal}>
          <View style={estilos.tarjetaModal}>
            <Text style={estilos.tituloModal}>¡Bien hecho! 🎉</Text>
            <Text style={estilos.descripcionModal}>
              Terminaste de preparar {receta.nombre}.
            </Text>

            <Text style={estilos.avisoModal}>
              Pronto podrás registrar la preparación y descontar los
              ingredientes que utilizaste de tu alacena.
            </Text>

            <Pressable
              style={estilos.botonModalPrincipal}
              onPress={() => {
                Alert.alert(
                  'Próximamente',
                  'Esta opción se conectará con la Alacena.'
                );
              }}
            >
              <Text style={estilos.textoModalPrincipal}>
                Descontar de mi alacena
              </Text>
            </Pressable>

            <Pressable
              style={estilos.botonModalSecundario}
              onPress={() => {
                setModalFinalVisible(false);
                navigation.goBack();
              }}
            >
              <Text style={estilos.textoModalSecundario}>
                Finalizar sin descontar
              </Text>
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
    paddingHorizontal: espaciado.md,
    paddingTop: espaciado.sm,
    paddingBottom: espaciado.md,
  },
  botonCerrar: {
    width: 34,
    height: 34,
    borderRadius: radios.pill,
    backgroundColor: colors.textoSecundario,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: espaciado.sm,
  },
  textoCerrar: {
    color: colors.surface,
    fontSize: 26,
    lineHeight: 30,
  },
  progresoContenedor: {
    flex: 1,
  },
  progresoTexto: {
    ...tipografia.chico,
    color: colors.textoPrincipal,
    marginBottom: espaciado.xs,
    fontWeight: '600',
  },
  barraProgreso: {
    flexDirection: 'row',
    gap: 4,
  },
  segmento: {
    flex: 1,
    height: 4,
    borderRadius: radios.pill,
    backgroundColor: colors.borde,
  },
  segmentoActivo: {
    backgroundColor: colors.vino,
  },
  contenido: {
    flexGrow: 1,
    padding: espaciado.md,
  },
  nombreReceta: {
    ...tipografia.subtitulo,
    textAlign: 'center',
    marginBottom: espaciado.lg,
  },
  tarjetaPaso: {
    backgroundColor: colors.surface,
    borderRadius: radios.lg,
    padding: espaciado.lg,
    minHeight: 280,
    justifyContent: 'space-between',
  },
  etiquetaPaso: {
    ...tipografia.chico,
    color: colors.olivaOscuro,
    fontWeight: '700',
    marginBottom: espaciado.md,
  },
  instruccion: {
    fontSize: 19,
    lineHeight: 29,
    fontWeight: '600',
    color: colors.textoPrincipal,
    marginBottom: espaciado.lg,
  },
  descripcion: {
    ...tipografia.cuerpo,
    marginVertical: espaciado.md,
  },
  temporizador: {
    backgroundColor: '#BFA596',
    borderRadius: radios.md,
    padding: espaciado.md,
    alignItems: 'center',
    marginTop: espaciado.md,
  },
  tiempo: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.surface,
    marginBottom: espaciado.sm,
  },
  botonTemporizador: {
    backgroundColor: '#8A604A',
    borderRadius: radios.pill,
    paddingHorizontal: espaciado.md,
    paddingVertical: espaciado.sm,
  },
  textoTemporizador: {
    color: colors.surface,
    fontWeight: '600',
    fontSize: 12,
  },
  reiniciar: {
    color: colors.surface,
    fontSize: 12,
    marginTop: espaciado.sm,
    textDecorationLine: 'underline',
  },
  pie: {
    flexDirection: 'row',
    gap: espaciado.sm,
    backgroundColor: colors.surface,
    padding: espaciado.md,
  },
  botonSecundario: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.mostaza,
    borderRadius: radios.sm,
    padding: 13,
    alignItems: 'center',
  },
  botonDeshabilitado: {
    opacity: 0.4,
  },
  textoBotonSecundario: {
    color: colors.mostaza,
    fontWeight: '600',
  },
  botonSiguiente: {
    flex: 1,
    backgroundColor: '#D2B889',
    borderRadius: radios.sm,
    padding: 13,
    alignItems: 'center',
  },
  textoBotonSiguiente: {
    color: colors.surface,
    fontWeight: '700',
  },
  estadoVacio: {
    flex: 1,
    justifyContent: 'center',
    padding: espaciado.lg,
  },
  botonPrincipal: {
    backgroundColor: colors.oliva,
    borderRadius: radios.md,
    padding: espaciado.md,
    alignItems: 'center',
  },
  textoBotonPrincipal: {
    color: colors.surface,
    fontWeight: '700',
  },
  fondoModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: espaciado.lg,
  },
  tarjetaModal: {
    backgroundColor: colors.surface,
    borderRadius: radios.lg,
    padding: espaciado.lg,
  },
  tituloModal: {
    ...tipografia.titulo,
    textAlign: 'center',
    marginBottom: espaciado.sm,
  },
  descripcionModal: {
    ...tipografia.cuerpo,
    textAlign: 'center',
    marginBottom: espaciado.md,
  },
  avisoModal: {
    ...tipografia.chico,
    textAlign: 'center',
    marginBottom: espaciado.lg,
  },
  botonModalPrincipal: {
    backgroundColor: '#70503F',
    padding: espaciado.md,
    borderRadius: radios.sm,
    alignItems: 'center',
    marginBottom: espaciado.sm,
  },
  textoModalPrincipal: {
    color: colors.surface,
    fontWeight: '700',
  },
  botonModalSecundario: {
    borderWidth: 1,
    borderColor: '#70503F',
    padding: espaciado.md,
    borderRadius: radios.sm,
    alignItems: 'center',
  },
  textoModalSecundario: {
    color: '#70503F',
    fontWeight: '600',
  },
    porcionesCocina: {
    ...tipografia.chico,
    textAlign: 'center',
    marginBottom: espaciado.lg,
    },

});
