import Encabezado from '../perfil/Encabezado';
import AvisoFormulario from '../perfil/AvisoFormulario';
import useRetroceso from './useRetroceso';
import PasosRecuperar from './PasosRecuperar';
import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthError, isAuthRetryableFetchError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import Icono from '../components/Icono';
import { colors, espaciado, fuentes, radios, tamanos } from '../theme/theme';
import CampoFormulario from './CampoFormulario';
import { LONGITUD_CODIGO, MINUTOS_CODIGO, normalizarCorreo, esCorreoValido, limpiarCodigo } from './validaciones';

// Supabase no deja mandar otro código a la misma persona antes de 60 segundos
const SEGUNDOS_PARA_REENVIAR = 60;

const MENSAJE_SIN_CONEXION = 'No hay conexión. Revisa tu internet e intenta de nuevo.';

// RecuperarClaveScreen: pasos 1 (correo) y 2 (código) de "Recuperar clave".
// El paso 3 (nueva contraseña) es otra pantalla: App.tsx la muestra sola
// cuando el código es correcto.
export default function RecuperarClaveScreen({ navigation }: any) {
  const [paso, setPaso] = useState<1 | 2>(1);
  const [correo, setCorreo] = useState('');
  const [codigo, setCodigo] = useState('');

  const [errorCorreo, setErrorCorreo] = useState('');
  const [errorCodigo, setErrorCodigo] = useState('');
  const [aviso, setAviso] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  const [enviando, setEnviando] = useState(false);
  const [verificando, setVerificando] = useState(false);

  const bloqueo = useRef(false);
  function volver() {
    if (bloqueo.current || enviando || verificando) return;
    if (paso === 2) { setPaso(1); setCodigo(''); setErrorCodigo(''); setAviso(''); }
    else navigation.goBack();
  }
  useRetroceso(volver);

  // Segundos que faltan para poder reenviar el código
  const [segundos, setSegundos] = useState(0);
  const reenviarDesde = useRef(0);

  const campoCodigo = useRef<TextInput>(null);

  // Cuenta regresiva para "Reenviar código"; se limpia al llegar a 0 o al salir
  const contando = segundos > 0;
  useEffect(() => {
    if (!contando) return;
    const intervalo = setInterval(() => {
      setSegundos(Math.max(0, Math.ceil((reenviarDesde.current - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(intervalo);
  }, [contando]);

  function mostrarError(error: AuthError) {
    // Sin internet, Supabase regresa este tipo de error en vez de lanzarlo
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

  // Regresa el correo limpio, o null si hay un error (y lo muestra bajo el campo)
  function revisarCorreo(): string | null {
    const limpio = normalizarCorreo(correo);
    setCorreo(limpio);

    if (limpio === '') {
      setErrorCorreo('Escribe tu correo.');
      return null;
    }
    if (!esCorreoValido(limpio)) {
      setErrorCorreo('Revisa tu correo. Debe verse así: nombre@correo.com');
      return null;
    }
    setErrorCorreo('');
    return limpio;
  }

  // Manda el correo con el código. Regresa true si salió bien.
  async function mandarCorreo(correoLimpio: string): Promise<boolean> {
    bloqueo.current = true;
    setEnviando(true);
    setAviso('');
    setMensajeExito('');

    try {
      // Supabase responde igual si el correo existe o no, así nadie
      // puede averiguar qué correos están registrados.
      const { error } = await supabase.auth.resetPasswordForEmail(correoLimpio);
      if (error) {
        mostrarError(error);
        return false;
      }
      reenviarDesde.current = Date.now() + SEGUNDOS_PARA_REENVIAR * 1000;
      setSegundos(SEGUNDOS_PARA_REENVIAR);
      return true;
    } catch {
      setAviso(MENSAJE_SIN_CONEXION);
      return false;
    } finally {
      bloqueo.current = false;
      setEnviando(false);
    }
  }

  async function enviarCodigo() {
    if (bloqueo.current || enviando || verificando) return;
    const limpio = revisarCorreo();
    if (limpio === null) return;

    const salioBien = await mandarCorreo(limpio);
    if (salioBien) {
      setCodigo('');
      setErrorCodigo('');
      setPaso(2);
    }
  }

  // "Ya tengo un código": pasa al paso 2 sin mandar otro correo
  function yaTengoCodigo() {
    if (bloqueo.current) return;
    const limpio = revisarCorreo();
    if (limpio === null) return;
    setAviso('');
    setMensajeExito('');
    setCodigo('');
    setErrorCodigo('');
    setPaso(2);
  }

  async function reenviarCodigo() {
    if (bloqueo.current || enviando || verificando || segundos > 0) return;
    const salioBien = await mandarCorreo(correo);
    if (salioBien) {
      setCodigo('');
      setErrorCodigo('');
      setMensajeExito('Te enviamos un código nuevo. Usa el más reciente.');
    }
  }

  async function verificarCodigo(codigoEscrito: string) {
    if (bloqueo.current || enviando || verificando) return;
    if (codigoEscrito.length !== LONGITUD_CODIGO) {
      setErrorCodigo(`El código tiene ${LONGITUD_CODIGO} números. Revisa que esté completo.`);
      return;
    }

    bloqueo.current = true;
    setVerificando(true);
    setAviso('');
    setMensajeExito('');

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: correo,
        token: codigoEscrito,
        type: 'recovery',
      });
      if (error) {
        mostrarError(error);
        return;
      }
      // Si salió bien NO navegamos a mano: useSession recibe PASSWORD_RECOVERY
      // y App.tsx muestra la pantalla de nueva contraseña.
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
    if (limpio.length === LONGITUD_CODIGO) {
      verificarCodigo(limpio);
    }
  }

  function cambiarCorreo() {
    if (bloqueo.current) return;
    setAviso('');
    setMensajeExito('');
    setErrorCodigo('');
    setCodigo('');
    setPaso(1);
  }

  let textoReenviar = 'Reenviar código';
  if (enviando) textoReenviar = 'Enviando código…';
  else if (segundos > 0) textoReenviar = `Reenviar en ${segundos} s`;

  const ocupado = enviando || verificando;

  return (
    <SafeAreaView style={styles.pantalla}>
      <Encabezado titulo="Recuperar contraseña" onVolver={volver} deshabilitado={ocupado} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
          {paso === 1 ? (
            <PasosRecuperar
              paso={1}
              icono="key-linear"
              colorIcono={colors.calidoIntenso}
              fondoIcono={colors.calidoSuave}
              titulo="¿Olvidaste tu contraseña?"
            >
              <Text style={styles.explicacion}>
                Escribe el correo con el que te registraste. Te enviaremos un código para crear una contraseña nueva.
              </Text>
            </PasosRecuperar>
          ) : (
            <PasosRecuperar
              paso={2}
              icono="letter-linear"
              colorIcono={colors.serenoIntenso}
              fondoIcono={colors.serenoSuave}
              titulo="Revisa tu correo"
            >
              <Text style={styles.explicacion}>
                Te enviamos un código de {LONGITUD_CODIGO} números a{'\n'}
                <Text style={styles.negrita}>{correo}</Text>
              </Text>
            </PasosRecuperar>
          )}

          <AvisoFormulario texto={aviso} />
          {mensajeExito !== '' && (
            <View style={styles.exito} accessibilityLiveRegion="polite">
              <Icono nombre="check-circle-linear" size={22} color={colors.acentoOscuro} />
              <Text style={styles.textoExito}>{mensajeExito}</Text>
            </View>
          )}

          <View style={styles.tarjeta}>
            {paso === 1 ? (
              <CampoFormulario
                etiqueta="Correo"
                placeholder="nombre@correo.com"
                value={correo}
                onChangeText={(texto) => {
                  setCorreo(texto);
                  setErrorCorreo('');
                }}
                error={errorCorreo}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="send"
                onSubmitEditing={enviarCodigo}
                editable={!enviando}
              />
            ) : (
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
                onSubmitEditing={() => verificarCodigo(codigo)}
                editable={!verificando}
              />
            )}

            <Pressable
              style={({ pressed }) => [styles.botonPrincipal, (pressed || ocupado) && styles.botonOcupado]}
              onPress={paso === 1 ? enviarCodigo : () => verificarCodigo(codigo)}
              disabled={ocupado}
              accessibilityRole="button"
              accessibilityState={{ disabled: ocupado, busy: ocupado }}
              accessibilityLabel={paso === 1 ? 'Enviar código a mi correo' : 'Verificar código'}
            >
              {(paso === 1 ? enviando : verificando) && <ActivityIndicator color={colors.sobreEncabezado} />}
              <Text style={styles.textoBotonPrincipal}>
                {paso === 1
                  ? enviando ? 'Enviando código…' : 'Enviar código'
                  : verificando ? 'Verificando…' : 'Verificar'}
              </Text>
            </Pressable>

            {paso === 2 && (
              <Pressable
                style={[styles.botonSecundario, (enviando || segundos > 0) && styles.botonDeshabilitado]}
                onPress={reenviarCodigo}
                disabled={enviando || segundos > 0}
                accessibilityRole="button"
                accessibilityLabel={textoReenviar}
              >
                <Icono nombre={segundos > 0 ? 'clock-circle-linear' : 'refresh-linear'} size={20} color={colors.acentoOscuro} />
                <Text style={styles.textoBotonSecundario}>{textoReenviar}</Text>
              </Pressable>
            )}
          </View>

          {paso === 2 && (
            <View style={styles.nota}>
              <Icono nombre="info-circle-linear" size={20} color={colors.textoSuave} />
              <Text style={styles.textoNota}>¿No lo ves? Revisa también la carpeta de Spam o correo no deseado.</Text>
            </View>
          )}

          <Pressable
            style={styles.link}
            onPress={paso === 1 ? yaTengoCodigo : cambiarCorreo}
            disabled={ocupado}
            accessibilityRole="button"
          >
            <Text style={styles.textoLink}>{paso === 1 ? 'Ya tengo un código' : '¿No es tu correo? Cámbialo'}</Text>
          </Pressable>

          <Pressable
            style={styles.link}
            onPress={() => navigation.navigate('Login')}
            disabled={ocupado}
            accessibilityRole="button"
            accessibilityLabel="Regresar a iniciar sesión"
          >
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
