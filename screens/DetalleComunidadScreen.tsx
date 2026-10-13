import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useRecetaComunidad } from '../hooks/useRecetaComunidad';
import { MAX_COMENTARIO, useComentarios } from '../hooks/useComentarios';
import { useFavoriteToggle } from '../hooks/useFavoriteToggle';
import { VistaCargando, VistaError } from '../components/StateViews';
import { colors, espaciado, fuentes, radios, sombra, tipografia } from '../theme/theme';
import { RecetaIngrediente } from '../types/database';

interface Props {
  recetaId: number;
  onVolver: () => void;
  onCocinar: (porciones: number) => void;
  onEditar: (id: number) => void;
  onAgregarSemana: (id: number) => void;
  onYaLaPrepare: (id: number, porciones: number) => void;
}

type Pestana = 'ingredientes' | 'pasos';

function textoCantidad(valor: number, unidad: string) {
  const n = Number(valor.toFixed(1));
  if (unidad === 'pieza') return `${n} ${n === 1 ? 'pieza' : 'piezas'}`;
  return `${n} ${unidad}`;
}

function haceCuanto(fecha: string) {
  const minutos = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000);
  if (minutos < 60) return `hace ${Math.max(minutos, 1)} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias < 30) return `hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
  return new Date(fecha).toLocaleDateString('es-MX');
}

