import { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import CampoFormulario from "../auth/CampoFormulario";
import { colors, espaciado, radios, tipografia } from "../theme/theme";

const MENSAJE_SIN_CONEXION =
  "No hay conexión. Revisa tu internet e intenta de nuevo. Tu cuenta no se eliminó.";
const MENSAJE_OTRO_ERROR = "No se pudo completar. Intenta de nuevo. Tu cuenta no se eliminó.";

type Props = {
  visible: boolean;
  onCerrar: () => void;
};

// (nuevo) Cierra la sesión solo en este celular. Aunque falle (por ejemplo,
// porque la cuenta ya no existe), Supabase borra la sesión guardada y lanza
// SIGNED_OUT, así que App.tsx muestra el Login por sí solo.
async function cerrarSesionLocal() {
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
  }
}

// La función pudo haber borrado la cuenta y perderse solo la respuesta.
// Cerramos la sesión en los dos casos: si la cuenta sigue, la persona puede
// volver a entrar; si no, la app no se queda en una sesión de una cuenta
// que ya no existe (el token dura una hora).
async function cerrarSinConfirmar() {
  await cerrarSesionLocal();
  Alert.alert(
    "No pudimos confirmar si tu cuenta se eliminó",
    "Cerramos tu sesión por seguridad. Si puedes volver a entrar con tu contraseña, tu cuenta sigue activa y puedes intentarlo de nuevo.",
    [{ text: "Entendido" }]
  );
}

