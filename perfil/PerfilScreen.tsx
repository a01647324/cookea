import { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import { useUserProfile } from "../hooks/useUserProfile";
import useSession from "../auth/useSession";
import { VistaCargando } from "../components/StateViews";
import { colors, espaciado, radios, tipografia } from "../theme/theme";
import { MENSAJE_ERROR_CARGA } from "./usePreferencias";
import EliminarCuentaModal from "./EliminarCuentaModal";

// Saca los nombres de las filas que regresa select('alergenos(nombre)').
// Cada fila trae { alergenos: { nombre } }.
function sacarNombres(filas: any[] | null): string[] {
  const nombres: string[] = [];
  for (const fila of filas ?? []) {
    if (fila.alergenos?.nombre) nombres.push(fila.alergenos.nombre);
  }
  return nombres;
}

// Une los nombres con comas, o "Ninguna" si no hay
function textoLista(nombres: string[] | null): string {
  if (nombres === null) return "Cargando…";
  if (nombres.length === 0) return "Ninguna";
  return nombres.join(", ");
}

// PerfilScreen: la pestaña "Cuenta". Muestra los datos de la persona y
// los botones para editarlos o cerrar sesión.
// (clase) Componente declarado como función y navigation que recibe de React Navigation
export default function PerfilScreen({ navigation }: any) {
  const { session, cerrarSesion } = useSession();
  const { perfil, error: errorPerfil, recargar } = useUserProfile();

  // (clase) Un useState por cada dato. null quiere decir "todavía no carga".
  const [alergiasPropias, setAlergiasPropias] = useState<string[] | null>(null);
  const [alergiasHogar, setAlergiasHogar] = useState<string[] | null>(null);
  const [errorAlergias, setErrorAlergias] = useState(false);
  // true mientras se ve el modal de "Eliminar mi cuenta"
  const [mostrarEliminar, setMostrarEliminar] = useState(false);

  async function cargarAlergias() {
    setErrorAlergias(false);
    // (clase) async/await con try/catch para "fail gracefully"
    try {
      // (nuevo) Promise.all hace las dos consultas al mismo tiempo.
      // 'alergenos(nombre)' trae el nombre del alérgeno de la otra tabla.
      const [resPropias, resHogar] = await Promise.all([
        supabase.from("usuario_alergias").select("alergenos(nombre)"),
        supabase.from("hogar_alergias").select("alergenos(nombre)"),
      ]);
      if (resPropias.error || resHogar.error) {
        const error = resPropias.error ?? resHogar.error;
        console.log(error?.code, error?.message);
        setErrorAlergias(true);
        return;
      }
      setAlergiasPropias(sacarNombres(resPropias.data));
      setAlergiasHogar(sacarNombres(resHogar.data));
    } catch (e) {
      console.log("Error al cargar las alergias", e);
      setErrorAlergias(true);
    }
  }

  // (nuevo) useFocusEffect corre cada vez que la pantalla vuelve a verse,
  // por ejemplo al regresar de Editar perfil. Así se ven los cambios.
  useFocusEffect(
    useCallback(() => {
      recargar();
      cargarAlergias();
    }, [recargar])
  );

  function reintentar() {
    recargar();
    cargarAlergias();
  }

  // Cerrar sesión pide confirmación. Es una pregunta, no un error, así que
  // aquí sí usamos Alert.
  function confirmarCerrarSesion() {
    Alert.alert("¿Cerrar sesión?", "Para volver a entrar necesitarás tu correo y tu contraseña.", [
      { text: "Cancelar", style: "cancel" },
      // No hace falta navegar: App.tsx regresa solo al Login
      { text: "Cerrar sesión", style: "destructive", onPress: cerrarSesion },
    ]);
  }

  const hayError = errorPerfil !== null || errorAlergias;

  // La primera vez, mientras no hay perfil: indicador de carga o error.
  // Después, al recargar, se siguen viendo los datos anteriores.
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
              onPress={reintentar}
              accessibilityRole="button"
              accessibilityLabel="Reintentar"
            >
              <Text style={styles.textoBotonPrincipal}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.pantalla} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.contenido}>
        {/* (nuevo) Aviso general con "Reintentar", en vez de alert() */}
        {hayError && (
          <View style={styles.aviso} accessibilityLiveRegion="polite">
            <Text style={styles.textoAviso}>{MENSAJE_ERROR_CARGA}</Text>
            <TouchableOpacity
              style={styles.botonAviso}
              onPress={reintentar}
              accessibilityRole="button"
              accessibilityLabel="Reintentar"
            >
              <Text style={styles.textoBotonAviso}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.alias} accessibilityRole="header">
          {perfil.alias}
        </Text>
        <Text style={styles.correo}>{session?.user.email}</Text>

        <View style={styles.seccion}>
          <Text style={styles.etiqueta}>Nombre</Text>
          <Text style={styles.valor}>{perfil.nombre}</Text>
          <Text style={styles.nota}>Solo tú puedes ver tu nombre</Text>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion} accessibilityRole="header">
            Tu casa
          </Text>

          <Text style={styles.etiqueta}>Personas que viven ahí</Text>
          <Text style={styles.valor}>{perfil.personas_hogar}</Text>

          <Text style={styles.etiqueta}>Tus alergias</Text>
          <Text style={styles.valor}>{textoLista(alergiasPropias)}</Text>

          {/* Se omite si vive sola o solo */}
          {perfil.personas_hogar > 1 && (
            <>
              <Text style={styles.etiqueta}>Alergias de las demás personas de tu casa</Text>
              <Text style={styles.valor}>{textoLista(alergiasHogar)}</Text>
            </>
          )}
        </View>

        <TouchableOpacity
          style={styles.botonPrincipal}
          onPress={() => navigation.navigate("EditarPerfil")}
          accessibilityRole="button"
          accessibilityLabel="Editar perfil"
        >
          <Text style={styles.textoBotonPrincipal}>Editar perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botonPrincipal}
          onPress={() => navigation.navigate("Preferencias")}
          accessibilityRole="button"
          accessibilityLabel="Editar preferencias"
        >
          <Text style={styles.textoBotonPrincipal}>Editar preferencias</Text>
        </TouchableOpacity>

        {/* COMUNIDAD: abre Mis publicaciones dentro de la pestaña Comunidad.
            initial: false deja el feed debajo para que "regresar" funcione. */}
        <TouchableOpacity
          style={styles.botonSecundario}
          onPress={() =>
            navigation.navigate("Comunidad", { screen: "MisPublicaciones", initial: false })
          }
          accessibilityRole="button"
          accessibilityLabel="Mis publicaciones"
        >
          <Text style={styles.textoBotonSecundario}>Mis publicaciones</Text>
        </TouchableOpacity>

        {/* Abre la pantalla de la Etapa 1 */}
        <TouchableOpacity
          style={styles.botonSecundario}
          onPress={() => navigation.navigate("CambiarContrasena")}
          accessibilityRole="button"
          accessibilityLabel="Cambiar contraseña"
        >
          <Text style={styles.textoBotonSecundario}>Cambiar contraseña</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botonCerrarSesion}
          onPress={confirmarCerrarSesion}
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
        >
          <Text style={styles.textoCerrarSesion}>Cerrar sesión</Text>
        </TouchableOpacity>

        {/* Separado y menos llamativo que los demás, para no tocarlo por accidente */}
        <TouchableOpacity
          style={styles.botonEliminar}
          onPress={() => setMostrarEliminar(true)}
          accessibilityRole="button"
          accessibilityLabel="Eliminar mi cuenta"
        >
          <Text style={styles.textoEliminar}>Eliminar mi cuenta</Text>
        </TouchableOpacity>
      </ScrollView>

      <EliminarCuentaModal visible={mostrarEliminar} onCerrar={() => setMostrarEliminar(false)} />
    </SafeAreaView>
  );
}

