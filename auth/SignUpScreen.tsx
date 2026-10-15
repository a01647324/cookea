import { prepararCorreoAcceso } from './correoAcceso';
import styles from './estilosAcceso';
import useProteccionCapturas from '../perfil/useProteccionCapturas';
import { useFocusEffect } from '@react-navigation/native';
import AvisoPrivacidad from './AvisoPrivacidad';
import ListaAlergenos from '../perfil/ListaAlergenos';
import AvisoFormulario from '../perfil/AvisoFormulario';
import { validarAlias, validarNombre } from '../perfil/preferencias';
import CampoFormulario from './CampoFormulario';
import { AYUDA_CONTRASENA, esCorreoValido, normalizarCorreo, validarNuevaContrasena } from './validaciones';
import { fondo } from '../constants/fondos';
import Icono, { NombreIcono } from '../components/Icono';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Switch,
  ImageBackground,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { colors, espaciado, fuentes, radios, tamanos } from '../theme/theme';

// Llaves que utiliza Supabase para crear el perfil
const LLAVE_ALIAS = 'alias';
const LLAVE_NOMBRE = 'nombre';
const LLAVE_ACEPTO_PRIVACIDAD = 'acepto_privacidad';

function Seccion({ icono, fondo: fondoIcono, color, texto }: { icono: NombreIcono; fondo: string; color: string; texto: string }) {
  return (
    <View style={styles.seccion}>
      <View style={[styles.circuloSeccion, { backgroundColor: fondoIcono }]}>
        <Icono nombre={icono} size={20} color={color} />
      </View>
      <Text style={styles.textoSeccion} accessibilityRole="header">
        {texto}
      </Text>
    </View>
  );
}

