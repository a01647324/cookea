import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthError, isAuthRetryableFetchError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { colors, espaciado, radios, tipografia } from "../theme/theme";
import CampoFormulario from "./CampoFormulario";
import {
  LONGITUD_CODIGO,
  MINUTOS_CODIGO,
  normalizarCorreo,
  esCorreoValido,
  limpiarCodigo,
} from "./validaciones";

// Supabase no deja mandar otro código a la misma persona antes de 60 segundos
const SEGUNDOS_PARA_REENVIAR = 60;

const MENSAJE_SIN_CONEXION = "No hay conexión. Revisa tu internet e intenta de nuevo.";

// RecuperarClaveScreen: pasos 1 (correo) y 2 (código) de "Recuperar clave".
// El paso 3 (nueva contraseña) es otra pantalla: App.tsx la muestra sola
// cuando el código es correcto.
// (clase) Componente declarado como función y navigation que recibe de React Navigation
export default function RecuperarClaveScreen({ navigation }: any) {
  // (clase) Un useState por cada campo y cada mensaje
  const [paso, setPaso] = useState(1);
  const [correo, setCorreo] = useState("");
  const [codigo, setCodigo] = useState("");

  // (nuevo) Errores bajo cada campo, y un aviso general arriba del formulario
  const [errorCorreo, setErrorCorreo] = useState("");
  const [errorCodigo, setErrorCodigo] = useState("");
  const [aviso, setAviso] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");

  // (clase) Para deshabilitar los botones mientras se espera al servidor
  const [enviando, setEnviando] = useState(false);
  const [verificando, setVerificando] = useState(false);

  // Segundos que faltan para poder reenviar el código
  const [segundos, setSegundos] = useState(0);

  // (nuevo) useRef guarda una referencia al campo del código para poder
  // ponerle el cursor después de limpiarlo.
  const campoCodigo = useRef<TextInput>(null);

  // (nuevo) Cuenta regresiva para "Reenviar código". El intervalo resta un
  // segundo cada vez; se limpia al llegar a 0 o al salir de la pantalla.
  const contando = segundos > 0;
  useEffect(() => {
    if (!contando) return;
    const intervalo = setInterval(() => {
      setSegundos((anterior) => (anterior <= 1 ? 0 : anterior - 1));
    }, 1000);
    return () => clearInterval(intervalo);
  }, [contando]);

  // (clase) Revisamos error.code para dar un mensaje claro, como en LoginScreen
  function mostrarError(error: AuthError) {
    console.log(error.code, error.message);

    // (nuevo) Supabase no lanza el error cuando no hay internet: lo regresa
    // en { error } con este tipo especial.
    if (isAuthRetryableFetchError(error)) {
      setAviso(MENSAJE_SIN_CONEXION);
      return;
    }

    switch (error.code) {
      case "otp_expired":
        setErrorCodigo("El código no es correcto o ya venció. Revísalo o pide uno nuevo.");
        setCodigo("");
        campoCodigo.current?.focus();
        break;
      case "over_email_send_rate_limit":
        setAviso("Ya se enviaron varios correos. Espera unos minutos e intenta de nuevo.");
        break;
      case "over_request_rate_limit":
        setAviso("Hubo demasiados intentos. Espera un momento e intenta de nuevo.");
        break;
      default:
        setAviso("No se pudo completar. Intenta de nuevo.");
    }
  }

  // Limpia el correo y revisa el formato. Regresa el correo limpio, o null
  // si hay un error (y lo muestra bajo el campo).
  function revisarCorreo(): string | null {
    const limpio = normalizarCorreo(correo);
    setCorreo(limpio);

    if (limpio === "") {
      setErrorCorreo("Escribe tu correo.");
      return null;
    }
    if (!esCorreoValido(limpio)) {
      setErrorCorreo("Revisa tu correo. Debe verse así: nombre@correo.com");
      return null;
    }
    setErrorCorreo("");
    return limpio;
  }

  // Manda el correo con el código. Regresa true si salió bien.
  async function mandarCorreo(correoLimpio: string): Promise<boolean> {
    setEnviando(true);
    setAviso("");
    setMensajeExito("");

    // (clase) async/await con try/catch/finally para "fail gracefully"
    try {
      // (nuevo) Supabase responde igual si el correo existe o no, así nadie
      // puede averiguar qué correos están registrados.
      const { error } = await supabase.auth.resetPasswordForEmail(correoLimpio);
      if (error) {
        mostrarError(error);
        return false;
      }
      setSegundos(SEGUNDOS_PARA_REENVIAR);
      return true;
    } catch (e) {
      console.log("Error al enviar el código", e);
      setAviso(MENSAJE_SIN_CONEXION);
      return false;
    } finally {
      // (clase) El finally siempre corre: volvemos a habilitar los botones
      setEnviando(false);
    }
  }

  // Paso 1: botón "Enviar código"
  async function enviarCodigo() {
    if (enviando) return;
    const limpio = revisarCorreo();
    if (limpio === null) return; // no llamamos a Supabase si el correo está mal

    const salioBien = await mandarCorreo(limpio);
    if (salioBien) {
      setCodigo("");
      setErrorCodigo("");
      setPaso(2);
    }
  }

  // Paso 1: link "Ya tengo un código". Pasa al paso 2 sin mandar otro correo.
  function yaTengoCodigo() {
    const limpio = revisarCorreo();
    if (limpio === null) return;
    setAviso("");
    setMensajeExito("");
    setCodigo("");
    setErrorCodigo("");
    setPaso(2);
  }

  // Paso 2: botón "Reenviar código"
  async function reenviarCodigo() {
    if (enviando || segundos > 0) return;
    const salioBien = await mandarCorreo(correo);
    if (salioBien) {
      setCodigo("");
      setErrorCodigo("");
      setMensajeExito("Te enviamos un código nuevo. Usa el más reciente.");
    }
  }

  // Paso 2: revisa el código con Supabase
  async function verificarCodigo(codigoEscrito: string) {
    if (verificando) return;
    if (codigoEscrito.length !== LONGITUD_CODIGO) {
      setErrorCodigo(`El código tiene ${LONGITUD_CODIGO} números. Revisa que esté completo.`);
      return;
    }

    setVerificando(true);
    setAviso("");
    setMensajeExito("");

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: correo,
        token: codigoEscrito,
        type: "recovery",
      });
      if (error) {
        mostrarError(error);
        return;
      }
      // Si salió bien NO navegamos a mano: useSession recibe el evento
      // PASSWORD_RECOVERY y App.tsx muestra la pantalla de nueva contraseña.
    } catch (e) {
      console.log("Error al verificar el código", e);
      setAviso(MENSAJE_SIN_CONEXION);
    } finally {
      setVerificando(false);
    }
  }

  // Paso 2: cada vez que cambia el código. Quita lo que no sea número
  // (sirve al pegar) y, al completar los números, verifica solo.
  function cambiarCodigo(texto: string) {
    const limpio = limpiarCodigo(texto);
    setCodigo(limpio);
    setErrorCodigo("");
    if (limpio.length === LONGITUD_CODIGO) {
      verificarCodigo(limpio);
    }
  }

  // Paso 2: link "¿No es tu correo? Cámbialo". El correo sigue escrito.
  function cambiarCorreo() {
    setAviso("");
    setMensajeExito("");
    setErrorCodigo("");
    setPaso(1);
  }

  // Texto del botón de reenviar según el estado
  let textoReenviar = "Reenviar código";
  if (enviando) textoReenviar = "Enviando código…";
  else if (segundos > 0) textoReenviar = `Reenviar código en ${segundos} s`;

  return (
    <SafeAreaView style={styles.pantalla}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.contenido}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.indicadorPaso}>Paso {paso} de 3</Text>
          <Text style={styles.titulo} accessibilityRole="header">
            {paso === 1 ? "Recuperar contraseña" : "Escribe el código"}
          </Text>

          {/* (nuevo) Aviso general arriba del formulario, en vez de alert() */}
          {aviso !== "" && (
            <View style={styles.aviso} accessibilityLiveRegion="polite">
              <Text style={styles.textoAviso}>{aviso}</Text>
            </View>
          )}
          {mensajeExito !== "" && (
            <View style={styles.avisoExito} accessibilityLiveRegion="polite">
              <Text style={styles.textoAvisoExito}>{mensajeExito}</Text>
            </View>
          )}

          {paso === 1 ? (
            <>
              <Text style={styles.explicacion}>
                Escribe el correo con el que te registraste. Te enviaremos un
                código para crear una contraseña nueva.
              </Text>

              <CampoFormulario
                etiqueta="Correo"
                placeholder="nombre@correo.com"
                value={correo}
                onChangeText={(texto) => {
                  setCorreo(texto);
                  setErrorCorreo("");
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

              <TouchableOpacity
                style={[styles.botonPrincipal, enviando && styles.botonDeshabilitado]}
                onPress={enviarCodigo}
                disabled={enviando}
                accessibilityRole="button"
                accessibilityLabel="Enviar código a mi correo"
              >
                <Text style={styles.textoBotonPrincipal}>
                  {enviando ? "Enviando código…" : "Enviar código"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.link}
                onPress={yaTengoCodigo}
                disabled={enviando}
                accessibilityRole="button"
                accessibilityLabel="Ya tengo un código"
              >
                <Text style={styles.textoLink}>Ya tengo un código</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.explicacion}>
                Te enviamos un código de {LONGITUD_CODIGO} números a{" "}
                <Text style={styles.negrita}>{correo}</Text>.
              </Text>
              <Text style={styles.explicacion}>
                Si no lo ves, revisa también la carpeta de Spam o correo no
                deseado. El código dura {MINUTOS_CODIGO} minutos.
              </Text>

              <CampoFormulario
                ref={campoCodigo}
                etiqueta="Código"
                ayuda={`Son ${LONGITUD_CODIGO} números.`}
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

              <TouchableOpacity
                style={[styles.botonPrincipal, verificando && styles.botonDeshabilitado]}
                onPress={() => verificarCodigo(codigo)}
                disabled={verificando}
                accessibilityRole="button"
                accessibilityLabel="Verificar código"
              >
                <Text style={styles.textoBotonPrincipal}>
                  {verificando ? "Verificando código…" : "Verificar"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.botonSecundario,
                  (enviando || segundos > 0) && styles.botonDeshabilitado,
                ]}
                onPress={reenviarCodigo}
                disabled={enviando || segundos > 0}
                accessibilityRole="button"
                accessibilityLabel={textoReenviar}
              >
                <Text style={styles.textoBotonSecundario}>{textoReenviar}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.link}
                onPress={cambiarCorreo}
                accessibilityRole="button"
                accessibilityLabel="¿No es tu correo? Cámbialo"
              >
                <Text style={styles.textoLink}>¿No es tu correo? Cámbialo</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Siempre visible: salida para regresar al Login */}
          <TouchableOpacity
            style={styles.link}
            onPress={() => navigation.navigate("Login")}
            accessibilityRole="button"
            accessibilityLabel="Regresar a iniciar sesión"
          >
            <Text style={styles.textoLink}>Regresar a iniciar sesión</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// (clase) Estilos al final del archivo. Para cambiar el diseño, solo se toca esto.
