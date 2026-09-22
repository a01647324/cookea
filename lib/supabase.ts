import 'react-native-url-polyfill/auto';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Las credenciales vienen del archivo .env (que está en .gitignore)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,    // dónde se guarda la sesión en el celular
    autoRefreshToken: true,   // renueva el token antes de que caduque
    persistSession: true,     // la sesión sigue al cerrar y abrir la app
    detectSessionInUrl: false // eso es para web; en celular no aplica
  },
});

// Renovar el token solo mientras la app está abierta en pantalla
AppState.addEventListener('change', (estado) => {
  if (estado === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});