import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import Icono from '../components/Icono';
import { ConfirmarHoja } from '../components/ConfirmarHoja';
import { mostrarAviso } from '../lib/avisos';
import { supabase } from '../lib/supabase';
import { useRecetaComunidad } from '../hooks/useRecetaComunidad';
import { MAX_COMENTARIO, useComentarios } from '../hooks/useComentarios';
import { useFavoriteToggle } from '../hooks/useFavoriteToggle';
import { VistaCargando, VistaError } from '../components/StateViews';
import { ModalCalificar } from '../components/comunidad/ModalCalificar';
import { ModalReportar } from '../components/comunidad/ModalReportar';
import { MenuHoja, OpcionMenu } from '../components/MenuHoja';
import { colors, espaciado, fuentes, radios, sombra, tipografia, tamanos } from '../theme/theme';
import { RecetaIngrediente } from '../types/database';
import { ModalYaLoPrepare } from '../components/receta/modalYaLoPrepare';
import { HojaAgregarSemana } from '../components/receta/HojaAgregarSemana';
import { esEnlaceVideoSeguro } from '../lib/entradas';

interface Props {
  recetaId: number;
  version?: number;
  onVolver: () => void;
  onCocinar: (porciones: number) => void;
  onEditar: (id: number) => void;
  onAgregarSemana?: (id: number) => void;
}

