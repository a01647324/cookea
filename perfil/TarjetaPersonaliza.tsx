import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import useSession from "../auth/useSession";
import { colors, espaciado, radios, tipografia } from "../theme/theme";

// (nuevo) Variable fuera del componente: vive mientras la app está abierta,
// aunque la Home se vuelva a crear (por ejemplo, al cerrar y abrir sesión).
// Al cerrar la app se limpia el conjunto y la tarjeta reaparece.
const usuariosQuePospusieron = new Set<string>();

// TarjetaPersonaliza: invitación en la Home para contestar Personaliza.
// No obliga a nada: "Empezar" abre Personaliza y "Ahora no" la esconde
// hasta la próxima vez que se abra la app.
// Deja de salir para siempre cuando la persona termina Personaliza, que
// guarda la marca "personalizo". La marca solo controla esta invitación,
// nunca permisos.
export default function TarjetaPersonaliza() {
  const navigation = useNavigation<any>();
  const { session } = useSession();

  // (clase) useState para que la tarjeta desaparezca en cuanto se toca "Ahora no"
  const [escondida, setEscondida] = useState<string | null>(null);

  // Sin sesión todavía, ya personalizó, o tocó "Ahora no": no se muestra nada
  if (session === null || escondida === session.user.id || usuariosQuePospusieron.has(session.user.id) || session.user.user_metadata?.personalizo === true) {
    return null;
  }

  // "Ahora no": solo esconde la tarjeta en memoria, sin guardar nada
  function ahoraNo() {
    if (!session) return;
    usuariosQuePospusieron.add(session.user.id);
    setEscondida(session.user.id);
  }

  return (
    <View style={styles.tarjeta}>
      <Text style={styles.titulo} accessibilityRole="header">
        Personaliza tu hogar
      </Text>
      <Text style={styles.texto}>
        Indica cuántas personas viven en casa y sus alergias.
        Las tuyas ya están guardadas.
      </Text>

      <TouchableOpacity
        style={styles.botonPrincipal}
        onPress={() => navigation.navigate("Personaliza")}
        accessibilityRole="button"
        accessibilityLabel="Empezar"
      >
        <Text style={styles.textoBotonPrincipal}>Empezar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.link}
        onPress={ahoraNo}
        accessibilityRole="button"
        accessibilityLabel="Ahora no"
      >
        <Text style={styles.textoLink}>Ahora no</Text>
      </TouchableOpacity>
      <Text style={styles.nota}>
        También puedes hacerlo después desde Cuenta → Mi hogar.
      </Text>
    </View>
  );
}

// (clase) Estilos al final del archivo. Para cambiar el diseño, solo se toca esto.
const styles = StyleSheet.create({
  tarjeta: {
    marginHorizontal: espaciado.md,
    marginTop: espaciado.md,
    marginBottom: espaciado.lg,
    padding: espaciado.md,
    backgroundColor: colors.surface,
    borderRadius: radios.lg,
    borderWidth: 1,
    borderColor: colors.borde,
  },
  titulo: {
    ...tipografia.subtitulo,
    fontSize: 18,
    marginBottom: espaciado.xs,
  },
  texto: {
    ...tipografia.cuerpo,
    fontSize: 15,
  },
  botonPrincipal: {
    minHeight: 56,
    backgroundColor: colors.botonPrincipal,
    borderRadius: radios.pill,
    paddingVertical: espaciado.sm,
    paddingHorizontal: espaciado.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: espaciado.md,
  },
  textoBotonPrincipal: {
    color: colors.textoSobreColor,
    fontSize: 16,
    fontWeight: "700",
  },
  link: {
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
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
