import useProteccionCapturas from "./useProteccionCapturas";
import useSession from "../auth/useSession";
import { obtenerSeccion, SeccionPreferencias } from "./secciones";
import useCocina from "./useCocina";
import BloquesCocina from "./BloquesCocina";
import Encabezado from "./Encabezado";
import { useCallback, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, usePreventRemove } from "@react-navigation/native";
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
  useProteccionCapturas("preferencias");
  const { session } = useSession();
  const [seccion, setSeccion] = useState<SeccionPreferencias>(() => session ? obtenerSeccion(session.user.id) : 'restricciones');
  useFocusEffect(useCallback(() => { if (session) setSeccion(obtenerSeccion(session.user.id)); }, [session]));
  const tituloSeccion = { restricciones: 'Mis restricciones', hogar: 'Mi hogar', cocina: 'Mi cocina' }[seccion];
  const cocina = useCocina();
  const bloqueo = useRef(false);
  const [guardandoTodo, setGuardandoTodo] = useState(false);
  const {
    alergenos,
    personas,
    cambiarPersonas,
    propias,
    alternarPropia,
    hogar,
    alternarHogar,
    hayCambios: cambiosAlergias,
    cargando: cargaAlergias,
    errorCarga: errorAlergias,
    recargar: recargarAlergias,
    guardando: guardandoAlergias,
    guardar,
  } = usePreferencias();

  const hayCambios = cambiosAlergias || cocina.hayCambios;
  const cargando = cargaAlergias || cocina.cargando;
  const errorCarga = errorAlergias || cocina.error;
  const guardando = guardandoTodo || guardandoAlergias || cocina.guardando;
  const recargar = () => { if (errorAlergias) recargarAlergias(); if (cocina.error) cocina.recargar(); };
  // (clase) Un useState por cada dato de la pantalla
  const [aviso, setAviso] = useState("");
  const [listo, setListo] = useState(false); // true cuando ya se guardó

  // (nuevo) usePreventRemove detiene la salida (botón "atrás", gesto o
  // goBack) mientras haya cambios sin guardar, y pregunta antes de salir.
  usePreventRemove((hayCambios && !listo) || guardando, ({ data }) => {
    if (guardando) return;
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
    if (bloqueo.current || guardando || !hayCambios || cargando || errorCarga) return;
    bloqueo.current = true; setGuardandoTodo(true);
    try {
    setAviso("");
    const mensaje = seccion === "cocina" ? null : await guardar(propias, hogar, seccion);
    if (mensaje !== null) {
      setAviso("No se completó el guardado. Algunos cambios pueden haberse guardado. Conservamos tu selección para reintentar. " + mensaje);
      return;
    }
    const errorCocina = seccion === "hogar" ? null : await cocina.guardar(seccion === "restricciones" ? "gustos" : "cocina");
    if (errorCocina) { setAviso(errorCocina); return; }
    setListo(true);
    } finally { bloqueo.current = false; setGuardandoTodo(false); }
  }

  // Pantalla de éxito, con un botón para volver (no una alerta)
  if (listo) {
    return (
      <SafeAreaView style={styles.pantalla} edges={["top"]}>
        <Encabezado titulo={tituloSeccion} onVolver={() => navigation.goBack()} deshabilitado={guardando} />
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
        <Encabezado titulo={tituloSeccion} onVolver={() => navigation.goBack()} deshabilitado={guardando} />
        <VistaCargando mensaje="Cargando tus preferencias…" />
      </SafeAreaView>
    );
  }

  if (errorCarga !== "") {
    return (
      <SafeAreaView style={styles.pantalla} edges={["top"]}>
        <Encabezado titulo={tituloSeccion} onVolver={() => navigation.goBack()} deshabilitado={guardando} />
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
        <Encabezado titulo={tituloSeccion} onVolver={() => navigation.goBack()} deshabilitado={guardando} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo} accessibilityRole="header">
          {tituloSeccion}
        </Text>

        {/* (nuevo) Aviso general arriba, en vez de alert() */}
        {aviso !== "" && (
          <View style={styles.aviso} accessibilityLiveRegion="polite">
            <Text style={styles.textoAviso}>{aviso}</Text>
          </View>
        )}

        {seccion === 'restricciones' && <>
          <Text style={styles.tituloSeccion}>Tus alergias</Text>
          <ListaAlergenos alergenos={alergenos} seleccionados={propias} onAlternar={alternarPropia} deshabilitado={guardando} />
          <BloquesCocina cocina={cocina} deshabilitado={guardando} solo="gustos" />
        </>}
        {seccion === 'hogar' && <>
          <Text style={styles.tituloSeccion}>Personas en tu casa</Text>
          <Text style={styles.explicacion}>Contándote a ti.</Text>
          <SelectorPersonas valor={personas} onCambiar={cambiarPersonas} deshabilitado={guardando} />
          <Text style={styles.tituloSeccion}>Alergias de las demás personas de tu casa</Text>
          {personas === 1 ? <Text style={styles.explicacion}>Si vives sola o solo, al guardar se eliminarán las alergias del hogar registradas.</Text> : <ListaAlergenos alergenos={alergenos} seleccionados={hogar} onAlternar={alternarHogar} deshabilitado={guardando} />}
        </>}
        {seccion === 'cocina' && <BloquesCocina cocina={cocina} deshabilitado={guardando} solo="cocina" />}

      </ScrollView>
      {/* (nuevo) Acción persistente, fuera del formulario desplazable. */}
      <View style={styles.acciones}>
        <TouchableOpacity
          style={[styles.botonPrincipal, !puedeGuardar && styles.botonDeshabilitado]}
          onPress={guardarCambios}
          disabled={!puedeGuardar}
          accessibilityRole="button"
          accessibilityLabel="Guardar"
          accessibilityState={{ disabled: !puedeGuardar }}
        >
          <Text style={styles.textoBotonPrincipal}>{guardando ? "Guardando…" : "Guardar"}</Text>
        </TouchableOpacity>
        {!hayCambios && <Text style={styles.ayudaGuardar}>No hay cambios pendientes.</Text>}
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// (clase) Estilos al final del archivo. Para cambiar el diseño, solo se toca esto.
const styles = StyleSheet.create({
  flex: { flex: 1 },
  acciones: { paddingHorizontal: espaciado.md, paddingVertical: espaciado.sm, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.borde },
  ayudaGuardar: { ...tipografia.chico, textAlign: "center", marginTop: espaciado.xs },
  pantalla: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contenido: {
    flexGrow: 1,
    width: '100%', maxWidth: 640, alignSelf: 'center',
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
    minHeight: 56,
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
    fontSize: 17,
    lineHeight: 25, textAlign: "center",
    fontWeight: "700",
  },
  botonSecundario: {
    minHeight: 56,
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
    fontSize: 17,
    lineHeight: 25, textAlign: "center",
    fontWeight: "700",
  },
  botonDeshabilitado: {
    opacity: 0.5,
  },
});
