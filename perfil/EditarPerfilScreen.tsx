import useSession from '../auth/useSession';
import Encabezado from './Encabezado';
import AvisoFormulario from './AvisoFormulario';
import PantallaListo from './PantallaListo';
import { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePreventRemove } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useUserProfile } from '../hooks/useUserProfile';
import CampoFormulario from '../auth/CampoFormulario';
import { VistaCargando } from '../components/StateViews';
import { ConfirmarHoja } from '../components/ConfirmarHoja';
import { colors, espaciado, fuentes, radios, tamanos } from '../theme/theme';
import { ALIAS_MIN, ALIAS_MAX, NOMBRE_MIN, NOMBRE_MAX, validarAlias, validarNombre } from './preferencias';
import { MENSAJE_ERROR_CARGA, MENSAJE_ERROR_GUARDAR, MENSAJE_CERO_FILAS, MENSAJE_SIN_CONEXION } from './usePreferencias';

// EditarPerfilScreen: cambia el alias y el nombre.
export default function EditarPerfilScreen({ navigation }: any) {
  const { session } = useSession();
  const bloqueo = useRef(false);
  const { perfil, error: errorPerfil, recargar } = useUserProfile();

  const [alias, setAlias] = useState('');
  const [nombre, setNombre] = useState('');
  // Lo que hay en la base, para saber si hubo cambios
  const [aliasGuardado, setAliasGuardado] = useState('');
  const [nombreGuardado, setNombreGuardado] = useState('');

  const [errorAlias, setErrorAlias] = useState('');
  const [errorNombre, setErrorNombre] = useState('');
  const [aviso, setAviso] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [listo, setListo] = useState(false);
  const [salidaPendiente, setSalidaPendiente] = useState<any>(null);

  const campoNombre = useRef<TextInput>(null);

  // Ajustar al cambiar de cuenta, sin sobrescribir el borrador en recargas.
  const [cuentaInicializada, setCuentaInicializada] = useState<string | null>(null);
  if (perfil !== null && cuentaInicializada !== perfil.id) {
    setCuentaInicializada(perfil.id);
    setAlias(perfil.alias);
    setNombre(perfil.nombre);
    setAliasGuardado(perfil.alias);
    setNombreGuardado(perfil.nombre);
    setListo(false);
    setAviso('');
    setErrorAlias('');
    setErrorNombre('');
  }

  const hayCambios = perfil !== null && (alias.trim() !== aliasGuardado || nombre.trim() !== nombreGuardado);

  // Detiene la salida mientras haya cambios sin guardar y pregunta antes de salir
  usePreventRemove(hayCambios || guardando, ({ data }) => {
    if (guardando) return;
    setSalidaPendiente(data.action);
  });

  async function guardar() {
    if (bloqueo.current || guardando || !hayCambios || perfil === null) return;

    const aliasLimpio = alias.trim();
    const nombreLimpio = nombre.trim();
    const problemaAlias = validarAlias(aliasLimpio);
    const problemaNombre = validarNombre(nombreLimpio);
    setErrorAlias(problemaAlias ?? '');
    setErrorNombre(problemaNombre ?? '');
    setAviso('');
    if (problemaAlias !== null || problemaNombre !== null) return;

    // Solo mandamos los campos que cambiaron
    const cambios: { alias?: string; nombre?: string } = {};
    if (aliasLimpio !== aliasGuardado) cambios.alias = aliasLimpio;
    if (nombreLimpio !== nombreGuardado) cambios.nombre = nombreLimpio;

    bloqueo.current = true;
    setGuardando(true);

    try {
      // .select() regresa las filas actualizadas: si son cero, RLS no encontró la fila
      const { data: sesionActual } = await supabase.auth.getSession();
      if (sesionActual.session?.user.id !== perfil.id) {
        setAviso('La sesión cambió. Vuelve a abrir tu perfil.');
        return;
      }
      const { data, error, status } = await supabase.from('perfiles').update(cambios).eq('id', perfil.id).select('id');

      if (error) {
        // status 0: no hubo respuesta del servidor (sin internet)
        setAviso(status === 0 ? MENSAJE_SIN_CONEXION : MENSAJE_ERROR_GUARDAR);
        return;
      }
      if (data === null || data.length === 0) {
        setAviso(MENSAJE_CERO_FILAS);
        return;
      }

      setAlias(aliasLimpio);
      setNombre(nombreLimpio);
      setAliasGuardado(aliasLimpio);
      setNombreGuardado(nombreLimpio);
      setListo(true);
    } catch {
      setAviso(MENSAJE_SIN_CONEXION);
    } finally {
      bloqueo.current = false;
      setGuardando(false);
    }
  }

  const encabezado = <Encabezado titulo="Editar perfil" onVolver={() => navigation.goBack()} deshabilitado={guardando} />;

  if (listo) {
    return (
      <SafeAreaView style={styles.pantalla} edges={['top']}>
        {encabezado}
        <PantallaListo
          titulo="Tus datos se guardaron"
          texto="Los demás verán tu alias nuevo en tus publicaciones."
          onVolver={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  if (perfil === null) {
    return (
      <SafeAreaView style={styles.pantalla} edges={['top']}>
        {encabezado}
        {errorPerfil === null ? (
          <VistaCargando mensaje="Cargando tus datos…" />
        ) : (
          <View style={styles.contenido}>
            <AvisoFormulario texto={MENSAJE_ERROR_CARGA} />
            <Pressable style={styles.botonPrincipal} onPress={recargar} accessibilityRole="button">
              <Text style={styles.textoBotonPrincipal}>Reintentar</Text>
            </Pressable>
            <Pressable style={styles.botonSecundario} onPress={() => navigation.goBack()} accessibilityRole="button">
              <Text style={styles.textoBotonSecundario}>Volver</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    );
  }

  const puedeGuardar = hayCambios && !guardando;
  const inicial = Array.from(alias.trim() || perfil.alias)[0]?.toUpperCase() || '?';

  return (
    <SafeAreaView style={styles.pantalla} edges={['top']}>
      {encabezado}
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
          <View style={styles.avatar} accessible accessibilityLabel={`Inicial de ${alias || perfil.alias}`}>
            <Text style={styles.inicial}>{inicial}</Text>
          </View>

          <AvisoFormulario texto={aviso} />

          <View style={styles.tarjeta}>
            <CampoFormulario
              etiqueta="Correo"
              value={session?.user.email ?? ''}
              editable={false}
              ayuda="El cambio de correo todavía no está disponible."
            />
            <CampoFormulario
              etiqueta="Alias"
              ayuda={`De ${ALIAS_MIN} a ${ALIAS_MAX} caracteres. Es el nombre que verán los demás.`}
              value={alias}
              onChangeText={(texto) => {
                setAlias(texto);
                setErrorAlias('');
              }}
              error={errorAlias}
              maxLength={ALIAS_MAX}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => campoNombre.current?.focus()}
              submitBehavior="submit"
              editable={!guardando}
            />
            <CampoFormulario
              ref={campoNombre}
              etiqueta="Nombre"
              ayuda={`De ${NOMBRE_MIN} a ${NOMBRE_MAX} caracteres. Solo tú puedes verlo.`}
              value={nombre}
              onChangeText={(texto) => {
                setNombre(texto);
                setErrorNombre('');
              }}
              error={errorNombre}
              maxLength={NOMBRE_MAX}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="done"
              onSubmitEditing={guardar}
              editable={!guardando}
            />
          </View>
        </ScrollView>

        <View style={styles.acciones}>
          <Pressable
            style={[styles.botonPrincipal, !puedeGuardar && styles.botonDeshabilitado]}
            onPress={guardar}
            disabled={!puedeGuardar}
            accessibilityRole="button"
            accessibilityLabel="Guardar"
            accessibilityState={{ disabled: !puedeGuardar }}
          >
            <Text style={styles.textoBotonPrincipal}>{guardando ? 'Guardando…' : 'Guardar cambios'}</Text>
          </Pressable>
          {!hayCambios && <Text style={styles.ayuda}>No hay cambios pendientes.</Text>}
        </View>
      </KeyboardAvoidingView>

      <ConfirmarHoja
        visible={salidaPendiente !== null}
        titulo="¿Salir sin guardar?"
        mensaje="Si sales ahora, se perderán tus cambios."
        textoConfirmar="Salir sin guardar"
        icono="close-circle-linear"
        onConfirmar={() => {
          const accion = salidaPendiente;
          setSalidaPendiente(null);
          navigation.dispatch(accion);
        }}
        onCerrar={() => setSalidaPendiente(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  flex: {
    flex: 1,
  },
  contenido: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    padding: espaciado.md,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.superficieCalida,
    borderWidth: 4,
    borderColor: colors.superficie,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espaciado.lg,
  },
  inicial: {
    fontFamily: fuentes.negrita,
    fontSize: 38,
    color: colors.calidoOscuro,
  },
  tarjeta: {
    backgroundColor: colors.superficie,
    borderRadius: radios.lg,
    padding: espaciado.md,
    paddingBottom: espaciado.xs,
  },
  acciones: {
    paddingHorizontal: espaciado.md,
    paddingTop: espaciado.sm,
    paddingBottom: espaciado.md,
    backgroundColor: colors.superficie,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  ayuda: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.chico,
    color: colors.textoSuave,
    textAlign: 'center',
    marginTop: espaciado.xs,
  },
  botonPrincipal: {
    minHeight: 56,
    backgroundColor: colors.encabezado,
    borderRadius: radios.pill,
    paddingHorizontal: espaciado.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: espaciado.sm,
  },
  textoBotonPrincipal: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.sobreEncabezado,
    textAlign: 'center',
  },
  botonSecundario: {
    minHeight: 56,
    borderWidth: 1.5,
    borderColor: colors.borde,
    backgroundColor: colors.superficie,
    borderRadius: radios.pill,
    paddingHorizontal: espaciado.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: espaciado.sm,
  },
  textoBotonSecundario: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.texto,
    textAlign: 'center',
  },
  botonDeshabilitado: {
    opacity: 0.5,
  },
});