const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  contenido: {
    flexGrow: 1,
    padding: espaciado.lg,
  },
  indicadorPaso: {
    ...tipografia.chico,
    fontSize: 14,
    marginBottom: espaciado.xs,
  },
  titulo: {
    ...tipografia.titulo,
    marginBottom: espaciado.md,
  },
  explicacion: {
    ...tipografia.cuerpo,
    fontSize: 16,
    marginBottom: espaciado.md,
  },
  negrita: {
    fontWeight: "700",
  },
  aviso: {
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    borderRadius: radios.sm,
    padding: espaciado.md,
    marginBottom: espaciado.md,
  },
  textoAviso: {
    color: colors.error,
    fontSize: 15,
  },
  avisoExito: {
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: colors.exito,
    borderRadius: radios.sm,
    padding: espaciado.md,
    marginBottom: espaciado.md,
  },
  textoAvisoExito: {
    color: colors.exito,
    fontSize: 15,
  },
  botonPrincipal: {
    minHeight: 48,
    backgroundColor: colors.botonPrincipal,
    borderRadius: radios.pill,
    paddingVertical: espaciado.md,
    paddingHorizontal: espaciado.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: espaciado.sm,
  },
  textoBotonPrincipal: {
    color: colors.textoSobreColor,
    fontSize: 16,
    fontWeight: "700",
  },
  botonSecundario: {
    minHeight: 48,
    borderWidth: 2,
    borderColor: colors.olivaOscuro,
    borderRadius: radios.pill,
    paddingVertical: espaciado.sm,
    paddingHorizontal: espaciado.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: espaciado.md,
  },
  textoBotonSecundario: {
    color: colors.olivaOscuro,
    fontSize: 16,
    fontWeight: "700",
  },
  botonDeshabilitado: {
    opacity: 0.5,
  },
  link: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: espaciado.sm,
  },
  textoLink: {
    color: colors.olivaOscuro,
    fontSize: 16,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
