import useRetroceso from './useRetroceso';
import Encabezado from '../perfil/Encabezado';
import AvisoFormulario from '../perfil/AvisoFormulario';
import PantallaListo from '../perfil/PantallaListo';
import { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthError, isAuthRetryableFetchError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import Icono from '../components/Icono';
import { colors, espaciado, fuentes, radios, tamanos } from '../theme/theme';
import CampoFormulario from './CampoFormulario';
import { AYUDA_CONTRASENA, validarNuevaContrasena } from './validaciones';

const MENSAJE_SIN_CONEXION = 'No hay conexión. Revisa tu internet e intenta de nuevo.';

// CambiarContrasenaScreen: con sesión iniciada, cambia la contraseña escribiendo la actual.
// El servidor revisa la actual y guarda la nueva en una sola operación.
export default function CambiarContrasenaScreen({ navigation }: any) {
  const [actual, setActual] = useState('');
  const bloqueo = useRef(false);
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [errorActual, setErrorActual] = useState('');
  const [errorNueva, setErrorNueva] = useState('');
  const [errorConfirmacion, setErrorConfirmacion] = useState('');
  const [aviso, setAviso] = useState('');

  const [guardando, setGuardando] = useState(false);
  const [listo, setListo] = useState(false);
  useRetroceso(() => {
    if (!bloqueo.current && !guardando) navigation.goBack();
  });

  const campoNueva = useRef<TextInput>(null);
  const campoConfirmacion = useRef<TextInput>(null);

  function mostrarError(error: AuthError) {
    // Sin internet, Supabase regresa este tipo de error en vez de lanzarlo
    if (isAuthRetryableFetchError(error)) {
      setAviso(MENSAJE_SIN_CONEXION);
      return;
    }
    const codigo: string | undefined = error.code;
    switch (codigo) {
      case 'current_password_invalid':
      case 'current_password_mismatch':
        setErrorActual('Tu contraseña actual no es correcta.');
        break;
      case 'current_password_required':
        setErrorActual('Escribe tu contraseña actual.');
        break;
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
    if (bloqueo.current || guardando) return;

    setErrorActual('');
    setErrorNueva('');
    setErrorConfirmacion('');
    setAviso('');

    if (actual === '') {
      setErrorActual('Escribe tu contraseña actual.');
      return;
    }
    const problema = validarNuevaContrasena(nueva, confirmacion);
    if (problema !== null) {
      if (problema.campo === 'nueva') setErrorNueva(problema.mensaje);
      else setErrorConfirmacion(problema.mensaje);
      return;
    }
    if (nueva === actual) {
      setErrorNueva('La nueva contraseña debe ser diferente a la anterior.');
      return;
    }

    bloqueo.current = true;
    setGuardando(true);

    try {
      // Supabase revisa current_password y, si es correcta, guarda la nueva.
      // También cierra las sesiones de otros dispositivos; esta sigue abierta.
      const { error } = await supabase.auth.updateUser({ password: nueva, current_password: actual });
      if (error) {
        mostrarError(error);
        return;
      }
      setListo(true);
    } catch {
      setAviso(MENSAJE_SIN_CONEXION);
    } finally {
      bloqueo.current = false;
      setGuardando(false);
    }
  }

  const volver = () => {
    if (!bloqueo.current && !guardando) navigation.goBack();
  };
  const encabezado = <Encabezado titulo="Cambiar contraseña" onVolver={volver} deshabilitado={guardando} />;

  if (listo) {
    return (
      <SafeAreaView style={styles.pantalla} edges={['top']}>
        {encabezado}
        <PantallaListo
          titulo="Tu contraseña se actualizó"
          texto="Desde ahora usa tu nueva contraseña para iniciar sesión. Si tenías la cuenta abierta en otro celular, ahí tendrás que entrar de nuevo."
          onVolver={volver}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.pantalla} edges={['top']}>
      {encabezado}
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
          <View style={styles.intro}>
            <View style={styles.circulo}>
              <Icono nombre="lock-keyhole-linear" size={30} color={colors.serenoIntenso} />
            </View>
            <Text style={styles.textoIntro}>Para cuidar tu cuenta, primero escribe la contraseña que usas ahora.</Text>
          </View>

          <AvisoFormulario texto={aviso} />

          <View style={styles.tarjeta}>
            <CampoFormulario
              etiqueta="Contraseña actual"
              esContrasena
              value={actual}
              onChangeText={(texto) => {
                setActual(texto);
                setErrorActual('');
              }}
              error={errorActual}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="next"
              onSubmitEditing={() => campoNueva.current?.focus()}
              submitBehavior="submit"
              editable={!guardando}
            />
          </View>

          <View style={[styles.tarjeta, { marginTop: espaciado.md }]}>
            <CampoFormulario
              ref={campoNueva}
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
              editable={!guardando}
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
              editable={!guardando}
            />
          </View>
        </ScrollView>

        <View style={styles.acciones}>
          <Pressable
            style={[styles.botonPrincipal, guardando && styles.botonDeshabilitado]}
            onPress={guardar}
            disabled={guardando}
            accessibilityRole="button"
            accessibilityLabel="Guardar contraseña"
          >
            <Text style={styles.textoBotonPrincipal}>{guardando ? 'Guardando contraseña…' : 'Guardar contraseña'}</Text>
          </Pressable>
          <Pressable style={styles.botonTexto} onPress={volver} accessibilityRole="button" accessibilityLabel="Cancelar y volver">
            <Text style={styles.textoBotonTexto}>Cancelar</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  flex: {
    flex: 1,
  },
  contenido: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    padding: espaciado.md,
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: espaciado.md,
  },
  circulo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.serenoSuave,
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
  tarjeta: {
    backgroundColor: colors.superficie,
    borderRadius: radios.lg,
    padding: espaciado.md,
    paddingBottom: espaciado.xs,
  },
  acciones: {
    paddingHorizontal: espaciado.md,
    paddingTop: espaciado.sm,
    paddingBottom: espaciado.sm,
    backgroundColor: colors.superficie,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
  botonTexto: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBotonTexto: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.cuerpo,
    color: colors.textoSuave,
  },
  botonDeshabilitado: {
    opacity: 0.5,
  },
});
