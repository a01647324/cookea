import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ImageBackground,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// El logo recortado tiene proporción ~3.94:1 (ancho:alto).
// Lo hacemos responsivo pero más conservador que antes, para que no se
// coma el espacio de arriba (status bar / notch) ni empuje la tarjeta.
const { width: anchoPantalla, height: altoPantalla } = Dimensions.get("window");
const ANCHO_LOGO = Math.min(anchoPantalla * 0.85, 380);
const ALTO_LOGO = ANCHO_LOGO / 3.94;
import { supabase } from "../lib/supabase";
import { colors, espaciado, radios, tipografia } from "../theme/theme";

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

  async function iniciarSesion() {
    // (clase) Validaciones simples antes de llamar al servidor
    if (email.trim() === "" || password === "") {
      alert("Escribe tu correo y tu contraseña");
      return;
    }
    if (!email.includes("@")) {
      alert("Escribe un correo válido");
      return;
    }

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
        email: email.trim(),
        password: password,
      });

      if (error) {
        // (clase) Como con error.code de Firebase ("auth/missing-password"),
        // revisamos el código para dar un mensaje claro.
        // (nuevo) Los códigos de Supabase son distintos a los de Firebase.
        switch (error.code) {
          case "email_not_confirmed":
            alert("Confirma tu correo antes de iniciar sesión");
            break;
          case "invalid_credentials":
            // Mensaje genérico a propósito: no decimos si falló el correo o la
            // contraseña, para no revelar qué correos están registrados.
            alert("Correo o contraseña incorrectos");
            break;
          case "over_request_rate_limit":
            alert("Demasiados intentos. Espera un momento e intenta de nuevo.");
            break;
          default:
            alert("No se pudo iniciar sesión. Intenta de nuevo.");
        }
        return;
      }

      // Si todo salió bien NO navegamos a mano: useSession detecta la nueva
      // sesión con onAuthStateChange y App.tsx muestra Home solo.
    } catch (e) {
      alert("Ocurrió un error inesperado. Revisa tu conexión.");
    } finally {
      // (clase) El finally siempre corre: apagamos el indicador de carga
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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(
                insets.top + 32,
                altoPantalla * 0.18
              ),
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <Image
            // Coloca cookea-logo.png en assets/images/ del proyecto
            source={require("../assets/images/cookea-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Tarjeta sólida verde salvia, como en el mock */}
          <View style={styles.card}>
            <Text style={styles.titulo}>Iniciar Sesión</Text>

            <TextInput
              style={styles.input}
              placeholder="Correo"
              placeholderTextColor={colors.textoSecundario}
              value={email}
              onChangeText={(text) => setEmail(text)}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor={colors.textoSecundario}
              value={password}
              onChangeText={(text) => setPassword(text)}
              secureTextEntry={true}
            />

            {/* (clase) Mientras se procesa mostramos el ActivityIndicator en vez del
                botón, así no se puede presionar dos veces */}
            {cargando ? (
              <ActivityIndicator
                size="large"
                color={colors.olivaOscuro}
                style={styles.loader}
              />
            ) : (
              <TouchableOpacity
                style={styles.botonPrincipal}
                onPress={iniciarSesion}
                activeOpacity={0.85}
              >
                <Text style={styles.textoBotonPrincipal}>INICIAR SESIÓN</Text>
              </TouchableOpacity>
            )}

            {/* (clase) navigation.navigate para cambiar de pantalla */}
            <TouchableOpacity
              onPress={() => navigation.navigate("SignUp")}
              disabled={cargando}
              style={styles.linkRegistro}
            >
              <Text style={styles.textoLinkRegistro}>
                ¿NO TIENES CUENTA?{" "}
                <Text style={styles.textoLinkRegistroBold}>REGÍSTRATE</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

// (clase) Estilos al final del archivo
const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  
  fondo: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
  
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  logo: {
    width: ANCHO_LOGO,
    height: ALTO_LOGO,
    marginBottom: espaciado.xl,
    alignSelf: "flex-start",
    marginLeft: -25,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.tarjetaClara,
    borderRadius: 32,
    paddingHorizontal: espaciado.lg,
    paddingVertical: espaciado.xl,
  
    marginTop: 30, // Baja la tarjeta de inicio de sesión
  
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.olivaOscuro,
    textAlign: "center",
    marginBottom: espaciado.lg,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radios.pill,
    paddingHorizontal: espaciado.lg,
    paddingVertical: espaciado.md,
    marginBottom: espaciado.md,
    color: colors.textoPrincipal,
    fontSize: 15,
  },
  botonPrincipal: {
    backgroundColor: colors.botonPrincipal,
    borderRadius: radios.pill,
    paddingVertical: espaciado.md,
    alignItems: "center",
    marginTop: espaciado.sm,
  },
  textoBotonPrincipal: {
    color: colors.textoSobreColor,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  loader: {
    marginTop: espaciado.sm,
  },
  linkRegistro: {
    marginTop: espaciado.md,
    alignItems: "center",
  },
  textoLinkRegistro: {
    color: colors.olivaOscuro,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  textoLinkRegistroBold: {
    color: colors.olivaOscuro,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
