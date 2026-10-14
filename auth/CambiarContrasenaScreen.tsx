import useRetroceso from "./useRetroceso";
import Encabezado from "../perfil/Encabezado";
import { useRef, useState } from "react";
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
import { AYUDA_CONTRASENA, validarNuevaContrasena } from "./validaciones";

const MENSAJE_SIN_CONEXION = "No hay conexión. Revisa tu internet e intenta de nuevo.";

// CambiarContrasenaScreen: con sesión iniciada, cambia la contraseña
// escribiendo la actual. El servidor revisa la actual y guarda la nueva
// en una sola operación: si la actual está mal, no cambia nada.
// (clase) Componente declarado como función y navigation que recibe de React Navigation
export default function CambiarContrasenaScreen({ navigation }: any) {
  // (clase) Un useState por cada campo y cada mensaje
  const [actual, setActual] = useState("");
  const bloqueo = useRef(false);
  const [nueva, setNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [errorActual, setErrorActual] = useState("");
  const [errorNueva, setErrorNueva] = useState("");
  const [errorConfirmacion, setErrorConfirmacion] = useState("");
  const [aviso, setAviso] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [listo, setListo] = useState(false);
  useRetroceso(() => { if (!bloqueo.current && !guardando) navigation.goBack(); }); // true cuando ya se guardó

  // (nuevo) useRef para pasar al campo de abajo con la tecla "siguiente"
  const campoNueva = useRef<TextInput>(null);
  const campoConfirmacion = useRef<TextInput>(null);

  // (clase) Revisamos error.code para dar un mensaje claro, como en LoginScreen
  function mostrarError(error: AuthError) {

    // (nuevo) Sin internet, Supabase regresa este tipo de error en vez de lanzarlo
    if (isAuthRetryableFetchError(error)) {
      setAviso(MENSAJE_SIN_CONEXION);
      return;
    }

    // (nuevo) error.code puede traer códigos que la librería no tiene en su
    // lista, por eso lo tratamos como texto.
    const codigo: string | undefined = error.code;
    switch (codigo) {
      // Supabase puede usar cualquiera de estos dos nombres para el mismo error
      case "current_password_invalid":
      case "current_password_mismatch":
        setErrorActual("Tu contraseña actual no es correcta.");
        break;
      case "current_password_required":
        setErrorActual("Escribe tu contraseña actual.");
        break;
      case "same_password":
        setErrorNueva("La nueva contraseña debe ser diferente a la anterior.");
        break;
      case "weak_password":
        setErrorNueva("Esta contraseña es muy fácil de adivinar. Elige otra.");
        break;
      case "over_request_rate_limit":
        setAviso("Hubo demasiados intentos. Espera un momento e intenta de nuevo.");
        break;
      default:
        setAviso("No se pudo completar. Intenta de nuevo.");
    }
  }

  async function guardar() {
    if (bloqueo.current || guardando) return;

    // (clase) Validaciones en el celular antes de llamar al servidor
    setErrorActual("");
    setErrorNueva("");
    setErrorConfirmacion("");
    setAviso("");

    if (actual === "") {
      setErrorActual("Escribe tu contraseña actual.");
      return;
    }
    const problema = validarNuevaContrasena(nueva, confirmacion);
    if (problema !== null) {
      if (problema.campo === "nueva") setErrorNueva(problema.mensaje);
      else setErrorConfirmacion(problema.mensaje);
      return;
    }
    if (nueva === actual) {
      setErrorNueva("La nueva contraseña debe ser diferente a la anterior.");
      return;
    }

    bloqueo.current = true;
    setGuardando(true);

    // (clase) async/await con try/catch/finally para "fail gracefully"
    try {
      // (nuevo) Una sola llamada: Supabase revisa current_password y, si es
      // correcta, guarda la nueva. También cierra las sesiones de otros
      // dispositivos; esta sigue abierta.
      const { error } = await supabase.auth.updateUser({
        password: nueva,
        current_password: actual,
      });
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

  // Pantalla de éxito, con un botón para volver (no una alerta)
  if (listo) {
    return (
      <SafeAreaView style={styles.pantalla} edges={["top"]}>
        <Encabezado titulo="Cambiar contraseña" onVolver={() => navigation.goBack()} deshabilitado={guardando} />
        <View style={styles.contenido}>
          <Text style={styles.titulo} accessibilityRole="header">
            Tu contraseña se actualizó
          </Text>
          <Text style={styles.explicacion}>
            Desde ahora usa tu nueva contraseña para iniciar sesión. Si tenías
            la cuenta abierta en otro celular, ahí tendrás que entrar de nuevo.
          </Text>
          <TouchableOpacity
            style={styles.botonPrincipal}
            onPress={() => { if (!bloqueo.current && !guardando) navigation.goBack(); }}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Text style={styles.textoBotonPrincipal}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.pantalla} edges={["top"]}>
        <Encabezado titulo="Cambiar contraseña" onVolver={() => navigation.goBack()} deshabilitado={guardando} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.contenido}
          keyboardShouldPersistTaps="handled"
        >
          

          {/* (nuevo) Aviso general arriba del formulario, en vez de alert() */}
          {aviso !== "" && (
            <View style={styles.aviso} accessibilityLiveRegion="polite">
              <Text style={styles.textoAviso}>{aviso}</Text>
            </View>
          )}

          <CampoFormulario
            etiqueta="Contraseña actual"
            esContrasena
            value={actual}
            onChangeText={(texto) => {
              setActual(texto);
              setErrorActual("");
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

          <CampoFormulario
            ref={campoNueva}
            etiqueta="Nueva contraseña"
            ayuda={AYUDA_CONTRASENA}
            esContrasena
            value={nueva}
            onChangeText={(texto) => {
              setNueva(texto);
              setErrorNueva("");
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
              setErrorConfirmacion("");
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

          <TouchableOpacity
            style={[styles.botonPrincipal, guardando && styles.botonDeshabilitado]}
            onPress={guardar}
            disabled={guardando}
            accessibilityRole="button"
            accessibilityLabel="Guardar contraseña"
          >
            <Text style={styles.textoBotonPrincipal}>
              {guardando ? "Guardando contraseña…" : "Guardar contraseña"}
            </Text>
          </TouchableOpacity>

          {/* Siempre hay salida: regresar sin cambiar nada */}
          <TouchableOpacity
            style={styles.botonSecundario}
            onPress={() => { if (!bloqueo.current && !guardando) navigation.goBack(); }}
            accessibilityRole="button"
            accessibilityLabel="Cancelar y volver"
          >
            <Text style={styles.textoBotonSecundario}>Cancelar</Text>
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
    width: '100%', maxWidth: 640, alignSelf: 'center',
    padding: espaciado.lg,
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
  botonPrincipal: {
    minHeight: 56,
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
    fontSize: 17,
    lineHeight: 25, textAlign: "center",
    fontWeight: "700",
  },
  botonSecundario: {
    minHeight: 56,
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
    fontSize: 17,
    lineHeight: 25, textAlign: "center",
    fontWeight: "700",
  },
  botonDeshabilitado: {
    opacity: 0.5,
  },
});
