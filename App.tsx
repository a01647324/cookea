import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HomeScreen } from './screens/HomeScreen';
import { RecetarioScreen } from './screens/RecetarioScreen';
import { RecipeDetailScreen } from './screens/RecipeDetailScreen';

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from './lib/supabase';
import Alergias from './screens/alergias';

// AUTH: pantallas de Login/SignUp y el hook que dice si hay sesión
import { ActivityIndicator } from 'react-native';
import LoginScreen from './auth/LoginScreen';
import SignUpScreen from './auth/SignUpScreen';
import useSession from './auth/useSession';


// Define qué parámetros recibe cada pantalla al navegar hacia ella.
export type RootStackParamList = {
  Home: undefined;
  Recetario: { busquedaInicial?: string } | undefined;
  RecetaDetalle: { recetaId: number };
  Alergias: undefined;
  // AUTH: pantallas para cuando no hay sesión
  Login: undefined;
  SignUp: undefined;
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

      if (error) setEstado('Error: ' + error.message);
      else setEstado(`Conectado. Alérgenos en la base: ${data.length}`);
    }
    probarConexion();
  }, []);

  // AUTH: leemos la sesión. Mientras carga, mostramos un indicador para que
  // no aparezca el Login por un instante si el usuario ya tenía sesión.
  const { session, cargando } = useSession();
  if (cargando) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
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
            cada grupo (Home o Login) es la inicial. */}
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* AUTH: si hay sesión se muestran las pantallas de la app; si no,
              Login y SignUp. Al iniciar/cerrar sesión cambia solo. */}
          {session ? (
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Recetario" component={RecetarioScreen} />
              <Stack.Screen name="RecetaDetalle" component={RecipeDetailScreen} />
              {/* Alergias sí lleva header nativo simple, porque su propio diseño
                  no trae uno propio (usa un ActivityIndicator/ScrollView plano). */}
              <Stack.Screen
                name="Alergias"
                component={Alergias}
                options={{ headerShown: true, title: 'Alergias' }}
              />
            </>
          ) : (
            <>
              {/* AUTH: pantallas sin sesión */}
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen
                name="SignUp"
                component={SignUpScreen}
                options={{ headerShown: true, title: 'Registro' }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
});