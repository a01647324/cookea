import useProteccionCapturas from './useProteccionCapturas';
import { usePreventRemove } from '@react-navigation/native';
import useCocina from './useCocina';
import BloquesCocina from './BloquesCocina';
import Encabezado from './Encabezado';
import AvisoFormulario from './AvisoFormulario';
import useRetroceso from '../auth/useRetroceso';
import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isAuthRetryableFetchError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { VistaCargando } from '../components/StateViews';
import Icono, { NombreIcono } from '../components/Icono';
import { colors, espaciado, fuentes, radios, tamanos } from '../theme/theme';
import usePreferencias, { MENSAJE_ERROR_GUARDAR, MENSAJE_SIN_CONEXION } from './usePreferencias';
import SelectorPersonas from './SelectorPersonas';
import ListaAlergenos from './ListaAlergenos';

const ICONO_PASO: Record<string, { icono: NombreIcono; fondo: string; color: string }> = {
  personas: { icono: 'users-group-rounded-linear', fondo: colors.calidoSuave, color: colors.calidoIntenso },
  alergias: { icono: 'health-linear', fondo: colors.peligroSuave, color: colors.peligro },
  hogar: { icono: 'home-2-linear', fondo: colors.destacadoSuave, color: colors.destacadoIntenso },
  cocina: { icono: 'oven-mitts-linear', fondo: colors.serenoSuave, color: colors.serenoIntenso },
};