type Pestana = 'ingredientes' | 'pasos';
type Hoja = 'menu' | 'calificar' | 'reportar' | 'eliminar' | 'preparada' | 'semana' | null;

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
  version,
  onVolver,
  onCocinar,
  onEditar,
}: Props) {
  const { receta, extras, cargando, error, recargar, recargarExtras, eliminar } =
    useRecetaComunidad(recetaId);
  const comentarios = useComentarios(recetaId);
  const { esFavorita, alternar } = useFavoriteToggle(recetaId);

  const [porciones, setPorciones] = useState<number | null>(null);
  const [pestana, setPestana] = useState<Pestana>('ingredientes');
  const [descripcionCompleta, setDescripcionCompleta] = useState(false);
  const [verTodos, setVerTodos] = useState(false);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [barraCompacta, setBarraCompacta] = useState(false);
  const [miId, setMiId] = useState<string | null>(null);
  const [hoja, setHoja] = useState<Hoja>(null);
  const [eliminando, setEliminando] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const yComentarios = useRef(0);

  // Al volver de editar, "version" cambia y la receta se recarga
  useEffect(() => {
    if (version) {
      recargar();
      comentarios.recargar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setMiId(data.session?.user.id ?? null));
  }, []);

  if (cargando) {
    return (
      <SafeAreaView style={estilos.pantalla}>
        <VistaCargando mensaje="Cargando receta de la comunidad..." />
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

  const cerrarHoja = () => setHoja(null);
  const abrirCalificar = () => setHoja('calificar');
  const abrirMenu = () => setHoja('menu');

  // Cierra la hoja actual y abre la siguiente cuando terminó de bajar
  const cambiarHoja = (siguiente: Hoja) => {
    setHoja(null);
    setTimeout(() => setHoja(siguiente), 300);
  };

  const alCalificar = () => {
    recargarExtras();
    comentarios.recargar();
  };

  const confirmarEliminar = async () => {
    setEliminando(true);
    const ok = await eliminar();
    setEliminando(false);
    if (ok) {
      setHoja(null);
      onVolver();
    } else {
      setHoja(null);
      mostrarAviso('No pudimos eliminarla', 'Revisa tu conexión e intenta de nuevo.', 'error');
    }
  };

  const opcionesMenu: OpcionMenu[] = extras.esMia
    ? [
        {
          texto: 'Editar receta',
          icono: 'create-outline',
          onPress: () => {
            setHoja(null);
            onEditar(recetaId);
          },
        },
        {
          texto: 'Eliminar receta',
          descripcion: 'Se borrará para todos',
          icono: 'trash-outline',
          peligro: true,
          onPress: () => cambiarHoja('eliminar'),
        },
      ]
    : [
        {
          texto: 'Reportar receta',
          descripcion: 'Avísanos si algo no está bien',
          icono: 'flag-outline',
          peligro: true,
          onPress: () => cambiarHoja('reportar'),
        },
      ];

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
          <Icono
            nombre={si ? 'check-linear' : falta ? 'close-linear' : 'minus-linear'}
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
            <Icono nombre="arrow-left-linear" size={22} color={colors.primario} />
          </Pressable>
          <Text style={estilos.tituloCompacto} numberOfLines={1}>
            {receta.nombre}
          </Text>
          <Pressable onPress={alternar} hitSlop={10} accessibilityLabel="Guardar receta">
            <Icono
              nombre={esFavorita ? 'star-bold' : 'star-linear'}
              size={22}
              color={esFavorita ? colors.calido : colors.primario}
            />
          </Pressable>
          <Pressable onPress={abrirMenu} hitSlop={10} accessibilityLabel="Más opciones">
            <Icono nombre="menu-dots-linear" size={22} color={colors.primario} />
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
              <Icono nombre="chef-hat-linear" size={48} color={colors.superficieCalida} />
            </View>
          )}
          <Pressable onPress={onVolver} style={[estilos.botonFoto, { left: espaciado.md }]} accessibilityLabel="Regresar">
            <Icono nombre="arrow-left-linear" size={20} color={colors.sobreAcento} />
          </Pressable>
          <Pressable onPress={alternar} style={[estilos.botonFoto, { right: 64 }]} accessibilityLabel="Guardar receta">
            <Icono
              nombre={esFavorita ? 'star-bold' : 'star-linear'}
              size={19}
              color={esFavorita ? colors.calificacion : colors.sobreAcento}
            />
          </Pressable>
          <Pressable onPress={abrirMenu} style={[estilos.botonFoto, { right: espaciado.md }]} accessibilityLabel="Más opciones">
            <Icono nombre="menu-dots-linear" size={20} color={colors.sobreAcento} />
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
              <View style={[estilos.chip, estilos.chipNueva]}>
                <View style={estilos.puntoNueva} />
                <Text style={[estilos.textoChip, { color: colors.texto }]}>Nueva</Text>
              </View>
            ) : (
              <View style={estilos.filaCalificacion}>
                <Icono nombre="star-bold" size={14} color={colors.calido} />
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
                  <Icono nombre="info-circle-linear" size={12} color={colors.textoSuave} />
                  <Text style={[estilos.textoChip, { color: colors.textoSuave }]}>Necesitas {e.toLowerCase()}</Text>
                </View>
              ))}
            </View>
          )}

          {extras.tieneAlergeno && (
            <View style={estilos.avisoAlergia}>
              <Icono nombre="danger-triangle-linear" size={18} color={colors.peligro} />
              <Text style={estilos.textoAlergia}>
                Contiene un ingrediente al que tú o alguien de tu hogar es alérgico.
              </Text>
            </View>
          )}

          <View style={estilos.filaDatos}>
            <View style={estilos.dato}>
              <View style={estilos.iconoDato}>
                <Icono nombre="clock-circle-linear" size={16} color={colors.textoSuave} />
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
                  <Icono nombre="minus-linear" size={14} color={colors.primario} />
                </Pressable>
                <Text style={estilos.valorPorciones}>{porcionesActuales}</Text>
                <Pressable
                  onPress={() => setPorciones(Math.min(20, porcionesActuales + 1))}
                  disabled={porcionesActuales >= 20}
                  hitSlop={8}
                  style={[estilos.botonMas, porcionesActuales >= 20 && { opacity: 0.4 }]}
                  accessibilityLabel="Más porciones"
                >
                  <Icono nombre="add-linear" size={14} color={colors.sobrePrimario} />
                </Pressable>
              </View>
              <Text style={tipografia.chico}>Porciones</Text>
            </View>

            <View style={estilos.dato}>
              <View style={[estilos.iconoDato, { backgroundColor: colors.acentoSuave }]}>
                <Icono nombre="cart-large-2-linear" size={16} color={colors.acentoOscuro} />
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

          {!!receta.video_url && esEnlaceVideoSeguro(receta.video_url) &&(
            <Pressable onPress={() => Linking.openURL(receta.video_url!)} style={estilos.botonVideo}>
              <Icono nombre="play-circle-linear" size={18} color={colors.primario} />
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
                        <Icono nombre="clock-circle-linear" size={12} color={colors.textoSuave} />
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
                  <Icono nombre="star-linear" size={13} color={colors.sobrePrimario} />
                  <Text style={estilos.textoCalificar}>Calificar</Text>
                </Pressable>
              )}
            </View>

            {comentarios.cargando ? (
              <ActivityIndicator color={colors.acento} style={{ marginVertical: espaciado.md }} />
            ) : comentarios.comentarios.length === 0 ? (
              <View style={estilos.sinComentarios}>
                <Icono nombre="chat-round-dots-linear" size={28} color={colors.neutro} />
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
                        <Icono nombre="trash-bin-trash-linear" size={15} color={colors.textoSuave} />
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
                  <Icono nombre="plain-linear" size={14} color={colors.sobrePrimario} />
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={estilos.barraAcciones}>
        <Pressable onPress={() => setHoja('semana')} style={estilos.botonCirculo} accessibilityRole="button" accessibilityLabel="Agregar a mi semana">
          <Icono nombre="calendar-add-linear" size={20} color={colors.primario} />
        </Pressable>
        <Pressable
          onPress={() => setHoja('preparada')}
          style={estilos.botonCirculo}
          accessibilityLabel="Ya la preparé"
        >
          <Icono nombre="check-circle-linear" size={21} color={colors.primario} />
        </Pressable>
        <Pressable
          onPress={() => onCocinar(porcionesActuales)}
          style={({ pressed }) => [estilos.botonCocinar, pressed && { opacity: 0.9 }]}
        >
          <Icono nombre="chef-hat-linear" size={18} color={colors.sobrePrimario} />
          <Text style={estilos.textoCocinar}>Empezar a cocinar</Text>
        </Pressable>
      </View>

      <ModalCalificar
        visible={hoja === 'calificar'}
        recetaId={recetaId}
        nombre={receta.nombre}
        autorAlias={extras.autorAlias}
        fotoUrl={receta.foto_url}
        onCerrar={cerrarHoja}
        onEnviada={alCalificar}
      />
      <ModalReportar visible={hoja === 'reportar'} recetaId={recetaId} onCerrar={cerrarHoja} />
      <HojaAgregarSemana
        visible={hoja === 'semana'}
        recetaId={recetaId}
        nombreReceta={receta.nombre}
        onCerrar={cerrarHoja}
      />
      <ModalYaLoPrepare
        visible={hoja === 'preparada'}
        onCerrar={cerrarHoja}
        receta={receta}
        porciones={porcionesActuales}
      />
      <MenuHoja
        visible={hoja === 'menu'}
        titulo={extras.esMia ? 'Tu receta' : 'Opciones'}
        opciones={opcionesMenu}
        onCerrar={cerrarHoja}
      />
      <ConfirmarHoja
        visible={hoja === 'eliminar'}
        titulo="¿Eliminar tu receta?"
        mensaje="Se borrarán también sus calificaciones y comentarios. No se puede deshacer."
        textoConfirmar="Eliminar"
        cargando={eliminando}
        onConfirmar={confirmarEliminar}
        onCerrar={cerrarHoja}
      />
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
    gap: 17,
    paddingHorizontal: espaciado.md,
    paddingVertical: 14,
    backgroundColor: colors.superficie,
    ...sombra,
  },
  tituloCompacto: {
    flex: 1,
    fontFamily: fuentes.titulo,
    fontSize: tamanos.grande,
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
    paddingTop: 12,
    paddingBottom: espaciado.lg,
    gap: 17,
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
    fontSize: 27,
    lineHeight: 35,
    color: colors.primario,
    textAlign: 'center',
  },
  filaAutor: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
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
    fontSize: tamanos.mini,
    letterSpacing: 0.5,
    color: colors.sobreAcento,
  },
  alias: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.cuerpo,
    color: colors.texto,
  },
  filaCalificacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  promedio: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.cuerpo,
    color: colors.texto,
  },
  filaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 7,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radios.pill,
    paddingHorizontal: 13,
    paddingVertical: 5,
  },
  textoChip: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.chico,
    letterSpacing: 0.3,
  },
  avisoAlergia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.peligroSuave,
    borderWidth: 1,
    borderColor: colors.peligroBorde,
    borderRadius: radios.md,
    padding: 14,
  },
  textoAlergia: {
    flex: 1,
    fontFamily: fuentes.semibold,
    fontSize: tamanos.base,
    lineHeight: 21,
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
    paddingVertical: 14,
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
    fontSize: tamanos.destacado,
    color: colors.texto,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 32,
    marginBottom: 5,
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
    fontSize: tamanos.enorme,
    color: colors.texto,
    minWidth: 18,
    textAlign: 'center',
  },
  enlace: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.base,
    color: colors.acentoOscuro,
    marginTop: 5,
  },
  botonVideo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1.5,
    borderColor: colors.primario,
    borderRadius: radios.pill,
    paddingVertical: 13,
  },
  textoBotonVideo: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.cuerpo,
    color: colors.primario,
  },
  pestanas: {
    flexDirection: 'row',
    backgroundColor: colors.fondoHundido,
    borderRadius: radios.pill,
    padding: 5,
    marginTop: 5,
  },
  pestana: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: radios.pill,
  },
  pestanaActiva: {
    backgroundColor: colors.primario,
  },
  textoPestana: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.cuerpo,
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
    marginTop: 7,
    marginBottom: 5,
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
    gap: 14,
    backgroundColor: colors.superficie,
    borderRadius: radios.md,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 14,
    paddingVertical: 12,
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
    fontSize: tamanos.destacado,
    color: colors.texto,
  },
  paso: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.superficie,
    borderRadius: radios.md,
    padding: 17,
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
    fontSize: tamanos.base,
    color: colors.sobrePrimario,
  },
  chipTiempo: {
    alignSelf: 'flex-start',
    backgroundColor: colors.calidoSuave,
    marginTop: espaciado.sm,
  },
  seccionComentarios: {
    gap: 14,
    marginTop: espaciado.md,
  },
  tituloSeccion: {
    ...tipografia.titulo,
    fontSize: 20,
    color: colors.primario,
  },
  botonCalificar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primario,
    borderRadius: radios.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  textoCalificar: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.chico,
    color: colors.sobrePrimario,
  },
  sinComentarios: {
    alignItems: 'center',
    gap: 7,
    paddingVertical: espaciado.md,
  },
  comentario: {
    backgroundColor: colors.superficie,
    borderRadius: radios.md,
    padding: 14,
    gap: 5,
  },
  cabeceraComentario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textoComentario: {
    marginLeft: 43,
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
    paddingRight: 7,
    paddingVertical: 7,
  },
  inputComentario: {
    flex: 1,
    fontFamily: fuentes.regular,
    fontSize: tamanos.cuerpo,
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
    paddingVertical: 12,
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
    gap: 10,
    backgroundColor: colors.primario,
    borderRadius: radios.pill,
  },
  textoCocinar: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    letterSpacing: 0.3,
    color: colors.sobrePrimario,
  },
  chipNueva: {
    backgroundColor: colors.resaltadoSuave,
  },
  puntoNueva: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.acentoIntenso,
  },
});
