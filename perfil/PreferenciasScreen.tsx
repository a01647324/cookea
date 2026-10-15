import useProteccionCapturas from './useProteccionCapturas';
import useSession from '../auth/useSession';
import { obtenerSeccion, SeccionPreferencias } from './secciones';
import useCocina from './useCocina';
import BloquesCocina from './BloquesCocina';
import Encabezado from './Encabezado';
import AvisoFormulario from './AvisoFormulario';
import PantallaListo from './PantallaListo';
import { useCallback, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, usePreventRemove } from '@react-navigation/native';
import { VistaCargando } from '../components/StateViews';
import { ConfirmarHoja } from '../components/ConfirmarHoja';
import Icono, { NombreIcono } from '../components/Icono';
import { colors, espaciado, fuentes, radios, tamanos } from '../theme/theme';
import usePreferencias from './usePreferencias';
import SelectorPersonas from './SelectorPersonas';
import ListaAlergenos from './ListaAlergenos';

const SECCIONES: Record<SeccionPreferencias, { titulo: string; texto: string; icono: NombreIcono; fondo: string; color: string }> = {
  restricciones: {
    titulo: 'Mis restricciones',
    texto: 'No te mostraremos recetas con lo que marques como alergia.',
    icono: 'health-linear',
    fondo: colors.peligroSuave,
    color: colors.peligro,
  },
  hogar: {
    titulo: 'Mi hogar',
    texto: 'Así cuidamos también a quienes viven contigo.',
    icono: 'home-2-linear',
    fondo: colors.calidoSuave,
    color: colors.calidoIntenso,
  },
  cocina: {
    titulo: 'Mi cocina',
    texto: 'Marca lo que tienes para recomendarte recetas que sí puedas hacer.',
    icono: 'oven-mitts-linear',
    fondo: colors.serenoSuave,
    color: colors.serenoIntenso,
  },
};