export default function DetalleComunidadScreen({
  recetaId,
  onVolver,
  onCocinar,
  onEditar,
  onAgregarSemana,
  onYaLaPrepare,
}: Props) {
  const { receta, extras, cargando, error, recargar, eliminar } = useRecetaComunidad(recetaId);
  const comentarios = useComentarios(recetaId);
  const { esFavorita, alternar } = useFavoriteToggle(recetaId);

  const [porciones, setPorciones] = useState<number | null>(null);
  const [pestana, setPestana] = useState<Pestana>('ingredientes');
  const [descripcionCompleta, setDescripcionCompleta] = useState(false);
  const [verTodos, setVerTodos] = useState(false);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [barraCompacta, setBarraCompacta] = useState(false);
  const [miId, setMiId] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const yComentarios = useRef(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMiId(data.user?.id ?? null));
  }, []);

  if (cargando) {
    return (
      <SafeAreaView style={estilos.pantalla}>
        <VistaCargando mensaje="Cargando receta..." />
      </SafeAreaView>
    );
  }
  if (error || !receta) {
    return (
      <SafeAreaView style={estilos.pantalla}>
        <VistaError mensaje={error ?? 'Receta no encontrada.'} onReintentar={recargar} />
      </SafeAreaView>
    );
  }

  const porcionesBase = receta.porciones_base;
  const porcionesActuales = porciones ?? porcionesBase;
  const factor = porcionesActuales / porcionesBase;

  const obligatorios = receta.receta_ingredientes.filter((ri) => !ri.opcional);
  const opcionales = receta.receta_ingredientes.filter((ri) => ri.opcional);

  const cantidadAjustada = (ri: RecetaIngrediente) => ri.cantidad * factor;
  const loTengo = (ri: RecetaIngrediente) =>
    (extras.alacena[ri.ingredientes.id] ?? 0) >= cantidadAjustada(ri);
  const textoIngrediente = (ri: RecetaIngrediente) =>
    factor === 1 && ri.cantidad_texto
      ? ri.cantidad_texto
      : textoCantidad(cantidadAjustada(ri), ri.ingredientes.unidad);

  const tengo = obligatorios.filter(loTengo).length;
  const progreso = obligatorios.length ? tengo / obligatorios.length : 0;
  const listaComentarios = verTodos ? comentarios.comentarios : comentarios.comentarios.slice(0, 2);

  const alHacerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const pasoLimite = e.nativeEvent.contentOffset.y > 220;
    if (pasoLimite !== barraCompacta) setBarraCompacta(pasoLimite);
  };

  const irAComentarios = () => {
    scrollRef.current?.scrollTo({ y: yComentarios.current, animated: true });
  };

  const confirmarEliminar = () => {
    Alert.alert('¿Eliminar tu receta?', 'Se borrarán también sus calificaciones y comentarios.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const ok = await eliminar();
          if (ok) onVolver();
          else Alert.alert('No pudimos eliminarla', 'Intenta de nuevo.');
        },
      },
    ]);
  };

  // Se reemplazan por los modales en el siguiente paso
  const abrirCalificar = () => Alert.alert('Próximamente', 'Calificar está en construcción.');
  const abrirReportar = () => Alert.alert('Próximamente', 'Reportar está en construcción.');

  const abrirMenu = () => {
    if (extras.esMia) {
      Alert.alert('Tu receta', undefined, [
        { text: 'Editar', onPress: () => onEditar(recetaId) },
        { text: 'Eliminar', style: 'destructive', onPress: confirmarEliminar },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    } else {
      Alert.alert('Opciones', undefined, [
        { text: 'Reportar', style: 'destructive', onPress: abrirReportar },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    }
  };

  const enviarComentario = async () => {
    const ok = await comentarios.publicar(nuevoComentario);
    if (ok) setNuevoComentario('');
  };

  const filaIngrediente = (ri: RecetaIngrediente) => {
    const si = loTengo(ri);
    const falta = !si && !ri.opcional;
    return (
      <View key={ri.ingredientes.id} style={[estilos.filaIngrediente, falta && estilos.filaFalta]}>
        <View style={[estilos.estado, si ? estilos.estadoSi : falta ? estilos.estadoNo : estilos.estadoOpcional]}>
          <Ionicons
            name={si ? 'checkmark' : falta ? 'close' : 'remove'}
            size={16}
            color={si ? colors.acentoOscuro : falta ? colors.peligro : colors.textoSuave}
          />
        </View>
        <Text style={estilos.nombreIngrediente}>{ri.ingredientes.nombre}</Text>
        <Text style={[tipografia.chico, falta && { color: colors.peligro }]}>{textoIngrediente(ri)}</Text>
      </View>
    );
  };

  const estrellas = (n: number) => '★'.repeat(n);

  return (
    <SafeAreaView style={estilos.pantalla} edges={['top']}>
      {barraCompacta && (
        <View style={estilos.barraCompacta}>
          <Pressable onPress={onVolver} hitSlop={10} accessibilityLabel="Regresar">
            <Ionicons name="arrow-back" size={22} color={colors.primario} />
          </Pressable>
          <Text style={estilos.tituloCompacto} numberOfLines={1}>
            {receta.nombre}
          </Text>
          <Pressable onPress={alternar} hitSlop={10} accessibilityLabel="Guardar receta">
            <Ionicons
              name={esFavorita ? 'star' : 'star-outline'}
              size={22}
              color={esFavorita ? colors.calido : colors.primario}
            />
          </Pressable>
          <Pressable onPress={abrirMenu} hitSlop={10} accessibilityLabel="Más opciones">
            <Ionicons name="ellipsis-horizontal" size={22} color={colors.primario} />
          </Pressable>
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        onScroll={alHacerScroll}
        scrollEventThrottle={100}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View>
          {receta.foto_url ? (
            <Image
              source={{ uri: receta.foto_url }}
              style={estilos.foto}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={[estilos.foto, estilos.fotoRespaldo]}>
              <Ionicons name="restaurant-outline" size={48} color={colors.superficieCalida} />
            </View>
          )}
          <Pressable onPress={onVolver} style={[estilos.botonFoto, { left: espaciado.md }]} accessibilityLabel="Regresar">
            <Ionicons name="arrow-back" size={20} color={colors.sobreAcento} />
          </Pressable>
          <Pressable onPress={alternar} style={[estilos.botonFoto, { right: 64 }]} accessibilityLabel="Guardar receta">
            <Ionicons
              name={esFavorita ? 'star' : 'star-outline'}
              size={19}
              color={esFavorita ? colors.calificacion : colors.sobreAcento}
            />
          </Pressable>
          <Pressable onPress={abrirMenu} style={[estilos.botonFoto, { right: espaciado.md }]} accessibilityLabel="Más opciones">
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.sobreAcento} />
          </Pressable>
        </View>

        <View style={estilos.hoja}>
          <View style={estilos.asa} />
          <Text style={estilos.nombre}>{receta.nombre}</Text>

          <Pressable onPress={irAComentarios} style={estilos.filaAutor} hitSlop={6}>
            {!!extras.autorAlias && (
              <>
                <View style={estilos.avatar}>
                  <Text style={estilos.iniciales}>{extras.autorAlias.slice(0, 2).toUpperCase()}</Text>
                </View>
                <Text style={estilos.alias}>{extras.autorAlias}</Text>
                <Text style={tipografia.chico}>·</Text>
              </>
            )}
            {extras.total === 0 ? (
              <View style={[estilos.chip, { backgroundColor: colors.calidoSuave }]}>
                <Ionicons name="sparkles" size={11} color={colors.calido} />
                <Text style={[estilos.textoChip, { color: colors.textoSuave }]}>Nueva</Text>
              </View>
            ) : (
              <View style={estilos.filaCalificacion}>
                <Ionicons name="star" size={14} color={colors.calido} />
                <Text style={estilos.promedio}>{extras.promedio}</Text>
                <Text style={tipografia.chico}>({extras.total})</Text>
              </View>
            )}
          </Pressable>

          {(extras.etiquetas.length > 0 || extras.faltanElectrodomesticos.length > 0) && (
            <View style={estilos.filaChips}>
              {extras.etiquetas.map((e, i) => (
                <View
                  key={e}
                  style={[estilos.chip, { backgroundColor: i === 0 ? colors.acentoSuave : colors.calidoSuave }]}
                >
                  <Text style={[estilos.textoChip, { color: i === 0 ? colors.acentoOscuro : colors.textoSuave }]}>
                    {e}
                  </Text>
                </View>
              ))}
              {extras.faltanElectrodomesticos.map((e) => (
                <View key={e} style={[estilos.chip, { backgroundColor: colors.calidoSuave }]}>
                  <Ionicons name="alert-circle-outline" size={12} color={colors.textoSuave} />
                  <Text style={[estilos.textoChip, { color: colors.textoSuave }]}>Necesitas {e.toLowerCase()}</Text>
                </View>
              ))}
            </View>
          )}

          {extras.tieneAlergeno && (
            <View style={estilos.avisoAlergia}>
              <Ionicons name="warning-outline" size={18} color={colors.peligro} />
              <Text style={estilos.textoAlergia}>
                Contiene un ingrediente al que tú o alguien de tu hogar es alérgico.
              </Text>
            </View>
          )}

          <View style={estilos.filaDatos}>
            <View style={estilos.dato}>
              <View style={estilos.iconoDato}>
                <Ionicons name="time-outline" size={16} color={colors.textoSuave} />
              </View>
              <Text style={estilos.valorDato}>{receta.tiempo_min} min</Text>
              <Text style={tipografia.chico}>Tiempo</Text>
            </View>

            <View style={estilos.dato}>
              <View style={estilos.stepper}>
                <Pressable
                  onPress={() => setPorciones(Math.max(1, porcionesActuales - 1))}
                  disabled={porcionesActuales <= 1}
                  hitSlop={8}
                  style={[estilos.botonMenos, porcionesActuales <= 1 && { opacity: 0.4 }]}
                  accessibilityLabel="Menos porciones"
                >
                  <Ionicons name="remove" size={14} color={colors.primario} />
                </Pressable>
                <Text style={estilos.valorPorciones}>{porcionesActuales}</Text>
                <Pressable
                  onPress={() => setPorciones(Math.min(20, porcionesActuales + 1))}
                  disabled={porcionesActuales >= 20}
                  hitSlop={8}
                  style={[estilos.botonMas, porcionesActuales >= 20 && { opacity: 0.4 }]}
                  accessibilityLabel="Más porciones"
                >
                  <Ionicons name="add" size={14} color={colors.sobrePrimario} />
                </Pressable>
              </View>
              <Text style={tipografia.chico}>Porciones</Text>
            </View>

            <View style={estilos.dato}>
              <View style={[estilos.iconoDato, { backgroundColor: colors.acentoSuave }]}>
                <Ionicons name="basket-outline" size={16} color={colors.acentoOscuro} />
              </View>
              <Text style={estilos.valorDato}>
                {tengo} de {obligatorios.length}
              </Text>
              <Text style={tipografia.chico}>Tienes</Text>
            </View>
          </View>

          {!!receta.descripcion && (
            <Pressable onPress={() => setDescripcionCompleta(!descripcionCompleta)}>
              <Text style={tipografia.cuerpo} numberOfLines={descripcionCompleta ? undefined : 3}>
                {receta.descripcion}
              </Text>
              <Text style={estilos.enlace}>{descripcionCompleta ? 'Leer menos' : 'Leer más'}</Text>
            </Pressable>
          )}

          {!!receta.video_url && (
            <Pressable onPress={() => Linking.openURL(receta.video_url!)} style={estilos.botonVideo}>
              <Ionicons name="logo-youtube" size={18} color={colors.primario} />
              <Text style={estilos.textoBotonVideo}>Ver video</Text>
            </Pressable>
          )}

          <View style={estilos.pestanas}>
            {(['ingredientes', 'pasos'] as Pestana[]).map((p) => {
              const activa = pestana === p;
              return (
                <Pressable key={p} onPress={() => setPestana(p)} style={[estilos.pestana, activa && estilos.pestanaActiva]}>
                  <Text style={[estilos.textoPestana, activa && estilos.textoPestanaActiva]}>
                    {p === 'ingredientes' ? 'Ingredientes' : 'Pasos'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {pestana === 'ingredientes' ? (
            <View style={estilos.lista}>
              <View>
                <View style={estilos.filaEntre}>
                  <Text style={tipografia.chico}>
                    Tienes {tengo} de {obligatorios.length} en tu alacena
                  </Text>
                  <Text style={tipografia.chico}>{Math.round(progreso * 100)}%</Text>
                </View>
                <View style={estilos.pistaProgreso}>
                  <View style={[estilos.barraProgreso, { width: `${progreso * 100}%` }]} />
                </View>
              </View>
              {obligatorios.map(filaIngrediente)}
              {opcionales.length > 0 && (
                <>
                  <Text style={[tipografia.chico, estilos.subtituloLista]}>Opcionales</Text>
                  {opcionales.map(filaIngrediente)}
                </>
              )}
            </View>
          ) : (
            <View style={estilos.lista}>
              {receta.pasos_receta.map((paso) => (
                <View key={paso.orden} style={estilos.paso}>
                  <View style={estilos.numeroPaso}>
                    <Text style={estilos.textoNumeroPaso}>{paso.orden}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={tipografia.cuerpo}>{paso.texto}</Text>
                    {paso.temporizador_seg != null && (
                      <View style={[estilos.chip, estilos.chipTiempo]}>
                        <Ionicons name="time-outline" size={12} color={colors.textoSuave} />
                        <Text style={[estilos.textoChip, { color: colors.textoSuave }]}>
                          {Math.round(paso.temporizador_seg / 60)} min
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          <View
            style={estilos.seccionComentarios}
            onLayout={(e) => {
              yComentarios.current = e.nativeEvent.layout.y;
            }}
          >
            <View style={estilos.filaEntre}>
              <Text style={estilos.tituloSeccion}>
                Comentarios <Text style={tipografia.chico}>({comentarios.comentarios.length})</Text>
              </Text>
              {!extras.esMia && (
                <Pressable onPress={abrirCalificar} style={estilos.botonCalificar}>
                  <Ionicons name="star-outline" size={13} color={colors.sobrePrimario} />
                  <Text style={estilos.textoCalificar}>Calificar</Text>
                </Pressable>
              )}
            </View>

            {comentarios.cargando ? (
              <ActivityIndicator color={colors.acento} style={{ marginVertical: espaciado.md }} />
            ) : comentarios.comentarios.length === 0 ? (
              <View style={estilos.sinComentarios}>
                <Ionicons name="chatbubbles-outline" size={28} color={colors.neutro} />
                <Text style={tipografia.chico}>Aún no hay comentarios. ¡Sé la primera persona!</Text>
              </View>
            ) : (
              listaComentarios.map((c) => (
                <View key={c.id} style={estilos.comentario}>
                  <View style={estilos.cabeceraComentario}>
                    <View style={estilos.avatar}>
                      <Text style={estilos.iniciales}>{c.alias.slice(0, 2).toUpperCase()}</Text>
                    </View>
                    <Text style={estilos.alias}>{c.alias}</Text>
                    <Text style={[tipografia.chico, { marginLeft: 'auto' }]}>{haceCuanto(c.creado_en)}</Text>
                    {c.usuario_id === miId && (
                      <Pressable onPress={() => comentarios.borrar(c.id)} hitSlop={10} accessibilityLabel="Borrar comentario">
                        <Ionicons name="trash-outline" size={15} color={colors.textoSuave} />
                      </Pressable>
                    )}
                  </View>
                  <Text style={[tipografia.cuerpo, estilos.textoComentario]}>{c.texto}</Text>
                </View>
              ))
            )}

            {comentarios.comentarios.length > 2 && (
              <Pressable onPress={() => setVerTodos(!verTodos)}>
                <Text style={[estilos.enlace, { textAlign: 'center' }]}>
                  {verTodos ? 'Ver menos' : 'Ver todos los comentarios'}
                </Text>
              </Pressable>
            )}

            {!!comentarios.error && <Text style={estilos.textoError}>{comentarios.error}</Text>}

            <View style={estilos.campoComentario}>
              <TextInput
                style={estilos.inputComentario}
                placeholder="Escribe un comentario…"
                placeholderTextColor={colors.textoSuave}
                value={nuevoComentario}
                onChangeText={setNuevoComentario}
                maxLength={MAX_COMENTARIO}
                multiline
                autoComplete="off"
                importantForAutofill="no"
              />
              <Pressable
                onPress={enviarComentario}
                disabled={comentarios.enviando || !nuevoComentario.trim()}
                style={[estilos.botonEnviar, !nuevoComentario.trim() && { opacity: 0.4 }]}
                accessibilityLabel="Enviar comentario"
              >
                {comentarios.enviando ? (
                  <ActivityIndicator size="small" color={colors.sobrePrimario} />
                ) : (
                  <Ionicons name="send" size={14} color={colors.sobrePrimario} />
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={estilos.barraAcciones}>
        <Pressable onPress={() => onAgregarSemana(recetaId)} style={estilos.botonCirculo} accessibilityLabel="Agregar a mi semana">
          <Ionicons name="calendar-outline" size={20} color={colors.primario} />
        </Pressable>
        <Pressable
          onPress={() => onYaLaPrepare(recetaId, porcionesActuales)}
          style={estilos.botonCirculo}
          accessibilityLabel="Ya la preparé"
        >
          <Ionicons name="checkmark-circle-outline" size={21} color={colors.primario} />
        </Pressable>
        <Pressable
          onPress={() => onCocinar(porcionesActuales)}
          style={({ pressed }) => [estilos.botonCocinar, pressed && { opacity: 0.9 }]}
        >
          <Ionicons name="restaurant-outline" size={18} color={colors.sobrePrimario} />
          <Text style={estilos.textoCocinar}>Empezar a cocinar</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  barraCompacta: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: espaciado.md,
    paddingVertical: 12,
    backgroundColor: colors.superficie,
    ...sombra,
  },
  tituloCompacto: {
    flex: 1,
    fontFamily: fuentes.titulo,
    fontSize: 16,
    color: colors.primario,
  },
  foto: {
    width: '100%',
    height: 280,
  },
  fotoRespaldo: {
    backgroundColor: colors.neutro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonFoto: {
    position: 'absolute',
    top: espaciado.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.vidrio,
    borderWidth: 1,
    borderColor: colors.vidrioBorde,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hoja: {
    backgroundColor: colors.fondo,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    marginTop: -26,
    paddingHorizontal: espaciado.md,
    paddingTop: 10,
    paddingBottom: espaciado.lg,
    gap: 14,
  },
  asa: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borde,
    alignSelf: 'center',
  },
  nombre: {
    ...tipografia.tituloGrande,
    fontSize: 26,
    lineHeight: 33,
    color: colors.primario,
    textAlign: 'center',
  },
  filaAutor: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    marginTop: -4,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.acento,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iniciales: {
    fontFamily: fuentes.negrita,
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.sobreAcento,
  },
  alias: {
    fontFamily: fuentes.semibold,
    fontSize: 14,
    color: colors.texto,
  },
  filaCalificacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  promedio: {
    fontFamily: fuentes.negrita,
    fontSize: 14,
    color: colors.texto,
  },
  filaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radios.pill,
    paddingHorizontal: 11,
    paddingVertical: 4,
  },
  textoChip: {
    fontFamily: fuentes.semibold,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  avisoAlergia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.peligroSuave,
    borderWidth: 1,
    borderColor: colors.peligroBorde,
    borderRadius: radios.md,
    padding: 12,
  },
  textoAlergia: {
    flex: 1,
    fontFamily: fuentes.semibold,
    fontSize: 13,
    lineHeight: 19,
    color: colors.peligro,
  },
  filaDatos: {
    flexDirection: 'row',
    gap: espaciado.sm,
  },
  dato: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.superficie,
    borderRadius: radios.md,
    paddingVertical: 12,
    ...sombra,
  },
  iconoDato: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.calidoSuave,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  valorDato: {
    fontFamily: fuentes.negrita,
    fontSize: 15,
    color: colors.texto,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 32,
    marginBottom: 4,
  },
  botonMenos: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonMas: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valorPorciones: {
    fontFamily: fuentes.negrita,
    fontSize: 17,
    color: colors.texto,
    minWidth: 18,
    textAlign: 'center',
  },
  enlace: {
    fontFamily: fuentes.negrita,
    fontSize: 13,
    color: colors.acentoOscuro,
    marginTop: 4,
  },
  botonVideo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.primario,
    borderRadius: radios.pill,
    paddingVertical: 11,
  },
  textoBotonVideo: {
    fontFamily: fuentes.negrita,
    fontSize: 14,
    color: colors.primario,
  },
  pestanas: {
    flexDirection: 'row',
    backgroundColor: colors.fondoHundido,
    borderRadius: radios.pill,
    padding: 4,
    marginTop: 4,
  },
  pestana: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: radios.pill,
  },
  pestanaActiva: {
    backgroundColor: colors.primario,
  },
  textoPestana: {
    fontFamily: fuentes.semibold,
    fontSize: 14,
    color: colors.textoSuave,
  },
  textoPestanaActiva: {
    color: colors.sobrePrimario,
  },
  lista: {
    gap: espaciado.sm,
  },
  filaEntre: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pistaProgreso: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.fondoHundido,
    marginTop: 6,
    marginBottom: 4,
    overflow: 'hidden',
  },
  barraProgreso: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.acento,
  },
  subtituloLista: {
    marginTop: espaciado.sm,
  },
  filaIngrediente: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.superficie,
    borderRadius: radios.md,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filaFalta: {
    borderColor: colors.peligroBorde,
  },
  estado: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  estadoSi: {
    backgroundColor: colors.acentoSuave,
  },
  estadoNo: {
    backgroundColor: colors.peligroSuave,
  },
  estadoOpcional: {
    backgroundColor: colors.fondoHundido,
  },
  nombreIngrediente: {
    flex: 1,
    fontFamily: fuentes.semibold,
    fontSize: 15,
    color: colors.texto,
  },
  paso: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.superficie,
    borderRadius: radios.md,
    padding: 14,
  },
  numeroPaso: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoNumeroPaso: {
    fontFamily: fuentes.negrita,
    fontSize: 13,
    color: colors.sobrePrimario,
  },
  chipTiempo: {
    alignSelf: 'flex-start',
    backgroundColor: colors.calidoSuave,
    marginTop: espaciado.sm,
  },
  seccionComentarios: {
    gap: 12,
    marginTop: espaciado.md,
  },
  tituloSeccion: {
    ...tipografia.titulo,
    fontSize: 19,
    color: colors.primario,
  },
  botonCalificar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primario,
    borderRadius: radios.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  textoCalificar: {
    fontFamily: fuentes.negrita,
    fontSize: 12,
    color: colors.sobrePrimario,
  },
  sinComentarios: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: espaciado.md,
  },
  comentario: {
    backgroundColor: colors.superficie,
    borderRadius: radios.md,
    padding: 12,
    gap: 4,
  },
  cabeceraComentario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textoComentario: {
    marginLeft: 36,
  },
  textoError: {
    ...tipografia.chico,
    color: colors.peligro,
    textAlign: 'center',
  },
  campoComentario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: 24,
    paddingLeft: espaciado.md,
    paddingRight: 6,
    paddingVertical: 6,
  },
  inputComentario: {
    flex: 1,
    fontFamily: fuentes.regular,
    fontSize: 14,
    color: colors.texto,
    maxHeight: 100,
  },
  botonEnviar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barraAcciones: {
    flexDirection: 'row',
    gap: espaciado.sm,
    paddingHorizontal: espaciado.md,
    paddingVertical: 10,
    backgroundColor: colors.superficie,
    shadowColor: colors.texto,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  botonCirculo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonCocinar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primario,
    borderRadius: radios.pill,
  },
  textoCocinar: {
    fontFamily: fuentes.negrita,
    fontSize: 15,
    letterSpacing: 0.3,
    color: colors.sobrePrimario,
  },
});