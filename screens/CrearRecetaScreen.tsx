import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  FORMULARIO_VACIO,
  FormularioReceta,
  IngredienteForm,
  REGEX_YOUTUBE,
  useCrearReceta,
} from '../hooks/useCrearReceta';
import { PasoBasico } from '../components/comunidad/crear/PasoBasico';
import { PasoIngredientes } from '../components/comunidad/crear/PasoIngredientes';
import { PasoPreparacion } from '../components/comunidad/crear/PasoPreparacion';
import { PasoDetalles } from '../components/comunidad/crear/PasoDetalles';
import { SelectorIngredienteReceta } from '../components/comunidad/SelectorIngredienteReceta';
import { EstadoEnvio } from '../components/comunidad/EstadoEnvio';
import { HojaInferior } from '../components/HojaInferior';
import { MenuHoja, OpcionMenu } from '../components/MenuHoja';
import { VistaCargando, VistaError } from '../components/StateViews';
import { colors, espaciado, fuentes, radios, tamanos, tipografia } from '../theme/theme';

interface Props {
  recetaId?: number;
  onCerrar: () => void;
  onPublicada: (id: number, fueEdicion: boolean) => void;
}

const TITULOS = ['Lo básico', 'Ingredientes', 'Preparación', 'Detalles'];

type Hoja = 'foto' | 'salir' | 'ingrediente' | 'resultado' | null;

// Devuelve qué falta para avanzar, o null si el paso está completo
function faltante(paso: number, form: FormularioReceta, pedirConsentimiento: boolean, acepto: boolean) {
  if (paso === 0) {
    const nombre = form.nombre.trim();
    if (nombre.length < 3) return 'Escribe el nombre de la receta (mínimo 3 letras).';
  }
  if (paso === 1 && form.ingredientes.length === 0) return 'Agrega al menos un ingrediente.';
  if (paso === 2 && !form.pasos.some((p) => p.texto.trim())) return 'Escribe al menos un paso.';
  if (paso === 3) {
    const video = form.video.trim();
    if (video && !REGEX_YOUTUBE.test(video)) return 'Revisa el enlace de YouTube.';
    if (pedirConsentimiento && !acepto) return 'Marca la casilla para poder publicar.';
  }
  return null;
}