// EliminarCuentaModal: pide la contraseña y elimina la cuenta.
// Borrar es lo único que no se puede deshacer, por eso "Cancelar" es el
// botón más visible y se confirma con la contraseña.
// (clase) Componente declarado como función que recibe props
export default function EliminarCuentaModal({ visible, onCerrar }: Props) {
  // (clase) Un useState por cada campo y cada mensaje
  const bloqueo = useRef(false);
  const [frase, setFrase] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [errorContrasena, setErrorContrasena] = useState("");
  const [aviso, setAviso] = useState("");
  const [eliminando, setEliminando] = useState(false);

  // "Cancelar", atrás de Android o tocar fuera: cierra y limpia.
  // Mientras se elimina, no se puede cerrar.
  function cerrar() {
    if (bloqueo.current || eliminando) return;
    setFrase("");
    setContrasena("");
    setErrorContrasena("");
    setAviso("");
    onCerrar();
  }

  async function eliminar() {
    if (bloqueo.current || frase !== "ELIMINAR" || contrasena === "") return;

    // (clase) Validación en el celular antes de llamar al servidor
    if (contrasena === "") {
      setErrorContrasena("Escribe tu contraseña.");
      return;
    }

    setErrorContrasena("");
    setAviso("");
    bloqueo.current = true;
    setEliminando(true);

    // Para saber, si algo falla, si ya se había llamado a la función que borra
    let funcionLlamada = false;

    // (clase) async/await con try/catch/finally para "fail gracefully"
    try {
      // (nuevo) getSession lee la sesión guardada en el celular, sin internet
      const { data } = await supabase.auth.getSession();
      const email = data.session?.user.email;
      if (email === undefined) {
        setAviso(MENSAJE_OTRO_ERROR);
        return;
      }

      // Paso 1: confirmar que es la dueña de la cuenta.
      // (nuevo) Verificamos la contraseña aquí y no dentro de la función SQL,
      // para que nunca viaje como parámetro de una consulta.
      const { error: errorEntrar } = await supabase.auth.signInWithPassword({
        email: email,
        password: contrasena,
      });
      if (errorEntrar) {
        // (nuevo) Sin internet, Supabase regresa este tipo de error en vez de lanzarlo
        if (isAuthRetryableFetchError(errorEntrar)) {
          setAviso(MENSAJE_SIN_CONEXION);
          return;
        }
        // (clase) Revisamos error.code para dar un mensaje claro
        switch (errorEntrar.code) {
          case "invalid_credentials":
            setErrorContrasena("La contraseña no es correcta.");
            break;
          case "over_request_rate_limit":
            setAviso("Hubo demasiados intentos. Espera un momento e intenta de nuevo.");
            break;
          default:
            setAviso(MENSAJE_OTRO_ERROR);
        }
        return;
      }

      // Paso 2: borrar. La función borra todo o nada (es una transacción).
      funcionLlamada = true;
      const { error, status } = await supabase.rpc("eliminar_mi_cuenta");
      if (error) {
        // (nuevo) status 0: no hubo respuesta. No sabemos si se borró.
        if (status === 0) {
          await cerrarSinConfirmar();
          return;
        }
        setAviso("No se pudo eliminar tu cuenta. Intenta de nuevo.");
        return;
      }

      // Paso 3: salió bien. Cerramos la sesión del celular y App.tsx muestra
      // el Login; el Alert queda encima. Aquí sí usamos Alert porque el modal
      // desaparece junto con la sesión.
      await cerrarSesionLocal();
      Alert.alert("Tu cuenta se eliminó", "Gracias por usar Cookea.", [{ text: "Entendido" }]);
    } catch {
      if (funcionLlamada) {
        await cerrarSinConfirmar();
      } else {
        setAviso(MENSAJE_SIN_CONEXION);
      }
    } finally {
      bloqueo.current = false;
      setEliminando(false);
    }
  }

  const puedeEliminar = !eliminando && frase === "ELIMINAR" && contrasena !== "";
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={cerrar}>
      <KeyboardAvoidingView
        style={styles.fondo}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Fondo oscuro: tocarlo cierra el modal. Va DETRÁS de la tarjeta
            (no la envuelve), así tocar la tarjeta no lo cierra. */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={cerrar}
          accessibilityLabel="Cerrar sin eliminar"
        />

        {/* (nuevo) accessibilityViewIsModal: el lector de pantalla no lee lo
            que está detrás del modal */}
        <View style={styles.tarjeta} accessibilityViewIsModal>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.titulo} accessibilityRole="header">
              ¿Eliminar tu cuenta?
            </Text>

            <Text style={styles.explicacion}>
              Se borrarán para siempre tu perfil, tus alergias y las de tu casa,
              tu alacena, tus álbumes, tu plan de la semana, y tus calificaciones
              y comentarios.
            </Text>
            <Text style={styles.explicacion}>
              Las recetas que publicaste en Comunidad se quedan para que otras
              personas no las pierdan, pero ya no tendrán tu alias: aparecerán
              como de «Usuario eliminado». Las imágenes de esas recetas pueden conservarse.
            </Text>
            <Text style={[styles.explicacion, styles.negrita]}>
              Esto no se puede deshacer.
            </Text>

            {/* (nuevo) Aviso general dentro del modal, en vez de alert() */}
            {aviso !== "" && (
              <View style={styles.aviso} accessibilityLiveRegion="polite">
                <Text style={styles.textoAviso}>{aviso}</Text>
              </View>
            )}

            <CampoFormulario
              etiqueta="Escribe tu contraseña para confirmar"
              esContrasena
              value={contrasena}
              onChangeText={(texto) => {
                setContrasena(texto);
                setErrorContrasena("");
              }}
              error={errorContrasena}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="done"
              editable={!eliminando}
            />

            <CampoFormulario etiqueta="Escribe ELIMINAR para confirmar" value={frase} onChangeText={setFrase} autoCapitalize="characters" autoCorrect={false} editable={!eliminando} />
            {/* "Cancelar" es el botón más grande y visible */}
            <TouchableOpacity
              style={[styles.botonCancelar, eliminando && styles.botonDeshabilitado]}
              onPress={cerrar}
              disabled={eliminando}
              accessibilityRole="button"
              accessibilityLabel="Cancelar, no eliminar mi cuenta"
            >
              <Text style={styles.textoBotonCancelar}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.botonEliminar, !puedeEliminar && styles.botonDeshabilitado]}
              onPress={eliminar}
              disabled={!puedeEliminar}
              accessibilityState={{ disabled: !puedeEliminar }}
              accessibilityRole="button"
              accessibilityLabel="Eliminar mi cuenta para siempre"
            >
              <Text style={styles.textoBotonEliminar}>
                {eliminando ? "Eliminando…" : "Eliminar mi cuenta"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// (clase) Estilos al final del archivo. Para cambiar el diseño, solo se toca esto.
const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    justifyContent: "center",
    padding: espaciado.md,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  tarjeta: {
    maxHeight: "90%",
    backgroundColor: colors.background,
    borderRadius: radios.lg,
    padding: espaciado.lg,
  },
  titulo: {
    ...tipografia.titulo,
    marginBottom: espaciado.md,
  },
  explicacion: {
    ...tipografia.cuerpo,
    fontSize: 16,
    marginBottom: espaciado.sm,
  },
  negrita: {
    fontWeight: "700",
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
  botonCancelar: {
    minHeight: 56,
    backgroundColor: colors.olivaOscuro,
    borderRadius: radios.pill,
    paddingVertical: espaciado.md,
    paddingHorizontal: espaciado.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: espaciado.sm,
  },
  textoBotonCancelar: {
    color: colors.textoSobreColor,
    fontSize: 18,
    fontWeight: "700",
  },
  botonEliminar: {
    minHeight: 48,
    backgroundColor: colors.error,
    borderRadius: radios.pill,
    paddingVertical: espaciado.sm,
    paddingHorizontal: espaciado.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: espaciado.md,
  },
  textoBotonEliminar: {
    color: colors.textoSobreColor,
    fontSize: 15,
    fontWeight: "700",
  },
  botonDeshabilitado: {
    opacity: 0.5,
  },
});