export default function SignUpScreen({ navigation }: any) {
  useProteccionCapturas('registro');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [alias, setAlias] = useState('');
  const [nombre, setNombre] = useState('');

  const [intentado, setIntentado] = useState(false);
  const campoCorreo = useRef<TextInput>(null);
  const campoClave = useRef<TextInput>(null);
  const campoConfirmar = useRef<TextInput>(null);
  const campoAlias = useRef<TextInput>(null);
  const campoNombre = useRef<TextInput>(null);
  const problemaClave = validarNuevaContrasena(password, confirmarPassword);
  const errores = {
    correo: esCorreoValido(normalizarCorreo(email)) ? '' : 'Escribe un correo válido, como nombre@correo.com.',
    clave: problemaClave?.campo === 'nueva' ? problemaClave.mensaje : '',
    confirmar: problemaClave?.campo === 'confirmacion' ? problemaClave.mensaje : '',
    alias: validarAlias(alias) ?? '',
    nombre: validarNombre(nombre) ?? '',
  };

  const [mostrarAviso, setMostrarAviso] = useState(false);
  const [alergenos, setAlergenos] = useState<{ id: number; nombre: string }[]>([]);
  const [alergias, setAlergias] = useState(new Set<number>());
  const [eligioAlergias, setEligioAlergias] = useState(false);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(true);
  const [errorCatalogo, setErrorCatalogo] = useState(false);
  const cargarCatalogo = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('alergenos').select('id, nombre').order('id');
      setErrorCatalogo(false);
      if (error || !data?.length) {
        setErrorCatalogo(true);
        return;
      }
      setAlergenos(data);
    } catch {
      setErrorCatalogo(true);
    } finally {
      setCargandoCatalogo(false);
    }
  }, []);
  const inicio = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!inicio.current) {
        inicio.current = true;
        void cargarCatalogo();
      }
    }, [cargarCatalogo])
  );
  const [aceptoPrivacidad, setAceptoPrivacidad] = useState(false);

  const [cargando, setCargando] = useState(false);
  const bloqueo = useRef(false);
  const formulario = useRef<ScrollView>(null);
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    if (aviso && !aviso.startsWith('Revisa los campos')) formulario.current?.scrollTo({ y: 0, animated: true });
  }, [aviso]);

  const insets = useSafeAreaInsets();

  async function registrarse() {
    if (bloqueo.current) return;
    setAviso('');

    setIntentado(true);
    const campos = [
      [errores.correo, campoCorreo],
      [errores.clave, campoClave],
      [errores.confirmar, campoConfirmar],
      [errores.alias, campoAlias],
      [errores.nombre, campoNombre],
    ] as const;
    const primero = campos.find(([error]) => error);
    if (primero) {
      setAviso('Revisa los campos señalados. Tus datos se conservan.');
      primero[1].current?.focus();
      return;
    }
    if (errorCatalogo || cargandoCatalogo || !eligioAlergias) {
      setAviso('Indica tus alergias o elige No tengo alergias.');
      return;
    }
    if (!aceptoPrivacidad) {
      setAviso('Debes aceptar el aviso de privacidad para crear tu cuenta.');
      return;
    }

    bloqueo.current = true;
    setCargando(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizarCorreo(email),
        password: password,
        options: {
          data: {
            [LLAVE_ALIAS]: alias.trim(),
            [LLAVE_NOMBRE]: nombre.trim(),
            [LLAVE_ACEPTO_PRIVACIDAD]: aceptoPrivacidad,
            alergias: [...alergias],
          },
        },
      });

      if (error) {
        switch (error.code) {
          case 'weak_password':
            setAviso('La contraseña es muy débil. Usa una más segura.');
            break;
          case 'email_address_invalid':
            setAviso('Ese correo no es válido.');
            break;
          case 'user_already_exists':
            setAviso('No se pudo crear la cuenta con ese correo.');
            break;
          case 'over_email_send_rate_limit':
            setAviso('Se enviaron demasiados correos. Espera un momento e intenta de nuevo.');
            break;
          default:
            setAviso('No se pudo crear la cuenta. Intenta de nuevo.');
        }
        return;
      }

      // Sin sesión = falta confirmar el correo con el código que acaba de salir
      if (!data.session) {
        setPassword('');
        setConfirmarPassword('');
        navigation.replace('ConfirmarCorreo', { correo: normalizarCorreo(email), recienEnviado: true });
      }
    } catch {
      setAviso('Ocurrió un error inesperado. Revisa tu conexión.');
    } finally {
      bloqueo.current = false;
      setCargando(false);
    }
  }

  function irALogin() {
    prepararCorreoAcceso(normalizarCorreo(email));
    navigation.navigate('Login');
  }

  const ningunaElegida = eligioAlergias && alergias.size === 0;

  return (
    <ImageBackground source={fondo.acceso} style={styles.fondo} resizeMode="cover">
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={formulario}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + espaciado.sm, paddingBottom: insets.bottom + espaciado.lg, justifyContent: 'flex-start' },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={propios.barra}>
            <Pressable
              onPress={() => navigation.goBack()}
              disabled={cargando}
              style={propios.atras}
              accessibilityRole="button"
              accessibilityLabel="Regresar"
            >
              <Icono nombre="arrow-left-linear" size={22} color={colors.texto} />
            </Pressable>
          </View>

          <View style={[styles.card, { marginTop: espaciado.lg }]}>
            <Text style={styles.titulo} accessibilityRole="header">
              Crear cuenta
            </Text>
            <Text style={[styles.descripcion, { marginBottom: 0 }]}>
              Todos los campos son necesarios. Tus alergias nos ayudan a cuidar tus recomendaciones.
            </Text>

            {aviso !== '' && (
              <View style={{ marginTop: espaciado.md }}>
                <AvisoFormulario texto={aviso} />
              </View>
            )}

            <Seccion icono="key-linear" fondo={colors.serenoSuave} color={colors.serenoIntenso} texto="Datos de acceso" />
            <CampoFormulario
              ref={campoCorreo}
              error={intentado ? errores.correo : undefined}
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
              error={intentado ? errores.clave : undefined}
              autoComplete="new-password"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => campoConfirmar.current?.focus()}
              etiqueta="Contraseña"
              ayuda={AYUDA_CONTRASENA}
              editable={!cargando}
              esContrasena
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChangeText={(text) => setPassword(text)}
            />
            <CampoFormulario
              ref={campoConfirmar}
              error={intentado ? errores.confirmar : undefined}
              autoComplete="new-password"
              etiqueta="Confirmar contraseña"
              editable={!cargando}
              esContrasena
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Escríbela otra vez"
              value={confirmarPassword}
              onChangeText={(text) => setConfirmarPassword(text)}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => campoAlias.current?.focus()}
            />

            <Seccion icono="user-circle-linear" fondo={colors.calidoSuave} color={colors.calidoIntenso} texto="Tu perfil" />
            <CampoFormulario
              ref={campoAlias}
              error={intentado ? errores.alias : undefined}
              autoCorrect={false}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => campoNombre.current?.focus()}
              etiqueta="Alias"
              ayuda="Lo verán otras personas en Comunidad."
              editable={!cargando}
              placeholder="Ej. cocinera_ana"
              value={alias}
              onChangeText={(text) => setAlias(text)}
            />
            <CampoFormulario
              ref={campoNombre}
              error={intentado ? errores.nombre : undefined}
              autoComplete="name"
              autoCapitalize="words"
              returnKeyType="done"
              etiqueta="Nombre"
              ayuda="Es privado: solo tú lo ves."
              editable={!cargando}
              placeholder="Tu nombre"
              value={nombre}
              onChangeText={(text) => setNombre(text)}
            />

            <Seccion icono="health-linear" fondo={colors.peligroSuave} color={colors.peligro} texto="Tus alergias" />
            <Text style={styles.descripcion}>Selecciona las que tengas o elige «No tengo alergias».</Text>
            {cargandoCatalogo ? (
              <ActivityIndicator color={colors.encabezado} style={styles.loader} />
            ) : errorCatalogo ? (
              <Pressable
                onPress={() => {
                  setCargandoCatalogo(true);
                  void cargarCatalogo();
                }}
                style={propios.reintentar}
                accessibilityRole="button"
              >
                <Icono nombre="refresh-linear" size={18} color={colors.peligro} />
                <Text style={propios.textoReintentar}>No se pudo cargar la lista. Reintentar</Text>
              </Pressable>
            ) : (
              <>
                <Pressable
                  disabled={cargando}
                  onPress={() => {
                    setAlergias(new Set());
                    setEligioAlergias(true);
                  }}
                  style={[propios.ninguna, ningunaElegida && propios.ningunaElegida]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: ningunaElegida }}
                >
                  <Icono
                    nombre="check-circle-linear"
                    size={22}
                    color={ningunaElegida ? colors.sobreEncabezado : colors.acentoOscuro}
                  />
                  <Text style={[propios.textoNinguna, ningunaElegida && { color: colors.sobreEncabezado }]}>
                    No tengo alergias
                  </Text>
                </Pressable>
                <ListaAlergenos
                  alergenos={alergenos}
                  seleccionados={alergias}
                  deshabilitado={cargando}
                  onAlternar={(id) => {
                    setEligioAlergias(true);
                    setAlergias((prev) => {
                      const next = new Set(prev);
                      if (next.has(id)) next.delete(id);
                      else next.add(id);
                      return next;
                    });
                  }}
                />
              </>
            )}

            <Seccion icono="shield-check-linear" fondo={colors.acentoSuave} color={colors.acentoIntenso} texto="Privacidad" />
            <Pressable onPress={() => setMostrarAviso(true)} style={propios.leer} accessibilityRole="button">
              <Icono nombre="document-text-linear" size={20} color={colors.acentoOscuro} />
              <Text style={propios.textoLeer}>Leer información de privacidad</Text>
              <Icono nombre="alt-arrow-right-linear" size={18} color={colors.acentoOscuro} />
            </Pressable>
            <View style={styles.filaPrivacidad}>
              <Switch
                disabled={cargando}
                accessibilityLabel="Acepto el tratamiento descrito en la información de privacidad"
                value={aceptoPrivacidad}
                onValueChange={(valor) => setAceptoPrivacidad(valor)}
                trackColor={{ true: colors.encabezado, false: colors.borde }}
                thumbColor={colors.superficie}
              />
              <Text style={styles.textoPrivacidad}>He leído y acepto el tratamiento descrito en la información de privacidad.</Text>
            </View>

            <Pressable
              disabled={cargando}
              accessibilityRole="button"
              accessibilityState={{ disabled: cargando, busy: cargando }}
              accessibilityLabel="Crear cuenta"
              style={({ pressed }) => [styles.botonPrincipal, (pressed || cargando) && styles.botonOcupado]}
              onPress={registrarse}
            >
              {cargando ? (
                <ActivityIndicator color={colors.sobreEncabezado} />
              ) : (
                <Icono nombre="user-plus-linear" size={20} color={colors.sobreEncabezado} />
              )}
              <Text style={styles.textoBotonPrincipal}>{cargando ? 'Creando tu cuenta…' : 'Crear cuenta'}</Text>
            </Pressable>

            <Pressable
              style={styles.linkRegistro}
              disabled={cargando}
              accessibilityRole="button"
              accessibilityLabel="Ya tengo cuenta. Iniciar sesión"
              onPress={irALogin}
            >
              <Text style={styles.textoLinkRegistro}>
                ¿Ya tienes cuenta? <Text style={styles.textoLinkRegistroBold}>Iniciar sesión</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AvisoPrivacidad visible={mostrarAviso} onCerrar={() => setMostrarAviso(false)} />
    </ImageBackground>
  );
}

const propios = StyleSheet.create({
  barra: {
    width: '100%',
    maxWidth: 520,
  },
  atras: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reintentar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
  },
  textoReintentar: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.cuerpo,
    color: colors.peligro,
  },
  ninguna: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 50,
    borderRadius: radios.pill,
    backgroundColor: colors.acentoSuave,
    marginBottom: espaciado.sm,
  },
  ningunaElegida: {
    backgroundColor: colors.encabezado,
  },
  textoNinguna: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.cuerpo,
    color: colors.acentoOscuro,
  },
  leer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
  },
  textoLeer: {
    flex: 1,
    fontFamily: fuentes.negrita,
    fontSize: tamanos.cuerpo,
    color: colors.acentoOscuro,
  },
});
