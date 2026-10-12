import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePreventRemove } from "@react-navigation/native";
import { VistaCargando } from "../components/StateViews";
import { colors, espaciado, radios, tipografia } from "../theme/theme";
import usePreferencias from "./usePreferencias";
import SelectorPersonas from "./SelectorPersonas";
import ListaAlergenos from "./ListaAlergenos";

// PreferenciasScreen: "Editar preferencias", desde Perfil.
// Las mismas preguntas de Personaliza, pero en una sola pantalla con
// desplazamiento, porque la persona ya las conoce.
// (clase) Componente declarado como función y navigation que recibe de React Navigation
export default function PreferenciasScreen({ navigation }: any) {
  const {
    alergenos,
    personas,
    cambiarPersonas,
    propias,
    alternarPropia,
    hogar,
    alternarHogar,
    hayCambios,
    cargando,
    errorCarga,
    recargar,
    guardando,
    guardar,
  } = usePreferencias();

  // (clase) Un useState por cada dato de la pantalla
  const [aviso, setAviso] = useState("");
  const [listo, setListo] = useState(false); // true cuando ya se guardó

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

  // Guarda en el mismo orden que Personaliza, sin la marca "personalizo".
  // Con 1 persona, usePreferencias borra las alergias del hogar.
  async function guardarCambios() {
    if (guardando || !hayCambios) return;
    setAviso("");
    const mensaje = await guardar();
    if (mensaje !== null) {
      setAviso(mensaje);
      return;
    }
    setListo(true);
  }

  // Pantalla de éxito, con un botón para volver (no una alerta)
  if (listo) {
    return (
      <SafeAreaView style={styles.pantalla} edges={["top"]}>
        <View style={styles.contenido}>
          <Text style={styles.titulo} accessibilityRole="header">
            Tus preferencias se guardaron
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

  if (cargando) {
    return (
      <SafeAreaView style={styles.pantalla} edges={["top"]}>
        <VistaCargando mensaje="Cargando tus preferencias…" />
      </SafeAreaView>
    );
  }

  if (errorCarga !== "") {
    return (
      <SafeAreaView style={styles.pantalla} edges={["top"]}>
        <View style={styles.contenido}>
          <View style={styles.aviso} accessibilityLiveRegion="polite">
            <Text style={styles.textoAviso}>{errorCarga}</Text>
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
      </SafeAreaView>
    );
  }

  const puedeGuardar = hayCambios && !guardando;

  return (
    <SafeAreaView style={styles.pantalla} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <Text style={styles.titulo} accessibilityRole="header">
          Editar preferencias
        </Text>

        {/* (nuevo) Aviso general arriba, en vez de alert() */}
        {aviso !== "" && (
          <View style={styles.aviso} accessibilityLiveRegion="polite">
            <Text style={styles.textoAviso}>{aviso}</Text>
          </View>
        )}

        <Text style={styles.tituloSeccion} accessibilityRole="header">
          Personas en tu casa
        </Text>
        <Text style={styles.explicacion}>Contándote a ti.</Text>
        <SelectorPersonas valor={personas} onCambiar={cambiarPersonas} deshabilitado={guardando} />

        <Text style={styles.tituloSeccion} accessibilityRole="header">
          Tus alergias
        </Text>
        <ListaAlergenos
          alergenos={alergenos}
          seleccionados={propias}
          onAlternar={alternarPropia}
          deshabilitado={guardando}
        />

        <Text style={[styles.tituloSeccion, styles.separacion]} accessibilityRole="header">
          Alergias de las demás personas de tu casa
        </Text>
        {personas === 1 ? (
          <Text style={styles.explicacion}>
            Si vives sola o solo, no hay alergias de otras personas que guardar.
          </Text>
        ) : (
          <ListaAlergenos
            alergenos={alergenos}
            seleccionados={hogar}
            onAlternar={alternarHogar}
            deshabilitado={guardando}
          />
        )}

        <TouchableOpacity
          style={[styles.botonPrincipal, styles.separacion, !puedeGuardar && styles.botonDeshabilitado]}
          onPress={guardarCambios}
          disabled={!puedeGuardar}
          accessibilityRole="button"
          accessibilityLabel="Guardar"
          accessibilityState={{ disabled: !puedeGuardar }}
        >
          <Text style={styles.textoBotonPrincipal}>{guardando ? "Guardando…" : "Guardar"}</Text>
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
  titulo: {
    ...tipografia.titulo,
    marginBottom: espaciado.md,
  },
  tituloSeccion: {
    ...tipografia.subtitulo,
    fontSize: 18,
    marginBottom: espaciado.sm,
  },
  separacion: {
    marginTop: espaciado.lg,
  },
  explicacion: {
    ...tipografia.cuerpo,
    fontSize: 16,
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
