import { useState } from "react";

import {
  ScrollView,
  View,
  Text,
  TextInput,
  Switch,
  ActivityIndicator,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { supabase } from "../lib/supabase";
import { colors, espaciado, radios, tipografia } from "../theme/theme";


// Dimensiones de pantalla para hacer el logo responsivo
const { width: anchoPantalla } = Dimensions.get("window");

const ANCHO_LOGO = Math.min(anchoPantalla * 0.75, 330);
const ALTO_LOGO = ANCHO_LOGO / 3.94;


// Llaves que utiliza Supabase para crear el perfil
const LLAVE_ALIAS = "alias";
const LLAVE_NOMBRE = "nombre";
const LLAVE_ACEPTO_PRIVACIDAD = "acepto_privacidad";


// Componente principal de registro
export default function SignUpScreen({ navigation }: any) {

  // Estados del formulario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [alias, setAlias] = useState("");
  const [nombre, setNombre] = useState("");

  // Estado del aviso de privacidad
  const [aceptoPrivacidad, setAceptoPrivacidad] = useState(false);

  // Estado de carga
  const [cargando, setCargando] = useState(false);

  // Área segura del dispositivo
  const insets = useSafeAreaInsets();


  // Función para registrar al usuario en Supabase
  async function registrarse() {

    // Validar que todos los campos estén completos
    if (
      email.trim() === "" ||
      password === "" ||
      confirmarPassword === "" ||
      alias.trim() === "" ||
      nombre.trim() === ""
    ) {
      alert("Llena todos los campos");
      return;
    }

    // Validar correo
    if (!email.includes("@")) {
      alert("Escribe un correo válido");
      return;
    }

    // Validar contraseña
    if (password.length < 8) {
      alert("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    // Validar confirmación de contraseña
    if (password !== confirmarPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    // Validar aceptación del aviso de privacidad
    if (!aceptoPrivacidad) {
      alert("Debes aceptar el aviso de privacidad para crear tu cuenta");
      return;
    }

    setCargando(true);

    try {

      // Registrar usuario mediante Supabase Auth
      const { error } = await supabase.auth.signUp({

        email: email.trim(),

        password: password,

        options: {
          data: {
            [LLAVE_ALIAS]: alias.trim(),
            [LLAVE_NOMBRE]: nombre.trim(),
            [LLAVE_ACEPTO_PRIVACIDAD]: aceptoPrivacidad,
          },
        },

      });


      // Manejo de errores de Supabase
      if (error) {

        switch (error.code) {

          case "weak_password":
            alert("La contraseña es muy débil. Usa una más segura.");
            break;

          case "email_address_invalid":
            alert("Ese correo no es válido");
            break;

          case "user_already_exists":
            alert("No se pudo crear la cuenta con ese correo");
            break;

          case "over_email_send_rate_limit":
            alert(
              "Se enviaron demasiados correos. Espera un momento e intenta de nuevo."
            );
            break;

          default:
            alert("No se pudo crear la cuenta. Intenta de nuevo.");

        }

        return;
      }


      // Registro exitoso
      alert("Te enviamos un correo para confirmar tu cuenta");

      navigation.navigate("Login");


    } catch (e) {

      alert("Ocurrió un error inesperado. Revisa tu conexión.");

    } finally {

      setCargando(false);

    }

  }


  // INTERFAZ DE REGISTRO

  return (

    <ImageBackground

      source={require("../assets/images/cookea-background-signup.png")}

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
              paddingTop: insets.top + 35,
            },

          ]}

          keyboardShouldPersistTaps="handled"

          showsVerticalScrollIndicator={false}

        >


          {/* LOGO COOKEA */}

          <Image

            source={require("../assets/images/cookea-logo.png")}

            style={styles.logo}

            resizeMode="contain"

          />


          {/* FRASE DE BIENVENIDA */}

          <Text style={styles.fraseBienvenida}>
            ¡Regístrate y crea tu cuenta!
          </Text>


          {/* TARJETA NARANJA DE REGISTRO */}

          <View style={styles.card}>


            {/* TÍTULO */}

            <Text style={styles.titulo}>

              Crear cuenta

            </Text>


            {/* CORREO */}

            <TextInput

              style={styles.input}

              placeholder="Correo"

              placeholderTextColor={colors.textoSecundario}

              value={email}

              onChangeText={(text) => setEmail(text)}

              autoCapitalize="none"

              keyboardType="email-address"

            />


            {/* CONTRASEÑA */}

            <TextInput

              style={styles.input}

              placeholder="Contraseña (mínimo 8 caracteres)"

              placeholderTextColor={colors.textoSecundario}

              value={password}

              onChangeText={(text) => setPassword(text)}

              secureTextEntry={true}

            />


            {/* CONFIRMAR CONTRASEÑA */}

            <TextInput

              style={styles.input}

              placeholder="Confirmar contraseña"

              placeholderTextColor={colors.textoSecundario}

              value={confirmarPassword}

              onChangeText={(text) => setConfirmarPassword(text)}

              secureTextEntry={true}

            />


            {/* ALIAS */}

            <TextInput

              style={styles.input}

              placeholder="Alias (lo verán otros usuarios)"

              placeholderTextColor={colors.textoSecundario}

              value={alias}

              onChangeText={(text) => setAlias(text)}

            />


            {/* NOMBRE */}

            <TextInput

              style={styles.input}

              placeholder="Nombre (privado)"

              placeholderTextColor={colors.textoSecundario}

              value={nombre}

              onChangeText={(text) => setNombre(text)}

            />


            {/* AVISO DE PRIVACIDAD */}

            <View style={styles.filaPrivacidad}>

            <Switch
              value={aceptoPrivacidad}
              onValueChange={(valor) => setAceptoPrivacidad(valor)}
              trackColor={{
                true: "#FFD47B",
                false: colors.borde,
              }}
              thumbColor={colors.surface}
            />

              <Text style={styles.textoPrivacidad}>

                Acepto el aviso de privacidad

              </Text>

            </View>


            {/* BOTÓN REGISTRARME */}

            {cargando ? (

              <ActivityIndicator

                size="large"

                color={colors.olivaOscuro}

                style={styles.loader}

              />

            ) : (

              <TouchableOpacity

                style={styles.botonPrincipal}

                onPress={registrarse}

                activeOpacity={0.85}

              >

                <Text style={styles.textoBotonPrincipal}>

                  REGISTRARME

                </Text>

              </TouchableOpacity>

            )}


          </View>


        </ScrollView>

      </KeyboardAvoidingView>

    </ImageBackground>

  );

}


// ESTILOS DE LA PANTALLA

const styles = StyleSheet.create({

  // Fondo ilustrado
  fondo: {
    flex: 1,
    backgroundColor: colors.background,
  },


  flex: {
    flex: 1,
  },


  // Contenedor principal
  scrollContent: {
    flexGrow: 1,

    alignItems: "center",

    paddingHorizontal: 24,

    paddingBottom: 50,
  },


  // Logo de Cookea
  logo: {
    width: ANCHO_LOGO,
    height: ALTO_LOGO,
    alignSelf: "center",
    marginTop: 20,
    marginBottom: 5,
  },


  // Tarjeta naranja
  card: {
    width: "100%",
    maxWidth: 420,
  
    backgroundColor: "rgba(226, 138, 70, 0.85)",
  
    borderRadius: 40,
  
    paddingHorizontal: 24,
    paddingVertical: 32,
  
    marginTop: 10,
  
    overflow: "hidden",
  },


  // Título Crear cuenta
  titulo: {
    fontSize: 24,

    fontWeight: "700",

    color: "#745213",

    textAlign: "center",

    marginBottom: 28,
  },


  // Campos de texto
  input: {
    backgroundColor: colors.surface,

    borderRadius: radios.pill,

    paddingHorizontal: 24,

    paddingVertical: 16,

    marginBottom: 16,

    color: colors.textoPrincipal,

    fontSize: 14,
  },


  // Fila del aviso de privacidad
  filaPrivacidad: {
    flexDirection: "row",

    alignItems: "center",

    marginTop: 8,

    marginBottom: 24,
  },


  // Texto del aviso de privacidad
  textoPrivacidad: {
    color: colors.olivaOscuro,

    fontSize: 13,

    fontWeight: "500",

    marginLeft: 8,

    flex: 1,
  },


  // Botón verde de registro
  botonPrincipal: {
    backgroundColor: colors.olivaOscuro,

    borderRadius: radios.pill,

    paddingVertical: 17,

    alignItems: "center",

    justifyContent: "center",
  },


  // Texto del botón
  textoBotonPrincipal: {
    color: colors.textoSobreColor,

    fontSize: 15,

    fontWeight: "700",

    letterSpacing: 0.5,
  },


  // Indicador de carga
  loader: {
    marginTop: 8,
  },

  fraseBienvenida: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textoPrincipal,
    textAlign: "center",
    marginTop: 0,
    marginBottom: 5,
  },

});