import { AvisoHost } from './components/AvisoHost';
import { colors } from './theme/theme';
import ConfirmarCorreoScreen from './auth/ConfirmarCorreoScreen';

import { useFonts } from 'expo-font';
import { Lora_700Bold } from '@expo-google-fonts/lora';
import { Quicksand_500Medium, Quicksand_600SemiBold, Quicksand_700Bold } from '@expo-google-fonts/quicksand';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { NavigatorScreenParams } from '@react-navigation/native';
// BARRA: la Home, Recetario, RecetaDetalle, Alergias y TuSemana ahora viven
// dentro de la barra inferior (pestaña "Inicio"), en navegacion/BarraInferior.tsx
import BarraInferior, { BarraParamList } from './navegacion/BarraInferior';

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from './lib/supabase';

// AUTH: pantallas de Login/SignUp y el hook que dice si hay sesión
import { ActivityIndicator } from 'react-native';
import LoginScreen from './auth/LoginScreen';
import SignUpScreen from './auth/SignUpScreen';
import useSession from './auth/useSession';
// AUTH: recuperar clave y cambiar contraseña
import RecuperarClaveScreen from './auth/RecuperarClaveScreen';
import NuevaContrasenaScreen from './auth/NuevaContrasenaScreen';


import { log } from './lib/log';
// Define qué parámetros recibe cada pantalla al navegar hacia ella.
// BARRA: las pantallas con sesión están en los tipos InicioParamList y
// CuentaParamList de navegacion/BarraInferior.tsx
export type RootStackParamList = {
  // BARRA: "Tabs" es la barra inferior; reemplaza a "Home", que ahora es su
  // pestaña "Inicio"
  Tabs: NavigatorScreenParams<BarraParamList> | undefined;
  // AUTH: pantallas para cuando no hay sesión
  Login: undefined;
  SignUp: undefined;
  // AUTH: recuperar clave (sin sesión) y nueva contraseña (sesión de
  // recuperación). CambiarContrasena ahora está en la pestaña "Cuenta".
  RecuperarClave: undefined;
  NuevaContrasena: undefined;
  ConfirmarCorreo: { correo: string; recienEnviado?: boolean };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

//Puerba Alergias
/*
export default function App() {
  return <Alergias />;
}*/

// Prueba de conexión: lee la tabla "alergenos" (lectura pública, no pide sesión).
// Cuando el equipo agregue las pantallas, este App.tsx se reemplaza.
export default function App() {
  const [estado, setEstado] = useState('Conectando con Supabase…');

  useEffect(() => {
    async function probarConexion() {
      const { data, error } = await supabase.from('alergenos').select('nombre');

      if (error) log('[sesión]', error.message); 
      else setEstado(`Conectado. Alérgenos en la base: ${data.length}`);
    }
    probarConexion();
  }, []);


  const [fuentesListas] = useFonts({
    Lora_700Bold,
    Quicksand_500Medium,
    Quicksand_600SemiBold,
    Quicksand_700Bold,
  });

  // AUTH: leemos la sesión. Mientras carga, mostramos un indicador para que
  // no aparezca el Login por un instante si el usuario ya tenía sesión.
  // AUTH: recuperando dice si la sesión viene de "Recuperar clave"
  const {
    session,
    cargando,
    recuperando,
    terminarRecuperacion,
    olvidarRecuperacionGuardada,
    cancelarRecuperacion,
  } = useSession();
  if (cargando || !fuentesListas) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.encabezado} />
      </View>
    );
  }

  return (
    // SafeAreaProvider: le da a las pantallas la información de "notch"/barra
    // de estado del celular, para que WeekPlanSection, HomeScreen, etc. (que
    // usan <SafeAreaView>) sepan cuánto espacio dejar arriba.
    <SafeAreaProvider>
      {/* NavigationContainer: administra el estado de navegación de TODA la
          app. Sin este componente envolviendo todo, `useNavigation()` dentro
          de cualquier pantalla truena — este era el error más probable que
          tenías. */}
      <NavigationContainer>
        {/* Stack.Navigator: apila pantallas una sobre otra (con "atrás" para
            regresar). headerShown:false porque cada pantalla ya dibuja su
            propio encabezado (el logo COOKEA, flecha de regreso, etc). */}
        {/* AUTH: se quitó initialRouteName="Home"; la primera pantalla de
            cada grupo (la barra o Login) es la inicial. */}
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* AUTH: si hay sesión se muestran las pantallas de la app; si no,
              Login y SignUp. Al iniciar/cerrar sesión cambia solo. */}
          {/* AUTH: con sesión de recuperación solo se muestra la pantalla de
              nueva contraseña. Le pasamos las funciones de este useSession
              para que, al terminar o cancelar, App.tsx cambie de pantalla. */}
          {session && recuperando ? (
            <Stack.Screen name="NuevaContrasena">
              {() => (
                <NuevaContrasenaScreen
                  onGuardada={olvidarRecuperacionGuardada}
                  onTerminar={terminarRecuperacion}
                  onCancelar={cancelarRecuperacion}
                />
              )}
            </Stack.Screen>
          ) : session ? (
            // BARRA: con sesión, solo la barra inferior. Cada pestaña tiene
            // su propio Stack con sus pantallas (ver navegacion/BarraInferior.tsx),
            // así la barra se ve en todas.
            <Stack.Screen name="Tabs" component={BarraInferior} />
          ) : (
            <>
              {/* AUTH: pantallas sin sesión */}
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="SignUp" component={SignUpScreen} />
              <Stack.Screen name="ConfirmarCorreo" component={ConfirmarCorreoScreen} />
              {/* AUTH: recuperar clave, pasos 1 y 2 */}
              <Stack.Screen name="RecuperarClave" component={RecuperarClaveScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      <AvisoHost />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: colors.fondo },
});