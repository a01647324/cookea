import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from './lib/supabase';
import Alergias from './screens/alergias';

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
    <View style={styles.container}>
      <Text>{estado}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
});