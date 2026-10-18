import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
  } from 'react-native';
  
  import { Ionicons } from '@expo/vector-icons';
  
  import {
    colors,
    espaciado,
    radios,
  } from '../theme/theme';
  
  
  interface Props {
    autenticando: boolean;
    onDesbloquear: () => void;
  }
  
  
  export default function BloqueoScreen({
    autenticando,
    onDesbloquear,
  }: Props) {
    return (
      <View style={styles.pantalla}>
        <Ionicons
          name="lock-closed-outline"
          size={58}
          color={colors.oliva}
        />
  
        <Text style={styles.titulo}>
          Cookea está bloqueada
        </Text>
  
        <Text style={styles.descripcion}>
          Usa tu huella, Face ID o el método
          de seguridad de tu dispositivo para continuar.
        </Text>
  
        <Pressable
          disabled={autenticando}
          style={[
            styles.boton,
            autenticando &&
              styles.botonDesactivado,
          ]}
          onPress={onDesbloquear}
        >
          {autenticando ? (
            <ActivityIndicator
              color={colors.textoSobreColor}
            />
          ) : (
            <>
              <Ionicons
                name="finger-print"
                size={22}
                color={colors.textoSobreColor}
              />
  
              <Text style={styles.textoBoton}>
                Desbloquear
              </Text>
            </>
          )}
        </Pressable>
      </View>
    );
  }
  
  
  const styles = StyleSheet.create({
    pantalla: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: espaciado.xl,
      backgroundColor: colors.background,
    },
  
    titulo: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.textoPrincipal,
      marginTop: espaciado.md,
    },
  
    descripcion: {
      color: colors.textoSecundario,
      textAlign: 'center',
      marginTop: espaciado.sm,
      marginBottom: espaciado.lg,
      lineHeight: 20,
    },
  
    boton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.oliva,
      paddingHorizontal: espaciado.lg,
      paddingVertical: 13,
      borderRadius: radios.md,
    },
  
    botonDesactivado: {
      opacity: 0.5,
    },
  
    textoBoton: {
      color: colors.textoSobreColor,
      fontWeight: '700',
    },
  });