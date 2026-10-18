import 'react-native-url-polyfill/auto';

import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';


// Las credenciales vienen del archivo .env.
// Aquí solo debe ir la llave pública de Supabase.
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL!;

const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_KEY!;


// STORAGE-1:
// En Android/iOS guardamos la sesión en SecureStore.
// En web dejamos AsyncStorage como respaldo.
const secureStorage = {
  async getItem(
    key: string
  ): Promise<string | null> {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(key);
    }

    return SecureStore.getItemAsync(key);
  },

  async setItem(
    key: string,
    value: string
  ): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(
        key,
        value
      );

      return;
    }

    await SecureStore.setItemAsync(
      key,
      value
    );
  },

  async removeItem(
    key: string
  ): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(
        key
      );

      return;
    }

    await SecureStore.deleteItemAsync(
      key
    );
  },
};


export const supabase =
  createClient(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        storage: secureStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    }
  );


// Renovar el token solo mientras
// la app está activa.
AppState.addEventListener(
  'change',
  (estado) => {
    if (estado === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  }
);