// PreferenciasScreen: "Editar preferencias", desde Perfil.
// Las mismas preguntas de Personaliza, pero en una sola pantalla.
export default function PreferenciasScreen({ navigation }: any) {
  useProteccionCapturas('preferencias');
  const { session } = useSession();
  const [seccion, setSeccion] = useState<SeccionPreferencias>(() =>
    session ? obtenerSeccion(session.user.id) : 'restricciones'
  );
  useFocusEffect(
    useCallback(() => {
      if (session) setSeccion(obtenerSeccion(session.user.id));
    }, [session])
  );
  const datos = SECCIONES[seccion];
  const cocina = useCocina();
  const bloqueo = useRef(false);
  const [guardandoTodo, setGuardandoTodo] = useState(false);
  const {
    alergenos,
    personas,
    cambiarPersonas,
    propias,
    alternarPropia,
    hogar,
    alternarHogar,
    hayCambios: cambiosAlergias,
    cargando: cargaAlergias,
    errorCarga: errorAlergias,
    recargar: recargarAlergias,
    guardando: guardandoAlergias,
    guardar,
  } = usePreferencias();

  const hayCambios = cambiosAlergias || cocina.hayCambios;
  const cargando = cargaAlergias || cocina.cargando;
  const errorCarga = errorAlergias || cocina.error;
  const guardando = guardandoTodo || guardandoAlergias || cocina.guardando;
  const recargar = () => {
    if (errorAlergias) recargarAlergias();
    if (cocina.error) cocina.recargar();
  };
  const [aviso, setAviso] = useState('');
  const [listo, setListo] = useState(false);
  const [salidaPendiente, setSalidaPendiente] = useState<any>(null);

  // Detiene la salida mientras haya cambios sin guardar y pregunta antes de salir
  usePreventRemove((hayCambios && !listo) || guardando, ({ data }) => {
    if (guardando) return;
    setSalidaPendiente(data.action);
  });

  // Guarda en el mismo orden que Personaliza, sin la marca "personalizo".
  // Con 1 persona, usePreferencias borra las alergias del hogar.
  async function guardarCambios() {
    if (bloqueo.current || guardando || !hayCambios || cargando || errorCarga) return;
    bloqueo.current = true;
    setGuardandoTodo(true);
    try {
      setAviso('');
      const mensaje = seccion === 'cocina' ? null : await guardar(propias, hogar, seccion);
      if (mensaje !== null) {
        setAviso(
          'No se completó el guardado. Algunos cambios pueden haberse guardado. Conservamos tu selección para reintentar. ' +
            mensaje
        );
        return;
      }
      const errorCocina = seccion === 'hogar' ? null : await cocina.guardar(seccion === 'restricciones' ? 'gustos' : 'cocina');
      if (errorCocina) {
        setAviso(errorCocina);
        return;
      }
      setListo(true);
    } finally {
      bloqueo.current = false;
      setGuardandoTodo(false);
    }
  }

  const encabezado = <Encabezado titulo={datos.titulo} onVolver={() => navigation.goBack()} deshabilitado={guardando} />;

  if (listo) {
    return (
      <SafeAreaView style={styles.pantalla} edges={['top']}>
        {encabezado}
        <PantallaListo
          titulo="Tus preferencias se guardaron"
          texto="Puedes cambiarlas cuando quieras desde tu perfil."
          onVolver={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  if (cargando) {
    return (
      <SafeAreaView style={styles.pantalla} edges={['top']}>
        {encabezado}
        <VistaCargando mensaje="Cargando tus preferencias…" />
      </SafeAreaView>
    );
  }

  if (errorCarga !== '') {
    return (
      <SafeAreaView style={styles.pantalla} edges={['top']}>
        {encabezado}
        <View style={styles.contenido}>
          <AvisoFormulario texto={errorCarga} />
          <Pressable style={styles.botonPrincipal} onPress={recargar} accessibilityRole="button">
            <Text style={styles.textoBotonPrincipal}>Reintentar</Text>
          </Pressable>
          <Pressable style={styles.botonSecundario} onPress={() => navigation.goBack()} accessibilityRole="button">
            <Text style={styles.textoBotonSecundario}>Volver</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const puedeGuardar = hayCambios && !guardando;

  return (
    <SafeAreaView style={styles.pantalla} edges={['top']}>
      {encabezado}
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
          <View style={styles.intro}>
            <View style={[styles.circulo, { backgroundColor: datos.fondo }]}>
              <Icono nombre={datos.icono} size={28} color={datos.color} />
            </View>
            <Text style={styles.textoIntro}>{datos.texto}</Text>
          </View>

          <AvisoFormulario texto={aviso} />

          {seccion === 'restricciones' && (
            <>
              <View style={styles.bloque}>
                <Text style={styles.tituloBloque}>Tus alergias</Text>
                <ListaAlergenos alergenos={alergenos} seleccionados={propias} onAlternar={alternarPropia} deshabilitado={guardando} />
              </View>
              <BloquesCocina cocina={cocina} deshabilitado={guardando} solo="gustos" />
            </>
          )}

          {seccion === 'hogar' && (
            <>
              <View style={styles.bloque}>
                <Text style={styles.tituloBloque}>Personas en tu casa</Text>
                <Text style={styles.explicacion}>Contándote a ti.</Text>
                <SelectorPersonas valor={personas} onCambiar={cambiarPersonas} deshabilitado={guardando} />
              </View>
              <View style={styles.bloque}>
                <Text style={styles.tituloBloque}>Alergias de las demás personas</Text>
                {personas === 1 ? (
                  <Text style={styles.explicacion}>
                    Si vives sola o solo, al guardar se eliminarán las alergias del hogar registradas.
                  </Text>
                ) : (
                  <ListaAlergenos alergenos={alergenos} seleccionados={hogar} onAlternar={alternarHogar} deshabilitado={guardando} />
                )}
              </View>
            </>
          )}

          {seccion === 'cocina' && <BloquesCocina cocina={cocina} deshabilitado={guardando} solo="cocina" />}
        </ScrollView>

        <View style={styles.acciones}>
          <Pressable
            style={[styles.botonPrincipal, !puedeGuardar && styles.botonDeshabilitado]}
            onPress={guardarCambios}
            disabled={!puedeGuardar}
            accessibilityRole="button"
            accessibilityLabel="Guardar"
            accessibilityState={{ disabled: !puedeGuardar }}
          >
            <Text style={styles.textoBotonPrincipal}>{guardando ? 'Guardando…' : 'Guardar'}</Text>
          </Pressable>
          {!hayCambios && <Text style={styles.ayuda}>No hay cambios pendientes.</Text>}
        </View>
      </KeyboardAvoidingView>

      <ConfirmarHoja
        visible={salidaPendiente !== null}
        titulo="¿Salir sin guardar?"
        mensaje="Si sales ahora, se perderán tus cambios."
        textoConfirmar="Salir sin guardar"
        icono="close-circle-linear"
        onConfirmar={() => {
          const accion = salidaPendiente;
          setSalidaPendiente(null);
          navigation.dispatch(accion);
        }}
        onCerrar={() => setSalidaPendiente(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  pantalla: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  contenido: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    padding: espaciado.md,
    gap: espaciado.md,
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  circulo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoIntro: {
    flex: 1,
    fontFamily: fuentes.regular,
    fontSize: tamanos.cuerpo,
    lineHeight: 22,
    color: colors.textoSuave,
  },
  bloque: {
    backgroundColor: colors.superficie,
    borderRadius: radios.lg,
    padding: espaciado.md,
  },
  tituloBloque: {
    fontFamily: fuentes.titulo,
    fontSize: 19,
    lineHeight: 26,
    color: colors.texto,
    marginBottom: 12,
  },
  explicacion: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.cuerpo,
    lineHeight: 22,
    color: colors.textoSuave,
    marginTop: -6,
  },
  acciones: {
    paddingHorizontal: espaciado.md,
    paddingTop: espaciado.sm,
    paddingBottom: espaciado.md,
    backgroundColor: colors.superficie,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  ayuda: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.chico,
    color: colors.textoSuave,
    textAlign: 'center',
    marginTop: espaciado.xs,
  },
  botonPrincipal: {
    minHeight: 56,
    backgroundColor: colors.encabezado,
    borderRadius: radios.pill,
    paddingHorizontal: espaciado.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: espaciado.sm,
  },
  textoBotonPrincipal: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.sobreEncabezado,
    textAlign: 'center',
  },
  botonSecundario: {
    minHeight: 56,
    borderWidth: 1.5,
    borderColor: colors.borde,
    backgroundColor: colors.superficie,
    borderRadius: radios.pill,
    paddingHorizontal: espaciado.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: espaciado.sm,
  },
  textoBotonSecundario: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.texto,
    textAlign: 'center',
  },
  botonDeshabilitado: {
    opacity: 0.5,
  },
});
