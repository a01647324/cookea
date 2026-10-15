import { useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Alert } from "react-native";
import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import CampoFormulario from "../auth/CampoFormulario";
import { HojaInferior } from "../components/HojaInferior";
import Icono from "../components/Icono";
import AvisoFormulario from "./AvisoFormulario";
import { colors, espaciado, fuentes, radios, tamanos } from "../theme/theme";

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
    <HojaInferior visible={visible} onCerrar={cerrar}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} accessibilityViewIsModal>
        <View style={styles.halo}>
          <View style={styles.circulo}>
            <Icono nombre="trash-bin-trash-linear" size={32} color={colors.peligro} />
          </View>
        </View>
        <Text style={styles.titulo} accessibilityRole="header">
          ¿Eliminar tu cuenta?
        </Text>

        <View style={styles.tarjeta}>
          <Text style={styles.explicacion}>
            Se borrarán para siempre tu perfil, tus alergias y las de tu casa, tu alacena, tus álbumes, tu plan de la
            semana, y tus calificaciones y comentarios.
          </Text>
          <Text style={styles.explicacion}>
            Las recetas que publicaste en Comunidad se quedan para que otras personas no las pierdan, pero ya no tendrán
            tu alias: aparecerán como de «Usuario eliminado». Las imágenes de esas recetas pueden conservarse.
          </Text>
          <View style={styles.advertencia}>
            <Icono nombre="danger-triangle-linear" size={18} color={colors.peligro} />
            <Text style={styles.textoAdvertencia}>Esto no se puede deshacer.</Text>
          </View>
        </View>

        <AvisoFormulario texto={aviso} />

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
        <CampoFormulario
          etiqueta="Escribe ELIMINAR para confirmar"
          value={frase}
          onChangeText={setFrase}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!eliminando}
        />

        {/* "Cancelar" es el botón más grande y visible */}
        <Pressable
          style={[styles.botonCancelar, eliminando && styles.botonDeshabilitado]}
          onPress={cerrar}
          disabled={eliminando}
          accessibilityRole="button"
          accessibilityLabel="Cancelar, no eliminar mi cuenta"
        >
          <Text style={styles.textoBotonCancelar}>Cancelar</Text>
        </Pressable>

        <Pressable
          style={[styles.botonEliminar, !puedeEliminar && styles.botonDeshabilitado]}
          onPress={eliminar}
          disabled={!puedeEliminar}
          accessibilityState={{ disabled: !puedeEliminar }}
          accessibilityRole="button"
          accessibilityLabel="Eliminar mi cuenta para siempre"
        >
          <Text style={styles.textoBotonEliminar}>{eliminando ? "Eliminando…" : "Eliminar mi cuenta"}</Text>
        </Pressable>
      </ScrollView>
    </HojaInferior>
  );
}

const styles = StyleSheet.create({
  halo: {
    alignSelf: "center",
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.peligroSuave,
    alignItems: "center",
    justifyContent: "center",
  },
  circulo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.superficie,
    alignItems: "center",
    justifyContent: "center",
  },
  titulo: {
    fontFamily: fuentes.titulo,
    fontSize: 23,
    lineHeight: 30,
    color: colors.texto,
    textAlign: "center",
    marginTop: espaciado.md,
    marginBottom: espaciado.md,
  },
  tarjeta: {
    backgroundColor: colors.superficie,
    borderRadius: radios.lg,
    padding: espaciado.md,
    marginBottom: espaciado.md,
  },
  explicacion: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.cuerpo,
    lineHeight: 22,
    color: colors.textoSuave,
    marginBottom: espaciado.sm,
  },
  advertencia: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  textoAdvertencia: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.cuerpo,
    color: colors.peligro,
  },
  botonCancelar: {
    minHeight: 58,
    backgroundColor: colors.primario,
    borderRadius: radios.pill,
    alignItems: "center",
    justifyContent: "center",
    marginTop: espaciado.sm,
  },
  textoBotonCancelar: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.enorme,
    color: colors.sobrePrimario,
  },
  botonEliminar: {
    minHeight: 50,
    borderRadius: radios.pill,
    borderWidth: 1.5,
    borderColor: colors.peligro,
    alignItems: "center",
    justifyContent: "center",
    marginTop: espaciado.sm,
    marginBottom: espaciado.sm,
  },
  textoBotonEliminar: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.cuerpo,
    color: colors.peligro,
  },
  botonDeshabilitado: {
    opacity: 0.45,
  },
});
