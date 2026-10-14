import useProteccionCapturas from "./useProteccionCapturas";
import { usePreventRemove } from "@react-navigation/native";
import useCocina from "./useCocina";
import BloquesCocina from "./BloquesCocina";
import Encabezado from "./Encabezado";
import useRetroceso from "../auth/useRetroceso";
import { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { VistaCargando } from "../components/StateViews";
import { colors, espaciado, radios, tipografia } from "../theme/theme";
import usePreferencias, {
  MENSAJE_ERROR_GUARDAR,
  MENSAJE_SIN_CONEXION,
} from "./usePreferencias";
import SelectorPersonas from "./SelectorPersonas";
import ListaAlergenos from "./ListaAlergenos";

// PersonalizaScreen: pide las preferencias paso a paso.
// Se abre desde la tarjeta de la Home (TarjetaPersonaliza), que se ve
// mientras la sesión no tenga la marca "personalizo". No es obligatoria.
// (clase) Componente declarado como función y navigation que recibe de React Navigation
export default function PersonalizaScreen({ navigation }: any) {
  useProteccionCapturas("personaliza");
  const cocina = useCocina();
  const bloqueo = useRef(false);
  const preferencias = usePreferencias();
  const {
    alergenos,
    personas,
    cambiarPersonas,
    propias,
    alternarPropia,
    hogar,
    alternarHogar,
    cargando: cargaAlergias,
    errorCarga: errorAlergias,
    recargar: recargarAlergias,
    guardar,
  } = preferencias;

  const cargando = cargaAlergias || cocina.cargando;
  const errorCarga = errorAlergias || cocina.error;
  const recargar = () => { if (errorAlergias) recargarAlergias(); if (cocina.error) cocina.recargar(); };
  // (clase) Un useState por cada dato de la pantalla
  const [paso, setPaso] = useState(1);
  const [aviso, setAviso] = useState("");
  const [ocupado, setOcupado] = useState(false); // guardando o marcando

  const [terminado, setTerminado] = useState(false);
  usePreventRemove(ocupado && !terminado, () => {});
  // (nuevo) Navegar después del render que libera la protección de salida.
  useEffect(() => { if (terminado) navigation.goBack(); }, [terminado, navigation]);
  useRetroceso(() => { if (!bloqueo.current && !ocupado) { if (paso > 1) setPaso(paso - 1); else navigation.goBack(); } });

  // Si vive sola o solo, no se pregunta por las alergias del hogar
  const pasoCocina = personas === 1 ? 3 : 4;
  const totalPasos = pasoCocina;
  const esUltimoPaso = paso === totalPasos;

  // (nuevo) Guarda la marca "personalizo" en los datos del usuario.
  // Supabase la combina con los que ya existen (alias, nombre) y lanza
  // USER_UPDATED: useSession recibe la sesión nueva y la tarjeta de la Home
  // se esconde sola.
  async function marcarPersonalizado(): Promise<boolean> {
    const { error } = await supabase.auth.updateUser({ data: { personalizo: true } });
    if (error) {
      // (nuevo) Sin internet, Supabase regresa este tipo de error en vez de lanzarlo
      setAviso(isAuthRetryableFetchError(error) ? MENSAJE_SIN_CONEXION : MENSAJE_ERROR_GUARDAR);
      return false;
    }
    return true;
  }

  // Guarda todo y, al final, la marca. Si algo falla antes, la marca no se
  // guarda: la tarjeta de la Home sigue y nada queda a medias sin avisar.
  // La selección se conserva para poder tocar "Terminar" otra vez.
  // Si todo sale bien, regresa a la Home.
  async function terminar(propiasElegidas: Set<number> = propias, hogarElegido: Set<number> = hogar) {
    if (bloqueo.current || ocupado) return;
    bloqueo.current = true;
    setOcupado(true);
    setAviso("");

    // (clase) async/await con try/catch/finally para "fail gracefully"
    try {
      const mensaje = await guardar(propiasElegidas, hogarElegido);
      if (mensaje !== null) {
        setAviso("No se completó el guardado. Algunos cambios pueden haberse guardado. Conservamos tu selección para reintentar. " + mensaje);
        return;
      }
      const errorCocina = await cocina.guardar();
      if (errorCocina) { setAviso(errorCocina); return; }
      const marcado = await marcarPersonalizado();
      if (marcado) setTerminado(true);
    } catch {
      setAviso(MENSAJE_SIN_CONEXION);
    } finally {
      bloqueo.current = false;
      setOcupado(false);
    }
  }

  // "Hacerlo después": regresa a la Home sin guardar nada. La tarjeta sigue
  // ahí para contestar después; "Ahora no" en la tarjeta la esconde.
  function hacerloDespues() {
    if (bloqueo.current || ocupado) return;
    navigation.goBack();
  }

  function siguiente() {
    if (bloqueo.current || ocupado) return;
    setAviso("");
    if (esUltimoPaso) terminar();
    else setPaso(paso + 1);
  }

  function atras() {
    if (bloqueo.current) return;
    setAviso("");
    setPaso(paso - 1);
  }

  // "No tengo alergias" (paso 2) o "Nadie más tiene alergias" (paso 3):
  // limpia la selección de ese paso y avanza. Si es el último paso, termina,
  // pasando la selección vacía porque el estado nuevo aún no estaría listo.
  function ningunaAlergia() {
    if (bloqueo.current || ocupado) return;
    const vacio = new Set<number>();
    if (paso === 2) {
      preferencias.limpiarPropias();
      if (esUltimoPaso) terminar(vacio, hogar);
      else setPaso(3);
    } else {
      preferencias.limpiarHogar();
      setPaso(pasoCocina);
    }
  }

  // Botones que se ven en todos los pasos: "Hacerlo después" y su nota
  const salida = (
    <>
      <TouchableOpacity
        style={[styles.link, ocupado && styles.botonDeshabilitado]}
        onPress={hacerloDespues}
        disabled={ocupado}
        accessibilityRole="button"
        accessibilityLabel="Hacerlo después"
      >
        <Text style={styles.textoLink}>Hacerlo después</Text>
      </TouchableOpacity>
      <Text style={styles.nota}>Puedes cambiar esto cuando quieras en Cuenta.</Text>
    </>
  );

  if (cargando) {
    return (
      <SafeAreaView style={styles.pantalla} edges={["top"]}>
      <Encabezado titulo="Personaliza" onVolver={() => { if (paso > 1) atras(); else hacerloDespues(); }} deshabilitado={ocupado} />
        <VistaCargando mensaje="Cargando…" />
      </SafeAreaView>
    );
  }

  if (errorCarga !== "") {
    return (
      <SafeAreaView style={styles.pantalla} edges={["top"]}>
      <Encabezado titulo="Personaliza" onVolver={() => { if (paso > 1) atras(); else hacerloDespues(); }} deshabilitado={ocupado} />
        <View style={styles.contenido}>
          <View style={styles.aviso} accessibilityLiveRegion="polite">
            <Text style={styles.textoAviso}>{errorCarga}</Text>
          </View>
          {aviso !== "" && (
            <View style={styles.aviso} accessibilityLiveRegion="polite">
              <Text style={styles.textoAviso}>{aviso}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.botonPrincipal}
            onPress={recargar}
            accessibilityRole="button"
            accessibilityLabel="Reintentar"
          >
            <Text style={styles.textoBotonPrincipal}>Reintentar</Text>
          </TouchableOpacity>
          {salida}
        </View>
      </SafeAreaView>
    );
  }

  // Textos de los botones según el paso
  let textoPrincipal = "Siguiente";
  if (esUltimoPaso) textoPrincipal = ocupado ? "Guardando…" : "Terminar";

  let textoNinguna = "";
  if (paso === 2) textoNinguna = esUltimoPaso ? "No tengo alergias, terminar" : "No tengo alergias";
  if (paso === 3 && personas > 1) textoNinguna = "Nadie más tiene alergias";
  if (ocupado && esUltimoPaso) textoNinguna = "Guardando…";

  return (
    <SafeAreaView style={styles.pantalla} edges={["top"]}>
      <Encabezado titulo="Personaliza" onVolver={() => { if (paso > 1) atras(); else hacerloDespues(); }} deshabilitado={ocupado} />
      <ScrollView contentContainerStyle={styles.contenido}>
        <Text style={styles.indicadorPaso}>
          Paso {paso} de {totalPasos}
        </Text>

        {/* (nuevo) Aviso general arriba, en vez de alert() */}
        {aviso !== "" && (
          <View style={styles.aviso} accessibilityLiveRegion="polite">
            <Text style={styles.textoAviso}>{aviso}</Text>
          </View>
        )}

        {paso === 1 && (
          <>
            <Text style={styles.pregunta} accessibilityRole="header">
              ¿Cuántas personas viven en tu casa, contándote a ti?
            </Text>
            <Text style={styles.explicacion}>
              Así te mostramos recetas seguras para todas las personas de tu casa.
            </Text>
            <SelectorPersonas valor={personas} onCambiar={cambiarPersonas} deshabilitado={ocupado} />
          </>
        )}

        {paso === 2 && (
          <>
            <Text style={styles.pregunta} accessibilityRole="header">
              ¿Tienes alguna alergia a alimentos?
            </Text>
            <Text style={styles.explicacion}>
              Marca todas las que tengas. No te mostraremos recetas con esos ingredientes.
            </Text>
          </>
        )}

        {paso === 3 && personas > 1 && (
          <>
            <Text style={styles.pregunta} accessibilityRole="header">
              ¿Alguien más en tu casa tiene alergias?
            </Text>
            <Text style={styles.explicacion}>
              Marca las alergias de las demás personas que viven contigo.
            </Text>
          </>
        )}

        {paso >= 2 && paso < pasoCocina && (
          <>
            <TouchableOpacity
              style={[styles.botonSecundario, ocupado && styles.botonDeshabilitado]}
              onPress={ningunaAlergia}
              disabled={ocupado}
              accessibilityRole="button"
              accessibilityLabel={textoNinguna}
            >
              <Text style={styles.textoBotonSecundario}>{textoNinguna}</Text>
            </TouchableOpacity>

            <View style={styles.espacioLista}>
              <ListaAlergenos
                alergenos={alergenos}
                seleccionados={paso === 2 ? propias : hogar}
                onAlternar={paso === 2 ? alternarPropia : alternarHogar}
                deshabilitado={ocupado}
              />
            </View>
          </>
        )}

        {paso === 2 && <BloquesCocina cocina={cocina} deshabilitado={ocupado} solo="gustos" />}
        {paso === pasoCocina && <BloquesCocina cocina={cocina} deshabilitado={ocupado} solo="cocina" />}
        <TouchableOpacity
          style={[styles.botonPrincipal, ocupado && styles.botonDeshabilitado]}
          onPress={siguiente}
          disabled={ocupado}
          accessibilityRole="button"
          accessibilityLabel={textoPrincipal}
        >
          <Text style={styles.textoBotonPrincipal}>{textoPrincipal}</Text>
        </TouchableOpacity>



        {salida}
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
    width: '100%', maxWidth: 640, alignSelf: 'center',
    padding: espaciado.lg,
  },
  indicadorPaso: {
    ...tipografia.chico,
    fontSize: 14,
    marginBottom: espaciado.xs,
  },
  pregunta: {
    ...tipografia.titulo,
    marginBottom: espaciado.sm,
  },
  explicacion: {
    ...tipografia.cuerpo,
    fontSize: 16,
    marginBottom: espaciado.md,
  },
  espacioLista: {
    marginTop: espaciado.md,
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
  link: {
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: espaciado.md,
  },
  textoLink: {
    color: colors.olivaOscuro,
    fontSize: 16,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  nota: {
    ...tipografia.chico,
    fontSize: 14,
    textAlign: "center",
  },
});
