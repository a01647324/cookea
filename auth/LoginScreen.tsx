import { useState } from "react";
import { View, Text, TextInput, Button, ActivityIndicator, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";
import { colors, espaciado, radios, tipografia } from "../theme/theme";

// (clase) Componente declarado como funcion y navigation que recibe de React Navigation
export default function LoginScreen({ navigation }: any) {
  // (clase) Un useState por cada campo del formulario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
    <View style={styles.container}>
      <Text style={styles.titulo}>Iniciar sesión</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo"
        value={email}
        onChangeText={text => setEmail(text)}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={text => setPassword(text)}
        secureTextEntry={true}
      />

      {/* (clase) Mientras se procesa mostramos el ActivityIndicator en vez del
          botón, así no se puede presionar dos veces */}
      {cargando ? (
        <ActivityIndicator size="large" color={colors.oliva} />
      ) : (
        <Button title="Iniciar sesión" color={colors.oliva} onPress={iniciarSesion} />
      )}

      <View style={styles.separador} />

      {/* (clase) navigation.navigate para cambiar de pantalla */}
      <Button
        title="¿No tienes cuenta? Regístrate"
        color={colors.terracota}
        onPress={() => navigation.navigate("SignUp")}
        disabled={cargando}
      />
    </View>
  );
}

// (clase) Estilos al final del archivo
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: espaciado.lg,
    backgroundColor: colors.background,
  },
  titulo: {
    ...tipografia.titulo,
    textAlign: "center",
    marginBottom: espaciado.lg,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: radios.sm,
    padding: espaciado.md,
    marginBottom: espaciado.md,
    color: colors.textoPrincipal,
  },
  separador: {
    height: espaciado.md,
  },
});
