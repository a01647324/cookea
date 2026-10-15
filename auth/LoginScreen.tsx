import { consumirCorreoAcceso } from './correoAcceso';
import { useFocusEffect } from '@react-navigation/native';
import styles from './estilosAcceso';
import { supabase } from '../lib/supabase';
import CampoFormulario from './CampoFormulario';
import AvisoFormulario from '../perfil/AvisoFormulario';
import { esCorreoValido, normalizarCorreo } from './validaciones';
import { fondo } from '../constants/fondos';
import { useCallback, useRef, useState } from 'react';
import { View, Text, Pressable, ImageBackground, Image, KeyboardAvoidingView, Platform, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/theme';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const insets = useSafeAreaInsets();

  const [cargando, setCargando] = useState(false);
  const bloqueo = useRef(false);
  const campoCorreo = useRef<TextInput>(null);
  const campoClave = useRef<TextInput>(null);
  const [intentado, setIntentado] = useState(false);
  const errorCorreo = intentado && !esCorreoValido(normalizarCorreo(email)) ? 'Escribe un correo válido, como nombre@correo.com.' : '';
  const errorClave = intentado && password === '' ? 'Escribe tu contraseña.' : '';
  const [aviso, setAviso] = useState('');
  const [sinConfirmar, setSinConfirmar] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const correo = consumirCorreoAcceso();
      if (correo) {
        setEmail(correo);
        setPassword('');
        setAviso('');
      }
    }, [])
  );

  async function iniciarSesion() {
    if (bloqueo.current) return;
    setAviso('');
    setSinConfirmar(false);
    setIntentado(true);
    if (email.trim() === '' || password === '') {
      (!email.trim() ? campoCorreo : campoClave).current?.focus();
      return;
    }
    if (!esCorreoValido(normalizarCorreo(email))) {
      campoCorreo.current?.focus();
      return;
    }

    bloqueo.current = true;
    setCargando(true);

    try {
      // Supabase no lanza el error: siempre regresa { data, error }
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizarCorreo(email),
        password: password,
      });

      if (error) {
        switch (error.code) {
          case 'email_not_confirmed':
            setAviso('Tu cuenta aún no está confirmada. Escribe el código que te enviamos por correo.');
            setSinConfirmar(true);
            break;
          case 'invalid_credentials':
            // Mensaje genérico a propósito, para no revelar qué correos están registrados
            setAviso('Correo o contraseña incorrectos.');
            break;
          case 'over_request_rate_limit':
            setAviso('Demasiados intentos. Espera un momento e intenta de nuevo.');
            break;
          default:
            setAviso('No se pudo iniciar sesión. Intenta de nuevo.');
        }
        return;
      }
      // Si salió bien no navegamos: useSession detecta la sesión y App.tsx cambia solo
    } catch {
      setAviso('Ocurrió un error inesperado. Revisa tu conexión.');
    } finally {
      bloqueo.current = false;
      setCargando(false);
    }
  }

  return (
    <ImageBackground source={fondo.acceso} style={styles.fondo} resizeMode="cover">
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Image source={require('../assets/images/cookea-logo.png')} resizeMode="contain" style={styles.logo} />
          <Text style={styles.fraseBienvenida}>Cocina con lo que tienes en casa</Text>

          <View style={styles.card}>
            <Text style={styles.titulo} accessibilityRole="header">
              Iniciar sesión
            </Text>
            <Text style={styles.descripcion}>Entra con tu correo y contraseña.</Text>

            <AvisoFormulario texto={aviso} />
            {sinConfirmar && (
              <Pressable
                onPress={() => navigation.navigate('ConfirmarCorreo', { correo: normalizarCorreo(email) })}
                style={[styles.linkRegistro, { marginTop: -8, marginBottom: 6 }]}
                accessibilityRole="button"
              >
                <Text style={[styles.textoLinkRegistro, styles.textoLinkRegistroBold]}>Escribir mi código</Text>
              </Pressable>
            )}

            <CampoFormulario
              ref={campoCorreo}
              error={errorCorreo}
              autoComplete="email"
              autoCorrect={false}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => campoClave.current?.focus()}
              etiqueta="Correo"
              editable={!cargando}
              placeholder="nombre@correo.com"
              value={email}
              onChangeText={(text) => setEmail(text)}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <CampoFormulario
              ref={campoClave}
              error={errorClave}
              autoComplete="current-password"
              etiqueta="Contraseña"
              editable={!cargando}
              esContrasena
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Tu contraseña"
              value={password}
              onChangeText={(text) => setPassword(text)}
              returnKeyType="done"
              onSubmitEditing={iniciarSesion}
            />

            <Pressable
              onPress={() => navigation.navigate('RecuperarClave')}
              disabled={cargando}
              style={[styles.linkRegistro, { alignItems: 'flex-end', minHeight: 36, paddingVertical: 0, marginTop: -6 }]}
              accessibilityRole="button"
              accessibilityLabel="¿Olvidaste tu contraseña?"
            >
              <Text style={[styles.textoLinkRegistro, styles.textoLinkRegistroBold]}>¿Olvidaste tu contraseña?</Text>
            </Pressable>

            <Pressable
              disabled={cargando}
              accessibilityRole="button"
              accessibilityState={{ disabled: cargando, busy: cargando }}
              accessibilityLabel="Iniciar sesión"
              style={({ pressed }) => [styles.botonPrincipal, (pressed || cargando) && styles.botonOcupado]}
              onPress={iniciarSesion}
            >
              {cargando && <ActivityIndicator color={colors.sobreEncabezado} />}
              <Text style={styles.textoBotonPrincipal}>{cargando ? 'Entrando…' : 'Iniciar sesión'}</Text>
            </Pressable>

            <View style={[styles.separador, { marginTop: 18 }]} />

            <Pressable onPress={() => navigation.navigate('SignUp')} disabled={cargando} style={styles.linkRegistro} accessibilityRole="button">
              <Text style={styles.textoLinkRegistro}>
                ¿No tienes cuenta? <Text style={styles.textoLinkRegistroBold}>Crear cuenta</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}