// (clase) Estilos al final del archivo. Para cambiar el diseño, solo se toca esto.
const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contenido: {
    flexGrow: 1,
    padding: espaciado.lg,
  },
  alias: {
    ...tipografia.titulo,
    fontSize: 28,
  },
  correo: {
    ...tipografia.cuerpo,
    fontSize: 16,
    color: colors.textoSecundario,
    marginBottom: espaciado.md,
  },
  seccion: {
    backgroundColor: colors.surface,
    borderRadius: radios.md,
    padding: espaciado.md,
    marginBottom: espaciado.md,
  },
  tituloSeccion: {
    ...tipografia.subtitulo,
    fontSize: 18,
    marginBottom: espaciado.sm,
  },
  etiqueta: {
    ...tipografia.chico,
    fontSize: 14,
    marginTop: espaciado.sm,
  },
  valor: {
    ...tipografia.cuerpo,
    fontSize: 16,
  },
  nota: {
    ...tipografia.chico,
    fontStyle: "italic",
    marginTop: espaciado.xs,
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
  botonAviso: {
    minHeight: 48,
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  textoBotonAviso: {
    color: colors.olivaOscuro,
    fontSize: 16,
    fontWeight: "700",
    textDecorationLine: "underline",
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
  botonCerrarSesion: {
    minHeight: 48,
    borderWidth: 2,
    borderColor: colors.vino,
    borderRadius: radios.pill,
    paddingVertical: espaciado.sm,
    paddingHorizontal: espaciado.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: espaciado.md,
  },
  textoCerrarSesion: {
    color: colors.vino,
    fontSize: 16,
    fontWeight: "700",
  },
  botonEliminar: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: espaciado.xl * 2,
  },
  textoEliminar: {
    color: colors.error,
    fontSize: 15,
  },
});