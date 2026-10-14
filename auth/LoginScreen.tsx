import { consumirCorreoAcceso } from './correoAcceso';
import { useFocusEffect } from '@react-navigation/native';
import styles from './estilosAcceso';
import { supabase } from "../lib/supabase";
import { colors } from "../theme/theme";
import CampoFormulario from "./CampoFormulario";
import { esCorreoValido, normalizarCorreo } from "./validaciones";
import { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// El logo recortado tiene proporción ~3.94:1 (ancho:alto).
// Lo hacemos responsivo pero más conservador que antes, para que no se
// coma el espacio de arriba (status bar / notch) ni empuje la tarjeta.

// (clase) Componente declarado como funcion y navigation que recibe de React Navigation
export default function LoginScreen({ navigation }: any) {
  // (clase) Un useState por cada campo del formulario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Espacio seguro arriba (status bar / notch) para que el logo no
  // quede pegado o encimado con la barra de estado del teléfono.
  const insets = useSafeAreaInsets();

  // (clase) para mostrar el ActivityIndicator y no mandar el login dos veces
  const [cargando, setCargando] = useState(false);
  const bloqueo = useRef(false);
  const campoCorreo = useRef<TextInput>(null);
  const campoClave = useRef<TextInput>(null);
  const [intentado, setIntentado] = useState(false);
  const errorCorreo = intentado && !esCorreoValido(normalizarCorreo(email)) ? "Escribe un correo válido, como nombre@correo.com." : "";
  const errorClave = intentado && password === "" ? "Escribe tu contraseña." : "";
  const [aviso, setAviso] = useState("");

  useFocusEffect(useCallback(() => {
    const correo = consumirCorreoAcceso();
    if (correo) { setEmail(correo); setPassword(''); setAviso(''); }
  }, []));

  async function iniciarSesion() {
    if (bloqueo.current) return;
    setAviso("");
    setIntentado(true);
    // (clase) Validaciones simples antes de llamar al servidor
    if (email.trim() === "" || password === "") {
      (!email.trim() ? campoCorreo : campoClave).current?.focus();
      return;
    }
    if (!esCorreoValido(normalizarCorreo(email))) {
      campoCorreo.current?.focus();
      return;
    }

    bloqueo.current = true;
    setCargando(true);

    // (clase) async/await con try/catch/finally para "fail gracefully"
    try {
      // (nuevo) signInWithPassword es el equivalente de signInWithEmailAndPassword.
      //
      // DIFERENCIA IMPORTANTE CON FIREBASE:
      // En Firebase, si el login fallaba, la función LANZABA el error y lo
      // atrapábamos con .catch (o con el catch del try).
      // Supabase NO lanza el error: siempre regresa un objeto { data, error }.
      // Por eso aquí tenemos que revisar nosotros mismos `if (error)`.
      // El catch de abajo solo atrapa cosas inesperadas (por ejemplo, sin internet).
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizarCorreo(email),
        password: password,
      });

      if (error) {
        // (clase) Como con error.code de Firebase ("auth/missing-password"),
        // revisamos el código para dar un mensaje claro.
        // (nuevo) Los códigos de Supabase son distintos a los de Firebase.
        switch (error.code) {
          case "email_not_confirmed":
            setAviso("Confirma tu correo antes de iniciar sesión");
            break;
          case "invalid_credentials":
            // Mensaje genérico a propósito: no decimos si falló el correo o la
            // contraseña, para no revelar qué correos están registrados.
            setAviso("Correo o contraseña incorrectos");
            break;
          case "over_request_rate_limit":
            setAviso("Demasiados intentos. Espera un momento e intenta de nuevo.");
            break;
          default:
            setAviso("No se pudo iniciar sesión. Intenta de nuevo.");
        }
        return;
      }

      // Si todo salió bien NO navegamos a mano: useSession detecta la nueva
      // sesión con onAuthStateChange y App.tsx muestra Home solo.
    } catch {
      setAviso("Ocurrió un error inesperado. Revisa tu conexión.");
    } finally {
      // (clase) El finally siempre corre: apagamos el indicador de carga
      bloqueo.current = false;
      setCargando(false);
    }
  }

  return (
    <ImageBackground
      // Coloca cookea-background.png en assets/images/ del proyecto
      source={require("../assets/images/cookea-background-login.png")}
      style={styles.fondo}
      resizeMode="cover"
    >
      <Image source={require("../assets/images/cookea-logo.png")} resizeMode="contain" style={{ position: "absolute", top: insets.top + 12, alignSelf: "center", width: 180, height: 46 }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView style={styles.flex}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 76, paddingBottom: insets.bottom + 76, justifyContent: "center",
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Tarjeta sólida verde salvia, como en el mock */}
          <View style={[styles.card, { padding: 16 }]}>
            {aviso !== "" && <Text style={styles.aviso} accessibilityLiveRegion="polite">{aviso}</Text>}
            <Text style={[styles.titulo, { fontSize: 26, lineHeight: 34, marginBottom: 8 }]} accessibilityRole="header">Iniciar sesión</Text>
            <Text style={[styles.descripcion, { marginBottom: 16 }]}>Entra con tu correo y contraseña.</Text>

            <CampoFormulario ref={campoCorreo} error={errorCorreo} autoComplete="email" autoCorrect={false} returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => campoClave.current?.focus()} etiqueta="Correo" editable={!cargando} 
              placeholder="Correo"
              placeholderTextColor={colors.textoSecundario}
              value={email}
              onChangeText={(text) => setEmail(text)}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <CampoFormulario ref={campoClave} error={errorClave} autoComplete="current-password" etiqueta="Contraseña" editable={!cargando} esContrasena autoCapitalize="none" autoCorrect={false} 
              placeholder="Contraseña"
              placeholderTextColor={colors.textoSecundario}
              value={password}
              onChangeText={(text) => setPassword(text)}
              returnKeyType="done"
              onSubmitEditing={iniciarSesion}
            />

              <TouchableOpacity disabled={cargando} accessibilityRole="button" accessibilityState={{ disabled: cargando, busy: cargando }} accessibilityLabel="Iniciar sesión"
                style={styles.botonPrincipal}
                onPress={iniciarSesion}
                activeOpacity={0.85}
              >
                <Text style={styles.textoBotonPrincipal}>{cargando ? 'Procesando…' : 'Iniciar sesión'}</Text>
              </TouchableOpacity>

            {/* AUTH: link para recuperar la contraseña, mismo estilo que "Regístrate" */}
            <TouchableOpacity
              onPress={() => navigation.navigate("RecuperarClave")}
              disabled={cargando}
              style={styles.linkRegistro}
              accessibilityRole="button"
              accessibilityLabel="¿Olvidaste tu contraseña?"
            >
              <Text style={styles.textoLinkRegistro}>
                <Text style={styles.textoLinkRegistroBold}>¿Olvidaste tu contraseña?</Text>
              </Text>
            </TouchableOpacity>

            {/* (clase) navigation.navigate para cambiar de pantalla */}
            <TouchableOpacity
              onPress={() => navigation.navigate("SignUp")}
              disabled={cargando}
              style={styles.linkRegistro}
            >
              <Text style={styles.textoLinkRegistro}>
                ¿No tienes cuenta?{" "}
                <Text style={styles.textoLinkRegistroBold}>Crear cuenta</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

// (clase) Estilos al final del archivo
