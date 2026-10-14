import Encabezado from "../perfil/Encabezado";
import useRetroceso from "./useRetroceso";
import { useRef, useState } from "react";
import {
  Alert,
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
  // (clase) Un useState por cada campo y cada mensaje
  const bloqueo = useRef(false);
  const confirmacionAbierta = useRef(false);
  const [nueva, setNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [errorNueva, setErrorNueva] = useState("");
  const [errorConfirmacion, setErrorConfirmacion] = useState("");
  const [aviso, setAviso] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [listo, setListo] = useState(false); // true cuando ya se guardó

  // (nuevo) useRef para pasar al campo de confirmación con la tecla "siguiente"
  const campoConfirmacion = useRef<TextInput>(null);

  // (clase) Revisamos error.code para dar un mensaje claro, como en LoginScreen
  function mostrarError(error: AuthError) {

    // (nuevo) Sin internet, Supabase regresa este tipo de error en vez de lanzarlo
    if (isAuthRetryableFetchError(error)) {
      setAviso(MENSAJE_SIN_CONEXION);
      return;
    }

    switch (error.code) {
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
    if (bloqueo.current || guardando || cancelando || listo || confirmacionAbierta.current) return;

    // (clase) Validaciones en el celular antes de llamar al servidor
    setErrorNueva("");
    setErrorConfirmacion("");
    setAviso("");
    const problema = validarNuevaContrasena(nueva, confirmacion);
    if (problema !== null) {
      if (problema.campo === "nueva") setErrorNueva(problema.mensaje);
      else setErrorConfirmacion(problema.mensaje);
      return;
    }

    bloqueo.current = true;
    setGuardando(true);

    // (clase) async/await con try/catch/finally para "fail gracefully"
    try {
      // (nuevo) Como la sesión viene de una recuperación, Supabase no pide la
      // contraseña actual: el código del correo ya probó que es la dueña.
      const { error } = await supabase.auth.updateUser({ password: nueva });
      if (error) {
        // Se queda en esta pantalla para corregir, sin gastar otro correo
        mostrarError(error);
        return;
      }
      // La contraseña ya cambió: borramos el dato del celular antes de
      // mostrar el éxito, por si la persona cierra la app en esa pantalla.
      setListo(true);
      try { await onGuardada(); }
      catch { setAviso("Tu contraseña se actualizó, pero no pudimos guardar el estado en este dispositivo."); }
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
    catch { setAviso("No se pudo cancelar. Intenta de nuevo."); }
    finally { bloqueo.current = false; setCancelando(false); }
  }


  function confirmarCancelar() {
    if (confirmacionAbierta.current || bloqueo.current || guardando || cancelando || listo) return;
    confirmacionAbierta.current = true;
    Alert.alert("¿Cancelar el cambio de contraseña?", "Tu contraseña anterior seguirá funcionando.", [
      { text: "Seguir aquí", style: "cancel", onPress: () => { confirmacionAbierta.current = false; } },
      { text: "Cancelar cambio", style: "destructive", onPress: () => { confirmacionAbierta.current = false; void cancelar(); } },
    ]);
  }
  useRetroceso(() => { if (listo) onTerminar(); else confirmarCancelar(); });


  // Pantalla de éxito, con un botón para continuar (no una alerta)
  if (listo) {
    return (
      <SafeAreaView style={styles.pantalla}>
      <Encabezado titulo="Nueva contraseña" onVolver={listo ? undefined : confirmarCancelar} textoVolver="Cancelar" deshabilitado={guardando || cancelando} />
        <View style={styles.contenido}>
          <Text style={styles.titulo} accessibilityRole="header">
            Tu contraseña se actualizó
          </Text>
          {aviso !== "" && <Text style={styles.textoAviso}>{aviso}</Text>}
          <Text style={styles.explicacion}>
            Desde ahora usa tu nueva contraseña para iniciar sesión.
          </Text>
          <TouchableOpacity
            style={styles.botonPrincipal}
            onPress={onTerminar}
            accessibilityRole="button"
            accessibilityLabel="Continuar"
          >
            <Text style={styles.textoBotonPrincipal}>Continuar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const ocupado = guardando || cancelando;

  return (
    <SafeAreaView style={styles.pantalla}>
      <Encabezado titulo="Nueva contraseña" onVolver={listo ? undefined : confirmarCancelar} textoVolver="Cancelar" deshabilitado={guardando || cancelando} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.contenido}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.indicadorPaso}>Paso 3 de 3</Text>
          <Text style={styles.titulo} accessibilityRole="header">
            Crea tu nueva contraseña
          </Text>

          {/* (nuevo) Aviso general arriba del formulario, en vez de alert() */}
          {aviso !== "" && (
            <View style={styles.aviso} accessibilityLiveRegion="polite">
              <Text style={styles.textoAviso}>{aviso}</Text>
            </View>
          )}

          <CampoFormulario
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
            editable={!ocupado}
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
            editable={!ocupado}
          />

          <TouchableOpacity
            style={[styles.botonPrincipal, ocupado && styles.botonDeshabilitado]}
            onPress={guardar}
            disabled={ocupado}
            accessibilityRole="button"
            accessibilityLabel="Guardar contraseña"
          >
            <Text style={styles.textoBotonPrincipal}>
              {guardando ? "Guardando contraseña…" : "Guardar contraseña"}
            </Text>
          </TouchableOpacity>

          {/* Siempre hay salida: cancelar y regresar al Login */}
          <TouchableOpacity
            style={[styles.botonSecundario, ocupado && styles.botonDeshabilitado]}
            onPress={confirmarCancelar}
            disabled={ocupado}
            accessibilityRole="button"
            accessibilityLabel="Cancelar y regresar a iniciar sesión"
          >
            <Text style={styles.textoBotonSecundario}>
              {cancelando ? "Cancelando…" : "Cancelar"}
            </Text>
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
