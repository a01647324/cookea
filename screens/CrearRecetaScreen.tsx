import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icono from '../components/Icono';
import { Mascota } from '../components/cocina/Mascota';
import { AccionMascota } from '../constants/mascota';
import { mostrarAviso } from '../lib/avisos';
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
import { IconoCompat } from '../components/IconoCompat';
import { VistaCargando, VistaError } from '../components/StateViews';
import { colors, espaciado, fuentes, radios, tamanos, tipografia } from '../theme/theme';

interface Props {
  recetaId?: number;
  onCerrar: () => void;
  onPublicada: (id: number, fueEdicion: boolean) => void;
}

const TITULOS = ['Lo básico', 'Ingredientes', 'Preparación', 'Detalles'];

// Lo que la mascota hace y dice en cada paso
function guia(paso: number, tieneFoto: boolean): { accion: AccionMascota; texto: string } {
  if (paso === 0)
    return tieneFoto
      ? { accion: 'escribir', texto: 'Ponle nombre y cuéntanos de dónde viene tu receta.' }
      : { accion: 'foto', texto: 'Empieza con una foto de tu platillo. Si no tienes, puedes seguir sin ella.' };
  if (paso === 1) return { accion: 'lista', texto: 'Elige cada ingrediente de la lista. Así avisamos de alergias a quien la cocine.' };
  if (paso === 2) return { accion: 'explicar', texto: 'Un paso a la vez, como se lo explicarías a alguien en tu cocina.' };
  return { accion: 'revisar', texto: 'Ya casi. Revisa los detalles antes de compartirla.' };
}

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
        mostrarAviso('Necesitamos tu cámara', 'Activa el permiso de cámara en los ajustes del teléfono.', 'error');
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
    ? [{ texto: 'Descartar cambios', descripcion: 'Tu receta se queda como estaba', icono: 'close-circle-outline', peligro: true, onPress: onCerrar }]
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

  const { accion, texto: textoGuia } = guia(paso, !!form.fotoUri);

  const idsUsados = form.ingredientes
    .filter((_, i) => i !== editando)
    .map((i) => i.ingrediente.id);

  return (
    <SafeAreaView style={estilos.pantalla} edges={['top', 'bottom']}>
      <View style={estilos.encabezado}>
        <View style={estilos.filaTitulo}>
          <Pressable onPress={alCerrar} hitSlop={6} style={estilos.botonCerrar} accessibilityRole="button" accessibilityLabel="Cerrar">
            <Icono nombre="close-linear" size={22} color={colors.primario} />
          </Pressable>
          <Text style={estilos.titulo} accessibilityRole="header">
            {r.esEdicion ? 'Editar receta' : 'Nueva receta'}
          </Text>
          <View style={estilos.ladoDerecho}>
            {!r.esEdicion && (
              <View style={estilos.pildoraBorrador}>
                <Icono nombre="bookmark-linear" size={13} color={colors.textoSuave} />
                <Text style={estilos.textoPildora}>Borrador</Text>
              </View>
            )}
          </View>
        </View>
        <View style={estilos.progreso}>
          {TITULOS.map((t, i) => (
            <View key={t} style={[estilos.segmento, i <= paso && estilos.segmentoActivo]} />
          ))}
        </View>
        <Text style={estilos.textoPaso}>
          Paso {paso + 1} de {TITULOS.length} · <Text style={estilos.nombrePaso}>{TITULOS[paso]}</Text>
        </Text>
        {r.borradorRecuperado && paso === 0 && (
          <View style={estilos.avisoBorrador}>
            <Icono nombre="bookmark-linear" size={15} color={colors.acentoOscuro} />
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
          <View style={estilos.guia}>
            <Mascota accion={accion} tamano={116} />
            <View style={estilos.globo}>
              <View style={estilos.colaGlobo} />
              <Text style={estilos.textoGlobo}>{textoGuia}</Text>
            </View>
          </View>

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
          {!!falta && (
            <View style={estilos.filaFalta}>
              <Icono nombre="info-circle-linear" size={16} color={colors.textoSuave} />
              <Text style={estilos.falta}>{falta}</Text>
            </View>
          )}
          <View style={estilos.filaBotones}>
            {paso > 0 && (
              <Pressable onPress={() => irA(paso - 1)} style={[estilos.boton, estilos.botonAtras]} accessibilityRole="button">
                <Text style={estilos.textoAtras}>Atrás</Text>
              </Pressable>
            )}
            <Pressable
              onPress={esUltimo ? publicar : () => irA(paso + 1)}
              disabled={!!falta || r.publicando}
              style={[estilos.boton, estilos.botonSiguiente, (!!falta || r.publicando) && estilos.apagado]}
              accessibilityRole="button"
              accessibilityState={{ disabled: !!falta || r.publicando, busy: r.publicando }}
            >
              {r.publicando ? (
                <ActivityIndicator color={colors.sobrePrimario} />
              ) : (
                <>
                  <Text style={estilos.textoSiguiente}>
                    {esUltimo ? (r.esEdicion ? 'Guardar cambios' : 'Publicar') : 'Siguiente'}
                  </Text>
                  <Icono nombre={esUltimo ? 'plain-linear' : 'arrow-right-linear'} size={18} color={colors.sobrePrimario} />
                </>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <MenuHoja visible={hoja === 'foto'} titulo="Foto de tu receta" opciones={opcionesFoto} onCerrar={() => setHoja(null)} />
      <HojaInferior visible={hoja === 'salir'} onCerrar={() => setHoja(null)}>
        <View style={estilos.salir}>
          <Mascota accion="preocupado" tamano={140} />
          <Text style={estilos.tituloSalir}>{r.esEdicion ? '¿Salir sin guardar?' : '¿Salir de tu receta?'}</Text>
        </View>
        <View style={estilos.grupoSalir}>
          {opcionesSalir.map((o, i) => (
            <Pressable
              key={o.texto}
              onPress={o.onPress}
              style={({ pressed }) => [estilos.opcionSalir, i > 0 && estilos.separador, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
            >
              <View style={[estilos.iconoOpcion, o.peligro && { backgroundColor: colors.peligroSuave }]}>
                <IconoCompat nombre={o.icono} size={20} color={o.peligro ? colors.peligro : colors.texto} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[estilos.textoOpcion, o.peligro && { color: colors.peligro }]}>{o.texto}</Text>
                {!!o.descripcion && <Text style={estilos.descripcionOpcion}>{o.descripcion}</Text>}
              </View>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={() => setHoja(null)} style={estilos.seguir} accessibilityRole="button">
          <Text style={estilos.textoSeguir}>Seguir editando</Text>
        </Pressable>
      </HojaInferior>
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
            accion="publicar"
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
            accion="preocupado"
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
  botonCerrar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    ...tipografia.titulo,
    fontSize: 21,
    color: colors.primario,
  },
  ladoDerecho: {
    width: 96,
    alignItems: 'flex-end',
  },
  pildoraBorrador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.fondoHundido,
    borderRadius: radios.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  textoPildora: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.mini,
    color: colors.textoSuave,
  },
  textoPaso: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.base,
    color: colors.textoSuave,
  },
  nombrePaso: {
    fontFamily: fuentes.negrita,
    color: colors.texto,
  },
  guia: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginBottom: espaciado.md,
  },
  globo: {
    flex: 1,
    backgroundColor: colors.superficie,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    padding: 14,
    marginBottom: espaciado.md,
  },
  colaGlobo: {
    position: 'absolute',
    left: -6,
    bottom: 0,
    width: 14,
    height: 14,
    backgroundColor: colors.superficie,
    transform: [{ skewX: '30deg' }],
  },
  textoGlobo: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.cuerpo,
    lineHeight: 22,
    color: colors.texto,
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
    backgroundColor: colors.encabezado,
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
  filaFalta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  falta: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.base,
    color: colors.textoSuave,
    flexShrink: 1,
  },
  filaBotones: {
    flexDirection: 'row',
    gap: espaciado.sm,
  },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 54,
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
  salir: {
    alignItems: 'center',
    gap: espaciado.xs,
    marginBottom: espaciado.md,
  },
  tituloSalir: {
    ...tipografia.titulo,
    fontSize: 22,
    color: colors.primario,
    textAlign: 'center',
  },
  grupoSalir: {
    backgroundColor: colors.superficie,
    borderRadius: radios.lg,
    overflow: 'hidden',
  },
  opcionSalir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: espaciado.md,
    paddingVertical: 14,
    minHeight: 64,
  },
  separador: {
    borderTopWidth: 1,
    borderTopColor: colors.borde,
  },
  iconoOpcion: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.fondoHundido,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoOpcion: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.texto,
  },
  descripcionOpcion: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.chico,
    color: colors.textoSuave,
    marginTop: 2,
  },
  seguir: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radios.pill,
    backgroundColor: colors.primario,
    marginTop: espaciado.md,
  },
  textoSeguir: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.sobrePrimario,
  },
});
