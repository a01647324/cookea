import { useState } from "react";
import { ScrollView, View, Text, TextInput, Button, Switch, ActivityIndicator, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";
import { colors, espaciado, radios, tipografia } from "../theme/theme";

// (nuevo) Nombres de las llaves que lee el trigger manejar_nuevo_usuario en
// Supabase para crear la fila en `perfiles`. Si el trigger usa otros nombres,
// solo hay que cambiarlos aquí.
const LLAVE_ALIAS = "alias";
const LLAVE_NOMBRE = "nombre";
// El trigger revisa que esta llave sea true; si no, rechaza el registro.
const LLAVE_ACEPTO_PRIVACIDAD = "acepto_privacidad";

// (clase) Componente declarado como función y navigation que recibe de React Navigation
export default function SignUpScreen({ navigation }: any) {
  // (clase) Un useState por cada campo del formulario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [alias, setAlias] = useState("");
  const [nombre, setNombre] = useState(""); // privado: nunca se muestra a otros usuarios
  // (nuevo) Switch es como un checkbox: guarda true/false
  const [aceptoPrivacidad, setAceptoPrivacidad] = useState(false);

  const [cargando, setCargando] = useState(false);

  async function registrarse() {
    // (clase) Validaciones simples con if antes de llamar al servidor
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
    if (!email.includes("@")) {
      alert("Escribe un correo válido");
      return;
    }
    if (password.length < 8) {
      alert("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (password !== confirmarPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }
    if (!aceptoPrivacidad) {
      alert("Debes aceptar el aviso de privacidad para crear tu cuenta");
      return;
    }

    setCargando(true);

    // (clase) async/await con try/catch/finally para "fail gracefully"
    try {
      // (nuevo) signUp es el equivalente de createUserWithEmailAndPassword.
      //
      // DIFERENCIA IMPORTANTE CON FIREBASE:
      // Firebase LANZABA el error y lo atrapábamos con .catch.
      // Supabase NO lanza el error: regresa { data, error }, así que
      // revisamos `if (error)` nosotros mismos.
      //
      // (nuevo) La app NO inserta en la tabla `perfiles`. Mandamos alias,
      // nombre y la aceptación de privacidad en options.data (metadatos del usuario) y el
      // trigger manejar_nuevo_usuario de la base de datos crea la fila solo.
      //
      // (nuevo) Como "Confirm email" está activado, signUp NO regresa sesión:
      // el usuario debe confirmar su correo antes de poder iniciar sesión.
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            [LLAVE_ALIAS]: alias.trim(),
            [LLAVE_NOMBRE]: nombre.trim(),
            // El trigger lo vuelve a revisar en el servidor (no basta con la casilla)
            [LLAVE_ACEPTO_PRIVACIDAD]: aceptoPrivacidad,
          },
        },
      });

      if (error) {
        // (clase) Revisamos el código del error para dar un mensaje claro
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
            alert("Se enviaron demasiados correos. Espera un momento e intenta de nuevo.");
            break;
          default:
            alert("No se pudo crear la cuenta. Intenta de nuevo.");
        }
        return;
      }

      // (nuevo) Ojo: con "Confirm email" activado, si el correo YA estaba
      // registrado, Supabase normalmente NO regresa error (para no revelar
      // qué correos existen). Por eso mostramos el mismo mensaje en ambos casos.
      alert("Te enviamos un correo para confirmar tu cuenta");
      navigation.navigate("Login");
    } catch (e) {
      alert("Ocurrió un error inesperado. Revisa tu conexión.");
    } finally {
      // (clase) El finally siempre corre: apagamos el indicador de carga
      setCargando(false);
    }
  }

  return (
    // ScrollView para que el teclado no tape los campos de abajo
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.titulo}>Crear cuenta</Text>

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
        placeholder="Contraseña (mínimo 8 caracteres)"
        value={password}
        onChangeText={text => setPassword(text)}
        secureTextEntry={true}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirmar contraseña"
        value={confirmarPassword}
        onChangeText={text => setConfirmarPassword(text)}
        secureTextEntry={true}
      />
      <TextInput
        style={styles.input}
        placeholder="Alias (lo verán otros usuarios)"
        value={alias}
        onChangeText={text => setAlias(text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Nombre (privado)"
        value={nombre}
        onChangeText={text => setNombre(text)}
      />

      {/* (nuevo) Casilla de aviso de privacidad, obligatoria para registrarse */}
      <View style={styles.filaPrivacidad}>
        <Switch
          value={aceptoPrivacidad}
          onValueChange={valor => setAceptoPrivacidad(valor)}
          trackColor={{ true: colors.oliva, false: colors.borde }}
        />
        <Text style={styles.textoPrivacidad}>Acepto el aviso de privacidad</Text>
      </View>

      {/* (clase) ActivityIndicator mientras se procesa, así no se manda dos veces */}
      {cargando ? (
        <ActivityIndicator size="large" color={colors.oliva} />
      ) : (
        <Button title="Registrarme" color={colors.oliva} onPress={registrarse} />
      )}
    </ScrollView>
  );
}

// (clase) Estilos al final del archivo
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
  filaPrivacidad: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: espaciado.lg,
  },
  textoPrivacidad: {
    ...tipografia.cuerpo,
    marginLeft: espaciado.sm,
    flex: 1,
  },
});
