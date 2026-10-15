import Encabezado from '../perfil/Encabezado';
import AvisoFormulario from '../perfil/AvisoFormulario';
import useRetroceso from './useRetroceso';
import { prepararCorreoAcceso } from './correoAcceso';
import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthError, isAuthRetryableFetchError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import Icono from '../components/Icono';
import { colors, espaciado, fuentes, radios, tamanos } from '../theme/theme';
import CampoFormulario from './CampoFormulario';
import { LONGITUD_CODIGO, MINUTOS_CODIGO, limpiarCodigo } from './validaciones';

// Supabase no deja mandar otro correo a la misma persona antes de 60 segundos
const SEGUNDOS_PARA_REENVIAR = 60;

const MENSAJE_SIN_CONEXION = 'No hay conexión. Revisa tu internet e intenta de nuevo.';

// ConfirmarCorreoScreen: después de crear la cuenta, la persona escribe el
// código que llegó a su correo. Si es correcto, Supabase inicia sesión y
// App.tsx muestra la app sola (no navegamos a mano).
// Llega desde SignUp (recienEnviado: el correo acaba de salir) o desde Login
// cuando la cuenta aún no está confirmada.
export default function ConfirmarCorreoScreen({ navigation, route }: any) {
  const correo: string = route.params?.correo ?? '';
  const recienEnviado: boolean = !!route.params?.recienEnviado;

  const [codigo, setCodigo] = useState('');
  const [errorCodigo, setErrorCodigo] = useState('');
  const [aviso, setAviso] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [verificando, setVerificando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const bloqueo = useRef(false);
  const campoCodigo = useRef<TextInput>(null);

  // Cuenta regresiva para "Reenviar código"
  const reenviarDesde = useRef(recienEnviado ? Date.now() + SEGUNDOS_PARA_REENVIAR * 1000 : 0);
  const [segundos, setSegundos] = useState(recienEnviado ? SEGUNDOS_PARA_REENVIAR : 0);
  const contando = segundos > 0;
  useEffect(() => {
    if (!contando) return;
    const intervalo = setInterval(() => {
      setSegundos(Math.max(0, Math.ceil((reenviarDesde.current - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(intervalo);
  }, [contando]);

  function irALogin() {
    if (bloqueo.current) return;
    prepararCorreoAcceso(correo);
    navigation.navigate('Login');
  }
  useRetroceso(irALogin);

  function mostrarError(error: AuthError) {
    if (isAuthRetryableFetchError(error)) {
      setAviso(MENSAJE_SIN_CONEXION);
      return;
    }
    switch (error.code) {
      case 'otp_expired':
        setErrorCodigo('El código no es correcto o ya venció. Revísalo o pide uno nuevo.');
        setCodigo('');
        campoCodigo.current?.focus();
        break;
      case 'over_email_send_rate_limit':
        setAviso('Ya se enviaron varios correos. Espera unos minutos e intenta de nuevo.');
        break;
      case 'over_request_rate_limit':
        setAviso('Hubo demasiados intentos. Espera un momento e intenta de nuevo.');
        break;
      default:
        setAviso('No se pudo completar. Intenta de nuevo.');
    }
  }

  // Revisa el código con Supabase. Si es correcto, la sesión se abre sola.
  async function verificar(codigoEscrito: string) {
    if (bloqueo.current || verificando || enviando) return;
    if (codigoEscrito.length !== LONGITUD_CODIGO) {
      setErrorCodigo(`El código tiene ${LONGITUD_CODIGO} números. Revisa que esté completo.`);
      return;
    }

    bloqueo.current = true;
    setVerificando(true);
    setAviso('');
    setMensajeExito('');
    try {
      const { error } = await supabase.auth.verifyOtp({ email: correo, token: codigoEscrito, type: 'email' });
      if (error) mostrarError(error);
    } catch {
      setAviso(MENSAJE_SIN_CONEXION);
    } finally {
      bloqueo.current = false;
      setVerificando(false);
    }
  }

  // Quita lo que no sea número (sirve al pegar) y, al completar, verifica solo
  function cambiarCodigo(texto: string) {
    const limpio = limpiarCodigo(texto);
    setCodigo(limpio);
    setErrorCodigo('');
    if (limpio.length === LONGITUD_CODIGO) verificar(limpio);
  }

  async function reenviar() {
    if (bloqueo.current || enviando || verificando || segundos > 0) return;
    bloqueo.current = true;
    setEnviando(true);
    setAviso('');
    setMensajeExito('');
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: correo });
      if (error) {
        mostrarError(error);
        return;
      }
      reenviarDesde.current = Date.now() + SEGUNDOS_PARA_REENVIAR * 1000;
      setSegundos(SEGUNDOS_PARA_REENVIAR);
      setCodigo('');
      setErrorCodigo('');
      setMensajeExito('Te enviamos un código nuevo. Usa el más reciente.');
    } catch {
      setAviso(MENSAJE_SIN_CONEXION);
    } finally {
      bloqueo.current = false;
      setEnviando(false);
    }
  }

  let textoReenviar = 'Reenviar código';
  if (enviando) textoReenviar = 'Enviando código…';
  else if (segundos > 0) textoReenviar = `Reenviar en ${segundos} s`;

  const ocupado = verificando || enviando;

  return (
    <SafeAreaView style={styles.pantalla}>
      <Encabezado titulo="Confirmar correo" onVolver={irALogin} textoVolver="Ir a iniciar sesión" deshabilitado={ocupado} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
          <View style={styles.intro}>
            <View style={styles.halo}>
              <View style={styles.circulo}>
                <Icono nombre="letter-linear" size={36} color={colors.serenoIntenso} />
              </View>
            </View>
            <Text style={styles.titulo} accessibilityRole="header">
              Revisa tu correo
            </Text>
            <Text style={styles.explicacion}>
              {recienEnviado ? 'Te enviamos' : 'Escribe'} el código de {LONGITUD_CODIGO} números que llegó a{'\n'}
              <Text style={styles.negrita}>{correo}</Text>
            </Text>
          </View>

          <AvisoFormulario texto={aviso} />
          {mensajeExito !== '' && (
            <View style={styles.exito} accessibilityLiveRegion="polite">
              <Icono nombre="check-circle-linear" size={22} color={colors.acentoOscuro} />
              <Text style={styles.textoExito}>{mensajeExito}</Text>
            </View>
          )}

          <View style={styles.tarjeta}>
            <CampoFormulario
              ref={campoCodigo}
              etiqueta="Código"
              ayuda={`Son ${LONGITUD_CODIGO} números. Dura ${MINUTOS_CODIGO} minutos.`}
              value={codigo}
              onChangeText={cambiarCodigo}
              error={errorCodigo}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => verificar(codigo)}
              editable={!verificando}
            />

            <Pressable
              style={({ pressed }) => [styles.botonPrincipal, (pressed || ocupado) && styles.botonOcupado]}
              onPress={() => verificar(codigo)}
              disabled={ocupado}
              accessibilityRole="button"
              accessibilityState={{ disabled: ocupado, busy: verificando }}
              accessibilityLabel="Confirmar mi cuenta"
            >
              {verificando && <ActivityIndicator color={colors.sobreEncabezado} />}
              <Text style={styles.textoBotonPrincipal}>{verificando ? 'Confirmando…' : 'Confirmar mi cuenta'}</Text>
            </Pressable>

            <Pressable
              style={[styles.botonSecundario, (enviando || segundos > 0) && styles.botonDeshabilitado]}
              onPress={reenviar}
              disabled={enviando || segundos > 0}
              accessibilityRole="button"
              accessibilityLabel={textoReenviar}
            >
              <Icono nombre={segundos > 0 ? 'clock-circle-linear' : 'refresh-linear'} size={20} color={colors.acentoOscuro} />
              <Text style={styles.textoBotonSecundario}>{textoReenviar}</Text>
            </Pressable>
          </View>

          <View style={styles.nota}>
            <Icono nombre="info-circle-linear" size={20} color={colors.textoSuave} />
            <Text style={styles.textoNota}>¿No lo ves? Revisa también la carpeta de Spam o correo no deseado.</Text>
          </View>

          <Pressable
            style={styles.link}
            onPress={() => navigation.navigate('SignUp')}
            disabled={ocupado}
            accessibilityRole="button"
          >
            <Text style={styles.textoLink}>¿No es tu correo? Regístrate de nuevo</Text>
          </Pressable>
          <Pressable style={styles.link} onPress={irALogin} disabled={ocupado} accessibilityRole="button">
            <Text style={styles.textoLinkSuave}>Regresar a iniciar sesión</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingBottom: espaciado.xl,
  },
  intro: { alignItems: 'center', marginTop: espaciado.sm, marginBottom: espaciado.lg },
  halo: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: colors.serenoSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circulo: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontFamily: fuentes.titulo,
    fontSize: 26,
    lineHeight: 34,
    color: colors.texto,
    textAlign: 'center',
    marginTop: espaciado.md,
    marginBottom: espaciado.xs,
  },
  explicacion: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.destacado,
    lineHeight: 24,
    color: colors.textoSuave,
    textAlign: 'center',
    maxWidth: 360,
  },
  negrita: { fontFamily: fuentes.negrita, color: colors.texto },
  exito: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espaciado.sm,
    backgroundColor: colors.acentoSuave,
    borderRadius: radios.md,
    padding: 14,
    marginBottom: espaciado.md,
  },
  textoExito: {
    flex: 1,
    fontFamily: fuentes.semibold,
    fontSize: tamanos.cuerpo,
    lineHeight: 22,
    color: colors.acentoOscuro,
  },
  tarjeta: {
    backgroundColor: colors.superficie,
    borderRadius: radios.lg,
    padding: espaciado.md,
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
    marginTop: espaciado.xs,
  },
  botonOcupado: { opacity: 0.7 },
  textoBotonPrincipal: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.sobreEncabezado,
    textAlign: 'center',
  },
  botonSecundario: {
    flexDirection: 'row',
    gap: 8,
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colors.encabezado,
    borderRadius: radios.pill,
    paddingHorizontal: espaciado.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: espaciado.sm,
  },
  textoBotonSecundario: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.cuerpo,
    color: colors.acentoOscuro,
  },
  botonDeshabilitado: { opacity: 0.5 },
  nota: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espaciado.sm,
    paddingHorizontal: espaciado.xs,
    marginTop: espaciado.md,
  },
  textoNota: {
    flex: 1,
    fontFamily: fuentes.regular,
    fontSize: tamanos.base,
    lineHeight: 21,
    color: colors.textoSuave,
  },
  link: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: espaciado.xs },
  textoLink: { fontFamily: fuentes.negrita, fontSize: tamanos.cuerpo, color: colors.acentoOscuro },
  textoLinkSuave: { fontFamily: fuentes.semibold, fontSize: tamanos.cuerpo, color: colors.textoSuave },
});
