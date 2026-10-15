import Encabezado from '../perfil/Encabezado';
import AvisoFormulario from '../perfil/AvisoFormulario';
import PantallaListo from '../perfil/PantallaListo';
import useRetroceso from './useRetroceso';
import PasosRecuperar from './PasosRecuperar';
import { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthError, isAuthRetryableFetchError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { ConfirmarHoja } from '../components/ConfirmarHoja';
import { colors, espaciado, fuentes, radios, tamanos } from '../theme/theme';
import CampoFormulario from './CampoFormulario';
import { AYUDA_CONTRASENA, validarNuevaContrasena } from './validaciones';

const MENSAJE_SIN_CONEXION = 'No hay conexión. Revisa tu internet e intenta de nuevo.';

// App.tsx le pasa estas funciones de useSession, para que al terminar o
// cancelar cambie la pantalla que se muestra.
type Props = {
  onGuardada: () => Promise<void>; // borra el dato "recuperando" del celular
  onTerminar: () => void;
  onCancelar: () => Promise<void>;
};

// NuevaContrasenaScreen: paso 3 de "Recuperar clave".
// Ya hay sesión (el código del correo fue correcto); falta la nueva contraseña.
export default function NuevaContrasenaScreen({ onGuardada, onTerminar, onCancelar }: Props) {
  const bloqueo = useRef(false);
  const confirmacionAbierta = useRef(false);
  const [hojaCancelar, setHojaCancelar] = useState(false);
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [errorNueva, setErrorNueva] = useState('');
  const [errorConfirmacion, setErrorConfirmacion] = useState('');
  const [aviso, setAviso] = useState('');

  const [guardando, setGuardando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [listo, setListo] = useState(false);

  const campoConfirmacion = useRef<TextInput>(null);

  function mostrarError(error: AuthError) {
    if (isAuthRetryableFetchError(error)) {
      setAviso(MENSAJE_SIN_CONEXION);
      return;
    }

    switch (error.code) {
      case 'same_password':
        setErrorNueva('La nueva contraseña debe ser diferente a la anterior.');
        break;
      case 'weak_password':
        setErrorNueva('Esta contraseña es muy fácil de adivinar. Elige otra.');
        break;
      case 'over_request_rate_limit':
        setAviso('Hubo demasiados intentos. Espera un momento e intenta de nuevo.');
        break;
      default:
        setAviso('No se pudo completar. Intenta de nuevo.');
    }
  }

  async function guardar() {
    if (bloqueo.current || guardando || cancelando || listo || confirmacionAbierta.current) return;

    setErrorNueva('');
    setErrorConfirmacion('');
    setAviso('');
    const problema = validarNuevaContrasena(nueva, confirmacion);
    if (problema !== null) {
      if (problema.campo === 'nueva') setErrorNueva(problema.mensaje);
      else setErrorConfirmacion(problema.mensaje);
      return;
    }

    bloqueo.current = true;
    setGuardando(true);

    try {
      // La sesión viene de una recuperación: el código del correo ya probó
      // que es la dueña, por eso no se pide la contraseña actual.
      const { error } = await supabase.auth.updateUser({ password: nueva });
      if (error) {
        mostrarError(error);
        return;
      }
      // Borramos el dato del celular antes de mostrar el éxito, por si la
      // persona cierra la app en esa pantalla.
      setListo(true);
      try { await onGuardada(); }
      catch { setAviso('Tu contraseña se actualizó, pero no pudimos guardar el estado en este dispositivo.'); }
    } catch {
      setAviso(MENSAJE_SIN_CONEXION);
    } finally {
      bloqueo.current = false;
      setGuardando(false);
    }
  }

  async function cancelar() {
    if (bloqueo.current || guardando || cancelando || listo) return;
    bloqueo.current = true;
    setCancelando(true);
    // useSession cierra la sesión y App.tsx regresa al Login.
    // La contraseña anterior sigue funcionando.
    try { await onCancelar(); }
    catch { setAviso('No se pudo cancelar. Intenta de nuevo.'); }
    finally { bloqueo.current = false; setCancelando(false); }
  }

  // Abre la hoja "¿Cancelar el cambio?" (antes era un Alert)
  function confirmarCancelar() {
    if (confirmacionAbierta.current || bloqueo.current || guardando || cancelando || listo) return;
    confirmacionAbierta.current = true;
    setHojaCancelar(true);
  }
  function seguirAqui() {
    confirmacionAbierta.current = false;
    setHojaCancelar(false);
  }
  function aceptarCancelar() {
    confirmacionAbierta.current = false;
    setHojaCancelar(false);
    void cancelar();
  }
  useRetroceso(() => { if (listo) onTerminar(); else if (hojaCancelar) seguirAqui(); else confirmarCancelar(); });

  if (listo) {
    return (
      <SafeAreaView style={styles.pantalla}>
        <Encabezado titulo="Nueva contraseña" />
        <View style={styles.avisoListo}>
          <AvisoFormulario texto={aviso} />
        </View>
        <PantallaListo
          titulo="Tu contraseña se actualizó"
          texto="Desde ahora usa tu nueva contraseña para iniciar sesión."
          textoBoton="Continuar"
          onVolver={onTerminar}
        />
      </SafeAreaView>
    );
  }

  const ocupado = guardando || cancelando;

  return (
    <SafeAreaView style={styles.pantalla}>
      <Encabezado titulo="Nueva contraseña" onVolver={confirmarCancelar} textoVolver="Cancelar" deshabilitado={ocupado} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
          <PasosRecuperar
            paso={3}
            icono="shield-check-linear"
            colorIcono={colors.acentoOscuro}
            fondoIcono={colors.acentoSuave}
            titulo="Crea tu nueva contraseña"
          >
            <Text style={styles.explicacion}>Elige una que no hayas usado antes en Cookea.</Text>
          </PasosRecuperar>

          <AvisoFormulario texto={aviso} />

          <View style={styles.tarjeta}>
            <CampoFormulario
              etiqueta="Nueva contraseña"
              ayuda={AYUDA_CONTRASENA}
              esContrasena
              value={nueva}
              onChangeText={(texto) => {
                setNueva(texto);
                setErrorNueva('');
              }}
              error={errorNueva}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
              onSubmitEditing={() => campoConfirmacion.current?.focus()}
              submitBehavior="submit"
              editable={!ocupado}
            />
            <CampoFormulario
              ref={campoConfirmacion}
              etiqueta="Repite la nueva contraseña"
              esContrasena
              value={confirmacion}
              onChangeText={(texto) => {
                setConfirmacion(texto);
                setErrorConfirmacion('');
              }}
              error={errorConfirmacion}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={guardar}
              editable={!ocupado}
            />
          </View>
        </ScrollView>

        <View style={styles.acciones}>
          <Pressable
            style={({ pressed }) => [styles.botonPrincipal, (pressed || ocupado) && styles.botonOcupado]}
            onPress={guardar}
            disabled={ocupado}
            accessibilityRole="button"
            accessibilityState={{ disabled: ocupado, busy: guardando }}
            accessibilityLabel="Guardar contraseña"
          >
            {guardando && <ActivityIndicator color={colors.sobreEncabezado} />}
            <Text style={styles.textoBotonPrincipal}>{guardando ? 'Guardando…' : 'Guardar contraseña'}</Text>
          </Pressable>
          <Pressable
            style={styles.botonTexto}
            onPress={confirmarCancelar}
            disabled={ocupado}
            accessibilityRole="button"
            accessibilityLabel="Cancelar y regresar a iniciar sesión"
          >
            <Text style={styles.textoBotonTexto}>{cancelando ? 'Cancelando…' : 'Cancelar'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <ConfirmarHoja
        visible={hojaCancelar}
        icono="close-circle-linear"
        titulo="¿Cancelar el cambio de contraseña?"
        mensaje="Tu contraseña anterior seguirá funcionando."
        textoConfirmar="Cancelar cambio"
        onConfirmar={aceptarCancelar}
        onCerrar={seguirAqui}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colors.fondo },
  flex: { flex: 1 },
  contenido: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    padding: espaciado.md,
  },
  explicacion: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.destacado,
    lineHeight: 24,
    color: colors.textoSuave,
    textAlign: 'center',
    maxWidth: 360,
  },
  tarjeta: {
    backgroundColor: colors.superficie,
    borderRadius: radios.lg,
    padding: espaciado.md,
    paddingBottom: espaciado.xs,
  },
  avisoListo: { paddingHorizontal: espaciado.md },
  acciones: {
    paddingHorizontal: espaciado.md,
    paddingTop: espaciado.sm,
    paddingBottom: espaciado.sm,
    backgroundColor: colors.superficie,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  botonPrincipal: {
    flexDirection: 'row',
    gap: 8,
    minHeight: 56,
    backgroundColor: colors.encabezado,
    borderRadius: radios.pill,
    paddingHorizontal: espaciado.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: espaciado.sm,
  },
  botonOcupado: { opacity: 0.7 },
  textoBotonPrincipal: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.sobreEncabezado,
    textAlign: 'center',
  },
  botonTexto: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  textoBotonTexto: { fontFamily: fuentes.semibold, fontSize: tamanos.cuerpo, color: colors.textoSuave },
});