export default function CrearRecetaScreen({ recetaId, onCerrar, onPublicada }: Props) {
  const r = useCrearReceta(recetaId);
  const [paso, setPaso] = useState(0);
  const [hoja, setHoja] = useState<Hoja>(null);
  const [editando, setEditando] = useState<number | null>(null);
  const [acepto, setAcepto] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; id?: number; mensaje?: string } | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  if (r.cargando) {
    return (
      <SafeAreaView style={estilos.pantalla}>
        <VistaCargando mensaje="Preparando tu receta..." />
      </SafeAreaView>
    );
  }
  if (r.error) {
    return (
      <SafeAreaView style={estilos.pantalla}>
        <VistaError mensaje={r.error} onReintentar={onCerrar} />
      </SafeAreaView>
    );
  }

  const { form, actualizar } = r;
  const pedirConsentimiento = !r.yaAcepto;
  const falta = faltante(paso, form, pedirConsentimiento, acepto);
  const esUltimo = paso === TITULOS.length - 1;
  const hayContenido = JSON.stringify(form) !== JSON.stringify(FORMULARIO_VACIO);

  const cambiarHoja = (siguiente: Hoja) => {
    setHoja(null);
    setTimeout(() => setHoja(siguiente), 300);
  };

  const irA = (nuevo: number) => {
    setPaso(nuevo);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const alCerrar = () => {
    if (hayContenido) setHoja('salir');
    else onCerrar();
  };

  const elegirFoto = async (origen: 'camara' | 'galeria') => {
    setHoja(null);
    if (origen === 'camara') {
      const permiso = await ImagePicker.requestCameraPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert('Necesitamos tu cámara', 'Activa el permiso de cámara en los ajustes del teléfono.');
        return;
      }
    }
    const opciones: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    };
    const elegida =
      origen === 'camara'
        ? await ImagePicker.launchCameraAsync(opciones)
        : await ImagePicker.launchImageLibraryAsync(opciones);
    if (!elegida.canceled) actualizar({ fotoUri: elegida.assets[0].uri });
  };

  const opcionesFoto: OpcionMenu[] = [
    { texto: 'Tomar foto', icono: 'camera-outline', onPress: () => elegirFoto('camara') },
    { texto: 'Elegir de la galería', icono: 'images-outline', onPress: () => elegirFoto('galeria') },
    ...(form.fotoUri
      ? [
          {
            texto: 'Quitar foto',
            icono: 'trash-outline' as const,
            peligro: true,
            onPress: () => {
              actualizar({ fotoUri: null });
              setHoja(null);
            },
          },
        ]
      : []),
  ];

  const opcionesSalir: OpcionMenu[] = r.esEdicion
    ? [{ texto: 'Descartar cambios', icono: 'close-circle-outline', peligro: true, onPress: onCerrar }]
    : [
        {
          texto: 'Guardar borrador y salir',
          descripcion: 'La encontrarás aquí la próxima vez',
          icono: 'bookmark-outline',
          onPress: onCerrar,
        },
        {
          texto: 'Descartar receta',
          descripcion: 'Se borrará lo que llevas',
          icono: 'trash-outline',
          peligro: true,
          onPress: async () => {
            await r.descartarBorrador();
            onCerrar();
          },
        },
      ];

  const guardarIngrediente = (item: IngredienteForm) => {
    const lista =
      editando == null
        ? [...form.ingredientes, item]
        : form.ingredientes.map((ing, i) => (i === editando ? item : ing));
    actualizar({ ingredientes: lista });
    setHoja(null);
  };

  const quitarIngrediente = () => {
    actualizar({ ingredientes: form.ingredientes.filter((_, i) => i !== editando) });
    setHoja(null);
  };

  const publicar = async () => {
    const res = await r.publicar(acepto);
    setResultado(res.ok ? { ok: true, id: res.id } : { ok: false, mensaje: res.mensaje });
    setHoja('resultado');
  };

  const cerrarResultado = () => {
    setHoja(null);
    if (resultado?.ok && resultado.id) onPublicada(resultado.id, r.esEdicion);
  };

  const idsUsados = form.ingredientes
    .filter((_, i) => i !== editando)
    .map((i) => i.ingrediente.id);

  return (
    <SafeAreaView style={estilos.pantalla} edges={['top', 'bottom']}>
      <View style={estilos.encabezado}>
        <View style={estilos.filaTitulo}>
          <Pressable onPress={alCerrar} hitSlop={10} accessibilityLabel="Cerrar">
            <Ionicons name="close" size={26} color={colors.primario} />
          </Pressable>
          <Text style={estilos.titulo}>{r.esEdicion ? 'Editar receta' : 'Nueva receta'}</Text>
          <Text style={[tipografia.chico, { width: 60, textAlign: 'right' }]}>
            {r.esEdicion ? '' : 'Borrador'}
          </Text>
        </View>
        <View style={estilos.progreso}>
          {TITULOS.map((t, i) => (
            <View key={t} style={[estilos.segmento, i <= paso && estilos.segmentoActivo]} />
          ))}
        </View>
        <Text style={tipografia.chico}>
          Paso {paso + 1} de {TITULOS.length} · {TITULOS[paso]}
        </Text>
        {r.borradorRecuperado && paso === 0 && (
          <View style={estilos.avisoBorrador}>
            <Ionicons name="bookmark" size={14} color={colors.acentoOscuro} />
            <Text style={estilos.textoBorrador}>Recuperamos tu borrador anterior.</Text>
          </View>
        )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={estilos.contenido}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {paso === 0 && <PasoBasico form={form} actualizar={actualizar} onFoto={() => setHoja('foto')} />}
          {paso === 1 && (
            <PasoIngredientes
              form={form}
              alergenos={r.alergenos}
              onAgregar={() => {
                setEditando(null);
                setHoja('ingrediente');
              }}
              onEditar={(i) => {
                setEditando(i);
                setHoja('ingrediente');
              }}
            />
          )}
          {paso === 2 && <PasoPreparacion form={form} actualizar={actualizar} />}
          {paso === 3 && (
            <PasoDetalles
              form={form}
              actualizar={actualizar}
              etiquetas={r.etiquetas}
              electrodomesticos={r.electrodomesticos}
              alias={r.alias}
              pedirConsentimiento={pedirConsentimiento}
              acepto={acepto}
              onAceptar={setAcepto}
            />
          )}
        </ScrollView>

        <View style={estilos.barra}>
          {!!falta && <Text style={estilos.falta}>{falta}</Text>}
          <View style={estilos.filaBotones}>
            {paso > 0 && (
              <Pressable onPress={() => irA(paso - 1)} style={[estilos.boton, estilos.botonAtras]}>
                <Text style={estilos.textoAtras}>Atrás</Text>
              </Pressable>
            )}
            <Pressable
              onPress={esUltimo ? publicar : () => irA(paso + 1)}
              disabled={!!falta || r.publicando}
              style={[estilos.boton, estilos.botonSiguiente, (!!falta || r.publicando) && estilos.apagado]}
            >
              {r.publicando ? (
                <ActivityIndicator color={colors.sobrePrimario} />
              ) : (
                <>
                  <Text style={estilos.textoSiguiente}>
                    {esUltimo ? (r.esEdicion ? 'Guardar cambios' : 'Publicar') : 'Siguiente'}
                  </Text>
                  <Ionicons name={esUltimo ? 'send' : 'arrow-forward'} size={16} color={colors.sobrePrimario} />
                </>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <MenuHoja visible={hoja === 'foto'} titulo="Foto de tu receta" opciones={opcionesFoto} onCerrar={() => setHoja(null)} />
      <MenuHoja
        visible={hoja === 'salir'}
        titulo={r.esEdicion ? '¿Salir sin guardar?' : '¿Salir de tu receta?'}
        opciones={opcionesSalir}
        onCerrar={() => setHoja(null)}
      />
      <SelectorIngredienteReceta
        visible={hoja === 'ingrediente'}
        existente={editando != null ? form.ingredientes[editando] : null}
        idsUsados={idsUsados}
        onConfirmar={guardarIngrediente}
        onQuitar={quitarIngrediente}
        onCerrar={() => setHoja(null)}
      />
      <HojaInferior visible={hoja === 'resultado'} onCerrar={cerrarResultado}>
        {resultado?.ok ? (
          <EstadoEnvio
            tipo="exito"
            titulo={r.esEdicion ? '¡Cambios guardados!' : '¡Tu receta ya está en la comunidad!'}
            mensaje={
              r.esEdicion
                ? 'Tu receta se actualizó para todos.'
                : 'Gracias por compartir. Otras familias ya pueden cocinarla.'
            }
            onCerrar={cerrarResultado}
          />
        ) : (
          <EstadoEnvio
            tipo="error"
            titulo="No se pudo publicar"
            mensaje={resultado?.mensaje ?? 'Intenta de nuevo.'}
            onCerrar={() => setHoja(null)}
            onReintentar={() => {
              setHoja(null);
              setTimeout(publicar, 300);
            }}
          />
        )}
      </HojaInferior>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  encabezado: {
    paddingHorizontal: espaciado.md,
    paddingTop: espaciado.sm,
    paddingBottom: 12,
    gap: espaciado.sm,
  },
  filaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titulo: {
    ...tipografia.titulo,
    fontSize: 21,
    color: colors.primario,
  },
  progreso: {
    flexDirection: 'row',
    gap: 6,
  },
  segmento: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.fondoHundido,
  },
  segmentoActivo: {
    backgroundColor: colors.acento,
  },
  avisoBorrador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.acentoSuave,
    borderRadius: radios.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  textoBorrador: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.chico,
    color: colors.acentoOscuro,
  },
  contenido: {
    paddingHorizontal: espaciado.md,
    paddingTop: espaciado.xs,
    paddingBottom: espaciado.xl,
  },
  barra: {
    gap: espaciado.sm,
    paddingHorizontal: espaciado.md,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colors.superficie,
    shadowColor: colors.texto,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  falta: {
    ...tipografia.chico,
    textAlign: 'center',
  },
  filaBotones: {
    flexDirection: 'row',
    gap: espaciado.sm,
  },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 52,
    borderRadius: radios.pill,
  },
  botonAtras: {
    width: 104,
    borderWidth: 1.5,
    borderColor: colors.primario,
  },
  botonSiguiente: {
    flex: 1,
    backgroundColor: colors.primario,
  },
  apagado: {
    opacity: 0.45,
  },
  textoAtras: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.primario,
  },
  textoSiguiente: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.sobrePrimario,
  },
});