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


// Define qué parámetros recibe cada pantalla al navegar hacia ella.
export type RootStackParamList = {
  Home: undefined;
  Recetario: { busquedaInicial?: string } | undefined;
  RecetaDetalle: { recetaId: number };
  Alergias: undefined;
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
        <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
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
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
});