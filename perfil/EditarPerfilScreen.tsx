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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePreventRemove } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import { useUserProfile } from "../hooks/useUserProfile";
import CampoFormulario from "../auth/CampoFormulario";
import { VistaCargando } from "../components/StateViews";
import { colors, espaciado, radios, tipografia } from "../theme/theme";
import {
  ALIAS_MIN,
  ALIAS_MAX,
  NOMBRE_MIN,
  NOMBRE_MAX,
  validarAlias,
  validarNombre,
} from "./preferencias";
import {
  MENSAJE_ERROR_CARGA,
  MENSAJE_ERROR_GUARDAR,
  MENSAJE_CERO_FILAS,
  MENSAJE_SIN_CONEXION,
} from "./usePreferencias";

// EditarPerfilScreen: cambia el alias y el nombre.
// (clase) Componente declarado como función y navigation que recibe de React Navigation
export default function EditarPerfilScreen({ navigation }: any) {
  const { perfil, error: errorPerfil, recargar } = useUserProfile();

  // (clase) Un useState por cada campo y cada mensaje
  const [alias, setAlias] = useState("");
  const [nombre, setNombre] = useState("");
  // Lo que hay en la base, para saber si hubo cambios
  const [aliasGuardado, setAliasGuardado] = useState("");
  const [nombreGuardado, setNombreGuardado] = useState("");

  const [errorAlias, setErrorAlias] = useState("");
  const [errorNombre, setErrorNombre] = useState("");
  const [aviso, setAviso] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [listo, setListo] = useState(false); // true cuando ya se guardó

  // (nuevo) useRef para pasar al campo de abajo con la tecla "siguiente"
  const campoNombre = useRef<TextInput>(null);

  // Cuando llega el perfil, llenamos los campos con los valores actuales
  useEffect(() => {
    if (perfil !== null) {
      setAlias(perfil.alias);
      setNombre(perfil.nombre);
      setAliasGuardado(perfil.alias);
      setNombreGuardado(perfil.nombre);
    }
  }, [perfil]);

  const hayCambios =
    perfil !== null && (alias.trim() !== aliasGuardado || nombre.trim() !== nombreGuardado);

  // (nuevo) usePreventRemove detiene la salida (botón "atrás", gesto o
  // goBack) mientras haya cambios sin guardar, y pregunta antes de salir.
  usePreventRemove(hayCambios, ({ data }) => {
    Alert.alert("¿Salir sin guardar los cambios?", "Si sales ahora, se perderán.", [
      { text: "Quedarme", style: "cancel" },
      {
        text: "Salir sin guardar",
        style: "destructive",
        onPress: () => navigation.dispatch(data.action),
      },
    ]);
  });

  async function guardar() {
    if (guardando || !hayCambios || perfil === null) return;

    // (clase) Validaciones en el celular antes de llamar al servidor
    const aliasLimpio = alias.trim();
    const nombreLimpio = nombre.trim();
    const problemaAlias = validarAlias(aliasLimpio);
    const problemaNombre = validarNombre(nombreLimpio);
    setErrorAlias(problemaAlias ?? "");
    setErrorNombre(problemaNombre ?? "");
    setAviso("");
    if (problemaAlias !== null || problemaNombre !== null) return;

    // Solo mandamos los campos que cambiaron
    const cambios: { alias?: string; nombre?: string } = {};
    if (aliasLimpio !== aliasGuardado) cambios.alias = aliasLimpio;
    if (nombreLimpio !== nombreGuardado) cambios.nombre = nombreLimpio;

    setGuardando(true);

    // (clase) async/await con try/catch/finally para "fail gracefully"
    try {
      // (nuevo) perfil.id es el id de la sesión (useUserProfile lo busca así).
      // .select() regresa las filas actualizadas: si son cero, RLS no
      // encontró la fila aunque Supabase no mande error.
      const { data, error, status } = await supabase
        .from("perfiles")
        .update(cambios)
        .eq("id", perfil.id)
        .select("id");

      if (error) {
        console.log(error.code, error.message);
        // (nuevo) status 0: no hubo respuesta del servidor (sin internet)
        setAviso(status === 0 ? MENSAJE_SIN_CONEXION : MENSAJE_ERROR_GUARDAR);
        return;
      }
      if (data === null || data.length === 0) {
        console.log("update de perfiles regresó cero filas");
        setAviso(MENSAJE_CERO_FILAS);
        return;
      }

      setAlias(aliasLimpio);
      setNombre(nombreLimpio);
      setAliasGuardado(aliasLimpio);
      setNombreGuardado(nombreLimpio);
      setListo(true);
    } catch (e) {
      console.log("Error al guardar el perfil", e);
      setAviso(MENSAJE_SIN_CONEXION);
    } finally {
      setGuardando(false);
    }
  }

  // Pantalla de éxito, con un botón para volver (no una alerta)
  if (listo) {
    return (
      <SafeAreaView style={styles.pantalla} edges={["top"]}>
        <View style={styles.contenido}>
          <Text style={styles.titulo} accessibilityRole="header">
            Tus datos se guardaron
          </Text>
          <TouchableOpacity
            style={styles.botonPrincipal}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Text style={styles.textoBotonPrincipal}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Mientras carga el perfil, o si no se pudo cargar
  if (perfil === null) {
    return (
      <SafeAreaView style={styles.pantalla} edges={["top"]}>
        {errorPerfil === null ? (
          <VistaCargando mensaje="Cargando tus datos…" />
        ) : (
          <View style={styles.contenido}>
            <View style={styles.aviso} accessibilityLiveRegion="polite">
              <Text style={styles.textoAviso}>{MENSAJE_ERROR_CARGA}</Text>
            </View>
            <TouchableOpacity
              style={styles.botonPrincipal}
              onPress={recargar}
              accessibilityRole="button"
              accessibilityLabel="Reintentar"
            >
              <Text style={styles.textoBotonPrincipal}>Reintentar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.botonSecundario}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Volver"
            >
              <Text style={styles.textoBotonSecundario}>Volver</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    );
  }

  const puedeGuardar = hayCambios && !guardando;

  return (
    <SafeAreaView style={styles.pantalla} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.contenido}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.titulo} accessibilityRole="header">
            Editar perfil
          </Text>

          {/* (nuevo) Aviso general arriba del formulario, en vez de alert() */}
          {aviso !== "" && (
            <View style={styles.aviso} accessibilityLiveRegion="polite">
              <Text style={styles.textoAviso}>{aviso}</Text>
            </View>
          )}

          <CampoFormulario
            etiqueta="Alias"
            ayuda={`De ${ALIAS_MIN} a ${ALIAS_MAX} letras. Es el nombre que verán los demás.`}
            value={alias}
            onChangeText={(texto) => {
              setAlias(texto);
              setErrorAlias("");
            }}
            error={errorAlias}
            maxLength={ALIAS_MAX}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => campoNombre.current?.focus()}
            submitBehavior="submit"
            editable={!guardando}
          />

          <CampoFormulario
            ref={campoNombre}
            etiqueta="Nombre"
            ayuda={`De ${NOMBRE_MIN} a ${NOMBRE_MAX} letras. Solo tú puedes verlo.`}
            value={nombre}
            onChangeText={(texto) => {
              setNombre(texto);
              setErrorNombre("");
            }}
            error={errorNombre}
            maxLength={NOMBRE_MAX}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            returnKeyType="done"
            onSubmitEditing={guardar}
            editable={!guardando}
          />

          <TouchableOpacity
            style={[styles.botonPrincipal, !puedeGuardar && styles.botonDeshabilitado]}
            onPress={guardar}
            disabled={!puedeGuardar}
            accessibilityRole="button"
            accessibilityLabel="Guardar"
            accessibilityState={{ disabled: !puedeGuardar }}
          >
            <Text style={styles.textoBotonPrincipal}>
              {guardando ? "Guardando…" : "Guardar"}
            </Text>
          </TouchableOpacity>

          {/* Siempre hay salida. Si hay cambios, usePreventRemove pregunta antes */}
          <TouchableOpacity
            style={styles.botonSecundario}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Text style={styles.textoBotonSecundario}>Volver</Text>
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
  titulo: {
    ...tipografia.titulo,
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
});