// PersonalizaScreen: pide las preferencias paso a paso.
// Se abre desde la tarjeta de la Home (TarjetaPersonaliza). No es obligatoria.
export default function PersonalizaScreen({ navigation }: any) {
  useProteccionCapturas('personaliza');
  const cocina = useCocina();
  const bloqueo = useRef(false);
  const preferencias = usePreferencias();
  const {
    alergenos,
    personas,
    cambiarPersonas,
    propias,
    alternarPropia,
    hogar,
    alternarHogar,
    cargando: cargaAlergias,
    errorCarga: errorAlergias,
    recargar: recargarAlergias,
    guardar,
  } = preferencias;

  const cargando = cargaAlergias || cocina.cargando;
  const errorCarga = errorAlergias || cocina.error;
  const recargar = () => {
    if (errorAlergias) recargarAlergias();
    if (cocina.error) cocina.recargar();
  };
  const [paso, setPaso] = useState(1);
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const [terminado, setTerminado] = useState(false);
  usePreventRemove(ocupado && !terminado, () => {});
  // Navegar después del render que libera la protección de salida.
  useEffect(() => {
    if (terminado) navigation.goBack();
  }, [terminado, navigation]);
  useRetroceso(() => {
    if (!bloqueo.current && !ocupado) {
      if (paso > 1) setPaso(paso - 1);
      else navigation.goBack();
    }
  });

  // Si vive sola o solo, no se pregunta por las alergias del hogar
  const pasoCocina = personas === 1 ? 3 : 4;
  const totalPasos = pasoCocina;
  const esUltimoPaso = paso === totalPasos;

  // Guarda la marca "personalizo" en los datos del usuario; la tarjeta de la Home se esconde sola.
  async function marcarPersonalizado(): Promise<boolean> {
    const { error } = await supabase.auth.updateUser({ data: { personalizo: true } });
    if (error) {
      setAviso(isAuthRetryableFetchError(error) ? MENSAJE_SIN_CONEXION : MENSAJE_ERROR_GUARDAR);
      return false;
    }
    return true;
  }

  // Guarda todo y, al final, la marca. Si algo falla antes, la marca no se guarda.
  async function terminar(propiasElegidas: Set<number> = propias, hogarElegido: Set<number> = hogar) {
    if (bloqueo.current || ocupado) return;
    bloqueo.current = true;
    setOcupado(true);
    setAviso('');

    try {
      const mensaje = await guardar(propiasElegidas, hogarElegido);
      if (mensaje !== null) {
        setAviso(
          'No se completó el guardado. Algunos cambios pueden haberse guardado. Conservamos tu selección para reintentar. ' +
            mensaje
        );
        return;
      }
      const errorCocina = await cocina.guardar();
      if (errorCocina) {
        setAviso(errorCocina);
        return;
      }
      const marcado = await marcarPersonalizado();
      if (marcado) setTerminado(true);
    } catch {
      setAviso(MENSAJE_SIN_CONEXION);
    } finally {
      bloqueo.current = false;
      setOcupado(false);
    }
  }

  // "Hacerlo después": regresa a la Home sin guardar nada.
  function hacerloDespues() {
    if (bloqueo.current || ocupado) return;
    navigation.goBack();
  }

  function siguiente() {
    if (bloqueo.current || ocupado) return;
    setAviso('');
    if (esUltimoPaso) terminar();
    else setPaso(paso + 1);
  }

  function atras() {
    if (bloqueo.current) return;
    setAviso('');
    setPaso(paso - 1);
  }

  // "No tengo alergias" (paso 2) o "Nadie más tiene alergias" (paso 3)
  function ningunaAlergia() {
    if (bloqueo.current || ocupado) return;
    const vacio = new Set<number>();
    if (paso === 2) {
      preferencias.limpiarPropias();
      if (esUltimoPaso) terminar(vacio, hogar);
      else setPaso(3);
    } else {
      preferencias.limpiarHogar();
      setPaso(pasoCocina);
    }
  }

  const encabezado = (
    <Encabezado
      titulo="Personaliza"
      onVolver={() => {
        if (paso > 1) atras();
        else hacerloDespues();
      }}
      deshabilitado={ocupado}
    />
  );

  const salida = (
    <>
      <Pressable
        style={[styles.link, ocupado && styles.botonDeshabilitado]}
        onPress={hacerloDespues}
        disabled={ocupado}
        accessibilityRole="button"
        accessibilityLabel="Hacerlo después"
      >
        <Text style={styles.textoLink}>Hacerlo después</Text>
      </Pressable>
      <Text style={styles.nota}>Puedes cambiar esto cuando quieras en tu perfil.</Text>
    </>
  );

  if (cargando) {
    return (
      <SafeAreaView style={styles.pantalla} edges={['top']}>
        {encabezado}
        <VistaCargando mensaje="Cargando…" />
      </SafeAreaView>
    );
  }

  if (errorCarga !== '') {
    return (
      <SafeAreaView style={styles.pantalla} edges={['top']}>
        {encabezado}
        <View style={styles.contenido}>
          <AvisoFormulario texto={errorCarga} />
          <AvisoFormulario texto={aviso} />
          <Pressable style={styles.botonPrincipal} onPress={recargar} accessibilityRole="button">
            <Text style={styles.textoBotonPrincipal}>Reintentar</Text>
          </Pressable>
          {salida}
        </View>
      </SafeAreaView>
    );
  }

  let textoPrincipal = 'Siguiente';
  if (esUltimoPaso) textoPrincipal = ocupado ? 'Guardando…' : 'Terminar';

  let textoNinguna = '';
  if (paso === 2) textoNinguna = esUltimoPaso ? 'No tengo alergias, terminar' : 'No tengo alergias';
  if (paso === 3 && personas > 1) textoNinguna = 'Nadie más tiene alergias';
  if (ocupado && esUltimoPaso) textoNinguna = 'Guardando…';

  const clavePaso = paso === 1 ? 'personas' : paso === pasoCocina ? 'cocina' : paso === 2 ? 'alergias' : 'hogar';
  const icono = ICONO_PASO[clavePaso];

  return (
    <SafeAreaView style={styles.pantalla} edges={['top']}>
      {encabezado}
      <View style={styles.progreso}>
        <Text style={styles.indicadorPaso}>
          Paso {paso} de {totalPasos}
        </Text>
        <View style={styles.segmentos}>
          {Array.from({ length: totalPasos }, (_, i) => (
            <View key={i} style={[styles.segmento, i < paso && styles.segmentoActivo]} />
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.contenido}>
        <View style={[styles.circulo, { backgroundColor: icono.fondo }]}>
          <Icono nombre={icono.icono} size={30} color={icono.color} />
        </View>

        <AvisoFormulario texto={aviso} />

        {paso === 1 && (
          <>
            <Text style={styles.pregunta} accessibilityRole="header">
              ¿Cuántas personas viven en tu casa, contándote a ti?
            </Text>
            <Text style={styles.explicacion}>Así te mostramos recetas seguras para todas las personas de tu casa.</Text>
            <SelectorPersonas valor={personas} onCambiar={cambiarPersonas} deshabilitado={ocupado} />
          </>
        )}

        {paso === 2 && (
          <>
            <Text style={styles.pregunta} accessibilityRole="header">
              ¿Tienes alguna alergia a alimentos?
            </Text>
            <Text style={styles.explicacion}>
              Marca todas las que tengas. No te mostraremos recetas con esos ingredientes.
            </Text>
          </>
        )}

        {paso === 3 && personas > 1 && (
          <>
            <Text style={styles.pregunta} accessibilityRole="header">
              ¿Alguien más en tu casa tiene alergias?
            </Text>
            <Text style={styles.explicacion}>Marca las alergias de las demás personas que viven contigo.</Text>
          </>
        )}

        {paso >= 2 && paso < pasoCocina && (
          <>
            <Pressable
              style={[styles.botonNinguna, ocupado && styles.botonDeshabilitado]}
              onPress={ningunaAlergia}
              disabled={ocupado}
              accessibilityRole="button"
              accessibilityLabel={textoNinguna}
            >
              <Icono nombre="check-circle-linear" size={22} color={colors.acentoOscuro} />
              <Text style={styles.textoNinguna}>{textoNinguna}</Text>
            </Pressable>

            <View style={styles.bloque}>
              <ListaAlergenos
                alergenos={alergenos}
                seleccionados={paso === 2 ? propias : hogar}
                onAlternar={paso === 2 ? alternarPropia : alternarHogar}
                deshabilitado={ocupado}
              />
            </View>
          </>
        )}

        {paso === 2 && (
          <View style={{ marginTop: espaciado.md }}>
            <BloquesCocina cocina={cocina} deshabilitado={ocupado} solo="gustos" />
          </View>
        )}
        {paso === pasoCocina && (
          <>
            <Text style={styles.pregunta} accessibilityRole="header">
              ¿Con qué cuentas en tu cocina?
            </Text>
            <BloquesCocina cocina={cocina} deshabilitado={ocupado} solo="cocina" />
          </>
        )}
      </ScrollView>

      <View style={styles.acciones}>
        <Pressable
          style={[styles.botonPrincipal, ocupado && styles.botonDeshabilitado]}
          onPress={siguiente}
          disabled={ocupado}
          accessibilityRole="button"
          accessibilityLabel={textoPrincipal}
        >
          <Text style={styles.textoBotonPrincipal}>{textoPrincipal}</Text>
          {!esUltimoPaso && <Icono nombre="alt-arrow-right-linear" size={20} color={colors.sobreEncabezado} />}
        </Pressable>
        {salida}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  progreso: {
    paddingHorizontal: espaciado.md,
    paddingBottom: espaciado.sm,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  indicadorPaso: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.base,
    color: colors.textoSuave,
    marginBottom: 6,
  },
  segmentos: {
    flexDirection: 'row',
    gap: 6,
  },
  segmento: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borde,
  },
  segmentoActivo: {
    backgroundColor: colors.encabezado,
  },
  contenido: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    padding: espaciado.md,
  },
  circulo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espaciado.md,
  },
  pregunta: {
    fontFamily: fuentes.titulo,
    fontSize: 25,
    lineHeight: 33,
    color: colors.texto,
    marginBottom: espaciado.sm,
  },
  explicacion: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.destacado,
    lineHeight: 24,
    color: colors.textoSuave,
    marginBottom: espaciado.md,
  },
  bloque: {
    backgroundColor: colors.superficie,
    borderRadius: radios.lg,
    padding: espaciado.md,
    marginTop: espaciado.md,
  },
  botonNinguna: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 54,
    borderRadius: radios.pill,
    backgroundColor: colors.acentoSuave,
    paddingHorizontal: espaciado.lg,
  },
  textoNinguna: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.acentoOscuro,
  },
  acciones: {
    paddingHorizontal: espaciado.md,
    paddingTop: espaciado.sm,
    paddingBottom: espaciado.sm,
    backgroundColor: colors.superficie,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  botonPrincipal: {
    flexDirection: 'row',
    gap: 6,
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
  botonDeshabilitado: {
    opacity: 0.5,
  },
  link: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: espaciado.xs,
  },
  textoLink: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.cuerpo,
    color: colors.acentoOscuro,
    textDecorationLine: 'underline',
  },
  nota: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.chico,
    color: colors.textoSuave,
    textAlign: 'center',
  },
});
