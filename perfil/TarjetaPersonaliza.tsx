import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import useSession from "../auth/useSession";
import Icono from "../components/Icono";
import { colors, espaciado, fuentes, radios, sombra, tamanos } from "../theme/theme";

// (nuevo) Variable fuera del componente: vive mientras la app está abierta,
// aunque la Home se vuelva a crear (por ejemplo, al cerrar y abrir sesión).
// Al cerrar la app por completo vuelve a false y la tarjeta reaparece.
let escondidaHastaReabrir = false;

// TarjetaPersonaliza: invitación en la Home para contestar Personaliza.
// No obliga a nada: "Empezar" abre Personaliza y "Ahora no" la esconde
// hasta la próxima vez que se abra la app.
// Deja de salir para siempre cuando la persona termina Personaliza, que
// guarda la marca "personalizo". La marca solo controla esta invitación,
// nunca permisos.
export default function TarjetaPersonaliza() {
  const navigation = useNavigation<any>();
  const { session } = useSession();

  const [escondida, setEscondida] = useState(escondidaHastaReabrir);

  if (escondida || session === null || session.user.user_metadata?.personalizo === true) {
    return null;
  }

  function ahoraNo() {
    escondidaHastaReabrir = true;
    setEscondida(true);
  }

  return (
    <View style={styles.tarjeta}>
      <View style={styles.encabezado}>
        <View style={styles.circulo}>
          <Icono nombre="users-group-rounded-linear" size={22} color={colors.textoSuave} />
        </View>
        <Text style={styles.titulo} accessibilityRole="header">
          Cuéntanos sobre tu casa
        </Text>
      </View>
      <Text style={styles.texto}>
        Dinos cuántas personas viven contigo y sus alergias, para no mostrarte
        recetas con esos ingredientes. Mientras tanto, verás todas las recetas.
      </Text>

      <View style={styles.botones}>
        <TouchableOpacity
          style={styles.link}
          onPress={ahoraNo}
          accessibilityRole="button"
          accessibilityLabel="Ahora no"
        >
          <Text style={styles.textoLink}>Ahora no</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.botonPrincipal}
          onPress={() => navigation.navigate("Personaliza")}
          accessibilityRole="button"
          accessibilityLabel="Empezar"
        >
          <Text style={styles.textoBotonPrincipal}>Empezar</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.nota}>
        Te lo recordaremos la próxima vez que abras la app. También puedes
        hacerlo en Cuenta, en "Editar preferencias".
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    marginHorizontal: espaciado.md,
    marginTop: espaciado.lg,
    padding: espaciado.md,
    backgroundColor: colors.superficie,
    borderRadius: radios.lg,
    ...sombra,
  },
  encabezado: {
    flexDirection: "row",
    alignItems: "center",
    gap: espaciado.sm,
    marginBottom: espaciado.sm,
  },
  circulo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.calidoSuave,
    alignItems: "center",
    justifyContent: "center",
  },
  titulo: {
    flex: 1,
    fontFamily: fuentes.titulo,
    fontSize: 19,
    lineHeight: 26,
    color: colors.texto,
  },
  texto: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.cuerpo,
    lineHeight: 23,
    color: colors.textoSuave,
  },
  botones: {
    flexDirection: "row",
    gap: espaciado.sm,
    marginTop: espaciado.md,
  },
  botonPrincipal: {
    flex: 1,
    minHeight: 50,
    backgroundColor: colors.primario,
    borderRadius: radios.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotonPrincipal: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.sobrePrimario,
  },
  link: {
    flex: 1,
    minHeight: 50,
    borderRadius: radios.pill,
    borderWidth: 1.5,
    borderColor: colors.borde,
    alignItems: "center",
    justifyContent: "center",
  },
  textoLink: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.destacado,
    color: colors.acentoOscuro,
  },
  nota: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.chico,
    lineHeight: 19,
    color: colors.textoSuave,
    textAlign: "center",
    marginTop: espaciado.sm,
  },
});
