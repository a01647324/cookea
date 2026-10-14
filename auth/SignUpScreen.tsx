import { prepararCorreoAcceso } from './correoAcceso';
import styles from './estilosAcceso';
import useProteccionCapturas from "../perfil/useProteccionCapturas";
import { useFocusEffect } from "@react-navigation/native";
import AvisoPrivacidad from "./AvisoPrivacidad";
import ListaAlergenos from "../perfil/ListaAlergenos";
import { validarAlias, validarNombre } from "../perfil/preferencias";
import CampoFormulario from "./CampoFormulario";
import { AYUDA_CONTRASENA, esCorreoValido, normalizarCorreo, validarNuevaContrasena } from "./validaciones";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  ScrollView,
  View,
  Text,
  Switch,
  ImageBackground,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { supabase } from "../lib/supabase";
import { colors, tipografia } from "../theme/theme";

// Dimensiones de pantalla para hacer el logo responsivo

// Llaves que utiliza Supabase para crear el perfil
const LLAVE_ALIAS = "alias";
const LLAVE_NOMBRE = "nombre";
const LLAVE_ACEPTO_PRIVACIDAD = "acepto_privacidad";

// Componente principal de registro
export default function SignUpScreen({ navigation }: any) {
  useProteccionCapturas("registro");

  // Estados del formulario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [alias, setAlias] = useState("");
  const [nombre, setNombre] = useState("");

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
    alias: validarAlias(alias) ?? '', nombre: validarNombre(nombre) ?? '',
  };

  const [mostrarAviso, setMostrarAviso] = useState(false);
  const [alergenos, setAlergenos] = useState<{ id: number; nombre: string }[]>([]);
  const [alergias, setAlergias] = useState(new Set<number>());
  const [eligioAlergias, setEligioAlergias] = useState(false);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(true);
  const [errorCatalogo, setErrorCatalogo] = useState(false);
  const cargarCatalogo = useCallback(async () => {
    try { const { data, error } = await supabase.from('alergenos').select('id, nombre').order('id');
      setErrorCatalogo(false);
      if (error || !data?.length) { setErrorCatalogo(true); return; }
      setAlergenos(data);
    } catch { setErrorCatalogo(true); } finally { setCargandoCatalogo(false); }
}, []);
  const inicio = useRef(false);
  useFocusEffect(useCallback(() => { if (!inicio.current) { inicio.current = true; void cargarCatalogo(); } }, [cargarCatalogo]));
  // Estado del aviso de privacidad
  const [aceptoPrivacidad, setAceptoPrivacidad] = useState(false);

  // Estado de carga
  const [cargando, setCargando] = useState(false);
  const bloqueo = useRef(false);
  const formulario = useRef<ScrollView>(null);
  const [registroEnviado, setRegistroEnviado] = useState(false);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    if (aviso && !aviso.startsWith("Revisa los campos")) formulario.current?.scrollTo({ y: 0, animated: true });
  }, [aviso]);

  // Área segura del dispositivo
  const insets = useSafeAreaInsets();

  // Función para registrar al usuario en Supabase
  async function registrarse() {
    if (bloqueo.current || registroEnviado) return;
    setAviso("");

    setIntentado(true);
    const campos = [
      [errores.correo, campoCorreo], [errores.clave, campoClave],
      [errores.confirmar, campoConfirmar], [errores.alias, campoAlias], [errores.nombre, campoNombre],
    ] as const;
    const primero = campos.find(([error]) => error);
    if (primero) { setAviso('Revisa los campos señalados. Tus datos se conservan.'); primero[1].current?.focus(); return; }
    if (errorCatalogo || cargandoCatalogo || !eligioAlergias) { setAviso("Indica tus alergias o elige No tengo alergias."); return; }

    // Validar aceptación del aviso de privacidad
    if (!aceptoPrivacidad) {
      setAviso("Debes aceptar el aviso de privacidad para crear tu cuenta");
      return;
    }

    bloqueo.current = true;
    setCargando(true);

    try {

      // Registrar usuario mediante Supabase Auth
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

      // Manejo de errores de Supabase
      if (error) {

        switch (error.code) {

          case "weak_password":
            setAviso("La contraseña es muy débil. Usa una más segura.");
            break;

          case "email_address_invalid":
            setAviso("Ese correo no es válido");
            break;

          case "user_already_exists":
            setAviso("No se pudo crear la cuenta con ese correo");
            break;

          case "over_email_send_rate_limit":
            setAviso(
              "Se enviaron demasiados correos. Espera un momento e intenta de nuevo."
            );
            break;

          default:
            setAviso("No se pudo crear la cuenta. Intenta de nuevo.");

        }

        return;
      }

      // Registro exitoso
      if (!data.session) {
        prepararCorreoAcceso(normalizarCorreo(email));
        setPassword(''); setConfirmarPassword(''); setRegistroEnviado(true);
      }

    } catch {

      setAviso("Ocurrió un error inesperado. Revisa tu conexión.");

    } finally {

      bloqueo.current = false;
      setCargando(false);

    }

  }

  if (registroEnviado) return <ImageBackground source={require('../assets/images/cookea-background-signup.png')} style={styles.fondo}>
    <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.card}>
        <Text style={styles.titulo} accessibilityRole="header">Revisa tu correo</Text>
        <Text style={styles.descripcion}>Si el registro procede, recibirás un correo en {normalizarCorreo(email)}. Abre el mensaje y confirma tu cuenta.</Text>
        <Text style={styles.descripcion}>Después, vuelve a Cookea e inicia sesión. Tu correo ya estará escrito.</Text>
        <TouchableOpacity style={styles.botonPrincipal} accessibilityRole="button" accessibilityLabel="Ir a iniciar sesión" onPress={() => { prepararCorreoAcceso(normalizarCorreo(email)); navigation.navigate('Login'); }}>
          <Text style={styles.textoBotonPrincipal}>Ir a iniciar sesión</Text>
        </TouchableOpacity>
        <Text style={[styles.descripcion, { marginTop: 20, marginBottom: 0 }]}>Si no encuentras el mensaje, revisa la carpeta de correo no deseado.</Text>
      </View>
    </ScrollView>
  </ImageBackground>;

  // INTERFAZ DE REGISTRO

  return (

    <ImageBackground

      source={require("../assets/images/cookea-background-signup.png")}

      style={styles.fondo}

      resizeMode="cover"

    >

      <KeyboardAvoidingView

        style={styles.flex}

        behavior={Platform.OS === "ios" ? "padding" : undefined}

      >

        <ScrollView ref={formulario}

          contentContainerStyle={[

            styles.scrollContent,

            {
              paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12, justifyContent: "flex-start",
            },

          ]}

          keyboardShouldPersistTaps="handled"

          showsVerticalScrollIndicator={false}

        >

          {/* LOGO COOKEA */}

          <Image

            source={require("../assets/images/cookea-logo.png")}

            style={[styles.logo, { width: 180, height: 46, marginBottom: 12 }]}

            resizeMode="contain"

          />



          <View style={styles.card}>
            {aviso !== "" && <Text style={styles.aviso} accessibilityLiveRegion="polite">{aviso}</Text>}

            {/* TÍTULO */}

            <Text style={styles.titulo} accessibilityRole="header">

              Crear cuenta

            </Text>

            <Text style={styles.descripcion}>Todos los campos son necesarios. Tus alergias nos ayudan a cuidar tus recomendaciones.</Text>
            <Text style={styles.seccion} accessibilityRole="header">Datos de acceso</Text>
            {/* CORREO */}

            <CampoFormulario ref={campoCorreo} error={intentado ? errores.correo : undefined} autoComplete="email" autoCorrect={false} returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => campoClave.current?.focus()} etiqueta="Correo" editable={!cargando} 

              placeholder="Correo"

              placeholderTextColor={colors.textoSecundario}

              value={email}

              onChangeText={(text) => setEmail(text)}

              autoCapitalize="none"

              keyboardType="email-address"

            />

            {/* CONTRASEÑA */}

            <CampoFormulario ref={campoClave} error={intentado ? errores.clave : undefined} autoComplete="new-password" returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => campoConfirmar.current?.focus()} etiqueta="Contraseña" ayuda={AYUDA_CONTRASENA} editable={!cargando} esContrasena autoCapitalize="none" autoCorrect={false} 

              placeholder="Contraseña (mínimo 8 caracteres)"

              placeholderTextColor={colors.textoSecundario}

              value={password}

              onChangeText={(text) => setPassword(text)}

            />

            {/* CONFIRMAR CONTRASEÑA */}

            <CampoFormulario ref={campoConfirmar} error={intentado ? errores.confirmar : undefined} autoComplete="new-password" etiqueta="Confirmar contraseña" editable={!cargando} esContrasena autoCapitalize="none" autoCorrect={false} 

              placeholder="Confirmar contraseña"

              placeholderTextColor={colors.textoSecundario}

              value={confirmarPassword}

              onChangeText={(text) => setConfirmarPassword(text)}
              returnKeyType="next" submitBehavior="submit"
              onSubmitEditing={() => campoAlias.current?.focus()}

            />

            <Text style={styles.seccion} accessibilityRole="header">Tu perfil</Text>
            {/* ALIAS */}

            <CampoFormulario ref={campoAlias} error={intentado ? errores.alias : undefined} autoCorrect={false} returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => campoNombre.current?.focus()} etiqueta="Alias (lo verán otros usuarios)" editable={!cargando} 

              placeholder="Alias (lo verán otros usuarios)"

              placeholderTextColor={colors.textoSecundario}

              value={alias}

              onChangeText={(text) => setAlias(text)}

            />

            {/* NOMBRE */}

            <CampoFormulario ref={campoNombre} error={intentado ? errores.nombre : undefined} autoComplete="name" autoCapitalize="words" returnKeyType="done" etiqueta="Nombre (privado)" editable={!cargando} 

              placeholder="Nombre (privado)"

              placeholderTextColor={colors.textoSecundario}

              value={nombre}

              onChangeText={(text) => setNombre(text)}

            />

            <Text style={styles.seccion} accessibilityRole="header">Tus alergias</Text>
            <Text style={styles.descripcion}>Selecciona las que tengas o elige «No tengo alergias».</Text>
            {cargandoCatalogo ? <Text style={tipografia.cuerpo}>Cargando alérgenos…</Text> : errorCatalogo ? <TouchableOpacity onPress={() => { setCargandoCatalogo(true); void cargarCatalogo(); }} style={{ minHeight: 56, justifyContent: 'center' }} accessibilityRole="button"><Text style={tipografia.cuerpo}>No se pudo cargar el catálogo. Reintentar</Text></TouchableOpacity> : <>
              <ListaAlergenos alergenos={alergenos} seleccionados={alergias} deshabilitado={cargando} onAlternar={id => { setEligioAlergias(true); setAlergias(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; }); }} />
              <TouchableOpacity disabled={cargando} onPress={() => { setAlergias(new Set()); setEligioAlergias(true); }} style={{ minHeight: 56, justifyContent: 'center' }} accessibilityRole="button"><Text style={tipografia.cuerpo}>{eligioAlergias && !alergias.size ? '✓ No tengo alergias' : 'No tengo alergias'}</Text></TouchableOpacity>
            </>}
            <TouchableOpacity onPress={() => setMostrarAviso(true)} style={{ minHeight: 56, justifyContent: 'center' }} accessibilityRole="button"><Text style={tipografia.subtitulo}>Leer información de privacidad</Text></TouchableOpacity>
            {/* AVISO DE PRIVACIDAD */}

            <View style={styles.filaPrivacidad}>

            <Switch disabled={cargando} accessibilityLabel="Acepto el tratamiento descrito en la información de privacidad"
              value={aceptoPrivacidad}
              onValueChange={(valor) => setAceptoPrivacidad(valor)}
              trackColor={{
                true: colors.acentoOscuro,
                false: colors.borde,
              }}
              thumbColor={colors.surface}
            />

              <Text style={styles.textoPrivacidad}>

                He leído y acepto el tratamiento descrito en la información de privacidad

              </Text>

            </View>

            {/* BOTÓN REGISTRARME */}

            {(
              <TouchableOpacity disabled={cargando} accessibilityRole="button" accessibilityState={{ disabled: cargando, busy: cargando }} accessibilityLabel="Crear cuenta"
                style={styles.botonPrincipal}

                onPress={registrarse}

                activeOpacity={0.85}

              >

                <Text style={styles.textoBotonPrincipal}>{cargando ? 'Procesando…' : 'Crear cuenta'}</Text>

              </TouchableOpacity>

            )}

            <TouchableOpacity style={styles.linkRegistro} disabled={cargando} accessibilityRole="button" accessibilityLabel="Ya tengo cuenta. Iniciar sesión" onPress={() => { prepararCorreoAcceso(normalizarCorreo(email)); navigation.navigate('Login'); }}>
              <Text style={styles.textoLinkRegistro}>Ya tengo cuenta · Iniciar sesión</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>

      </KeyboardAvoidingView>

      <AvisoPrivacidad visible={mostrarAviso} onCerrar={() => setMostrarAviso(false)} />
    </ImageBackground>

  );

}

// ESTILOS DE LA PANTALLA

