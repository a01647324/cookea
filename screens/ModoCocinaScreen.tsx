import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useKeepAwake } from 'expo-keep-awake';
import { useDetalleReceta } from '../hooks/useDetalleReceta';
import { VistaCargando, VistaError } from '../components/StateViews';
import { EstadoVacio } from '../components/EstadoVacio';
import { ConfirmarHoja } from '../components/ConfirmarHoja';
import Icono, { NombreIcono } from '../components/Icono';
import { IngredienteImagen } from '../components/alacena/ingredienteImagen';
import { COLORES_ACCION, Mascota } from '../components/cocina/Mascota';
import { Temporizador } from '../components/cocina/Temporizador';
import { ModalYaLoPrepare } from '../components/receta/modalYaLoPrepare';
import { accionDePaso } from '../constants/mascota';
import { normalizar } from '../constants/categorias';
import { formatearCantidad } from '../lib/unidades';
import { RecetaIngrediente } from '../types/database';
import { colors, espaciado, fuentes, radios, tamanos } from '../theme/theme';

type Fase = 'preparar' | 'pasos' | 'final';
type IngredienteCocina = RecetaIngrediente & {
  ingredientes: RecetaIngrediente['ingredientes'] & { imagen_url?: string | null };
};

export function ModoCocinaScreen() {
  useKeepAwake();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const recetaId: number = route.params?.recetaId;

  const { receta, extras, cargando, error, recargar } = useDetalleReceta(recetaId);

  const [fase, setFase] = useState<Fase>('preparar');
  const [indicePaso, setIndicePaso] = useState(0);
  const [listos, setListos] = useState<Set<number>>(new Set());
  const [confirmarSalida, setConfirmarSalida] = useState(false);
  const [hojaPreparada, setHojaPreparada] = useState(false);
  const salidaConfirmada = useRef(false);
  const accionPendiente = useRef<any>(null);

  const pasos = useMemo(
    () => [...(receta?.pasos_receta ?? [])].sort((a, b) => a.orden - b.orden),
    [receta?.pasos_receta],
  );
  const porciones: number = route.params?.porciones ?? receta?.porciones_base ?? 1;
  const factor = receta ? porciones / (receta.porciones_base || 1) : 1;
  const ingredientes = useMemo(() => (receta?.receta_ingredientes ?? []) as IngredienteCocina[], [receta]);
  const pasoActual = pasos[indicePaso];
  const duracion = pasoActual?.temporizador_seg ?? 0;

  const ingredientesDelPaso = useMemo(() => {
    if (!pasoActual) return [];
    const texto = normalizar(pasoActual.texto);
    return ingredientes.filter((ri) => {
      const nombre = normalizar(ri.ingredientes.nombre);
      const primera = nombre.split(' ')[0];
      return texto.includes(nombre) || (primera.length > 3 && texto.includes(primera));
    });
  }, [ingredientes, pasoActual]);

  // Pide confirmación al salir a mitad de los pasos (botón X, atrás de Android o gesto)
  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e: any) => {
        if (fase !== 'pasos' || salidaConfirmada.current) return;
        e.preventDefault();
        accionPendiente.current = e.data.action;
        setConfirmarSalida(true);
      }),
    [navigation, fase],
  );

  function salir() {
    salidaConfirmada.current = true;
    setConfirmarSalida(false);
    if (accionPendiente.current) navigation.dispatch(accionPendiente.current);
    else navigation.goBack();
  }

  function alternarListo(id: number) {
    setListos((prev) => {
      const copia = new Set(prev);
      if (copia.has(id)) copia.delete(id);
      else copia.add(id);
      return copia;
    });
  }

  function siguiente() {
    if (indicePaso < pasos.length - 1) setIndicePaso(indicePaso + 1);
    else setFase('final');
  }

  function anterior() {
    if (indicePaso === 0) setFase('preparar');
    else setIndicePaso(indicePaso - 1);
  }

  function cantidadDe(ri: RecetaIngrediente) {
    if (ri.opcional) return 'Opcional';
    if (ri.cantidad_texto && !Number(ri.cantidad)) return ri.cantidad_texto;
    return formatearCantidad(Number(ri.cantidad) * factor, ri.ingredientes.unidad);
  }

  const botonCerrar = (
    <Pressable
      onPress={() => navigation.goBack()}
      style={estilos.botonCerrar}
      accessibilityLabel="Salir del modo cocina"
    >
      <Icono nombre="close-linear" size={22} color={colors.texto} />
    </Pressable>
  );

  if (cargando) {
    return (
      <View style={[estilos.pantalla, { paddingTop: insets.top }]}>
        <VistaCargando mensaje="Preparando tu receta…" />
      </View>
    );
  }

  if (error || !receta) {
    return (
      <View style={[estilos.pantalla, { paddingTop: insets.top + espaciado.sm }]}>
        <View style={estilos.barra}>{botonCerrar}</View>
        <VistaError mensaje={error ?? 'No encontramos la receta.'} onReintentar={recargar} />
      </View>
    );
  }

  if (pasos.length === 0) {
    return (
      <View style={[estilos.pantalla, { paddingTop: insets.top + espaciado.sm }]}>
        <View style={estilos.barra}>{botonCerrar}</View>
        <View style={estilos.centro}>
          <EstadoVacio
                           imagen={require('../assets/images/vacios/receta_sin_pasos.webp')}
            titulo="Esta receta aún no tiene pasos"
            texto="Todavía no hay instrucciones de preparación para esta receta."
            accion={{ texto: 'Volver a la receta', onPress: () => navigation.goBack() }}
          />
        </View>
      </View>
    );
  }

  if (fase === 'preparar') {
    const total = ingredientes.length;
    const datosReceta: { icono: NombreIcono; texto: string; fondo: string; color: string }[] = [
      {
        icono: 'users-group-rounded-linear',
        texto: `${porciones} porc.`,
        fondo: colors.calidoSuave,
        color: colors.calidoOscuro,
      },
      {
        icono: 'clock-circle-linear',
        texto: `${receta.tiempo_min} min`,
        fondo: colors.serenoSuave,
        color: colors.serenoIntenso,
      },
      {
        icono: 'list-check-linear',
        texto: `${pasos.length} ${pasos.length === 1 ? 'paso' : 'pasos'}`,
        fondo: colors.acentoSuave,
        color: colors.acentoOscuro,
      },
    ];
    return (
      <View style={[estilos.pantalla, { paddingTop: insets.top + espaciado.sm }]}>
        <View style={estilos.barra}>
          {botonCerrar}
          <Text style={estilos.nombreReceta} numberOfLines={1}>
            {receta.nombre}
          </Text>
        </View>

        <ScrollView contentContainerStyle={estilos.contenido} showsVerticalScrollIndicator={false}>
          <View style={estilos.portada}>
            <View style={estilos.sombraMascota} />
            <Mascota accion="preparar" tamano={210} />
          </View>
          <Text style={estilos.tituloPortada}>Antes de empezar</Text>
          <Text style={estilos.textoPortada}>Junta todo en tu mesa</Text>

          <View style={estilos.datos}>
            {datosReceta.map((d) => (
              <View key={d.texto} style={[estilos.dato, { backgroundColor: d.fondo }]}>
                <Icono nombre={d.icono} size={16} color={d.color} />
                <Text style={[estilos.textoDato, { color: d.color }]}>{d.texto}</Text>
              </View>
            ))}
          </View>

          {total > 0 && (
            <>
              <View style={estilos.encabezadoLista}>
                <Text style={estilos.tituloLista}>Ingredientes</Text>
                <View style={estilos.contadorPastilla}>
                  <Text style={estilos.textoContador}>
                    {listos.size} de {total}
                  </Text>
                </View>
              </View>

              <View style={estilos.grupo}>
                {ingredientes.map((ri, i) => {
                  const listo = listos.has(ri.ingredientes.id);
                  return (
                    <Pressable
                      key={ri.ingredientes.id}
                      onPress={() => alternarListo(ri.ingredientes.id)}
                      style={[estilos.filaIngrediente, i > 0 && estilos.separador]}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: listo }}
                    >
                      <View style={[estilos.casilla, listo && estilos.casillaLista]}>
                        {listo && <Icono nombre="check-linear" size={16} color={colors.sobrePrimario} />}
                      </View>
                      <IngredienteImagen
                        nombre={ri.ingredientes.nombre}
                        categoria={ri.ingredientes.categoria}
                        url={ri.ingredientes.imagen_url}
                        tamano={44}
                        style={{ borderRadius: 22 }}
                      />
                      <Text style={[estilos.nombreIngrediente, listo && estilos.tachado]} numberOfLines={2}>
                        {ri.ingredientes.nombre}
                      </Text>
                      <Text style={[estilos.cantidad, listo && estilos.tachado]}>{cantidadDe(ri)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          {extras.utensilios.length > 0 && (
            <>
              <Text style={[estilos.tituloLista, { marginTop: espaciado.lg }]}>Utensilios</Text>
              <View style={estilos.chips}>
                {extras.utensilios.map((u, i) => {
                  const tono = TONOS_CHIP[i % TONOS_CHIP.length];
                  return (
                    <View key={u.id} style={[estilos.chip, { backgroundColor: tono.fondo }]}>
                      <Text style={[estilos.textoChip, { color: tono.texto }]}>{u.nombre}</Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>

        <View style={[estilos.pie, { paddingBottom: insets.bottom + espaciado.sm }]}>
          <Pressable
            onPress={() => setFase('pasos')}
            style={[estilos.boton, { flex: 1, backgroundColor: colors.calidoIntenso }]}
            accessibilityRole="button"
          >
            <Icono nombre="play-linear" size={20} color={colors.sobrePrimario} />
            <Text style={estilos.textoBotonClaro}>Empezar a cocinar</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (fase === 'final') {
    return (
      <View style={[estilos.pantalla, { backgroundColor: colors.resaltadoSuave }]}>
        <View style={[estilos.barra, { paddingTop: insets.top + espaciado.sm }]}>{botonCerrar}</View>

        <View style={estilos.final}>
          <Mascota accion="celebrar" tamano={300} />
          <Text style={estilos.tituloFinal}>¡Buen provecho!</Text>
          <Text style={estilos.textoFinal}>
            Terminaste {receta.nombre}. Márcala como preparada y descontamos lo que usaste de tu alacena.
          </Text>
        </View>

        <View style={[estilos.pie, estilos.pieColumna, { paddingBottom: insets.bottom + espaciado.sm }]}>
          <Pressable
            onPress={() => setHojaPreparada(true)}
            style={[estilos.boton, estilos.botonOlivo]}
            accessibilityRole="button"
          >
            <Icono nombre="check-circle-linear" size={20} color={colors.sobreEncabezado} />
            <Text style={estilos.textoBotonClaro}>Ya la preparé</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.goBack()}
            style={[estilos.boton, estilos.botonBorde]}
            accessibilityRole="button"
          >
            <Text style={estilos.textoBotonOscuro}>Volver a la receta</Text>
          </Pressable>
        </View>

        <ModalYaLoPrepare
          visible={hojaPreparada}
          onCerrar={() => setHojaPreparada(false)}
          receta={receta}
          porciones={porciones}
        />
      </View>
    );
  }

  const conTemporizador = duracion > 0;
  const accion = accionDePaso(pasoActual.texto, conTemporizador);
  const tono = COLORES_ACCION[accion];
  const esUltimo = indicePaso === pasos.length - 1;

  return (
    <View style={[estilos.pantalla, { backgroundColor: tono.fondo }]}>
      <View style={[estilos.barra, { paddingTop: insets.top + espaciado.sm }]}>
        {botonCerrar}
        <View style={{ flex: 1 }}>
          <View style={[estilos.pastillaPaso, { backgroundColor: tono.acento }]}>
            <Text style={estilos.textoPaso}>
              Paso {indicePaso + 1} de {pasos.length}
            </Text>
          </View>
          <View style={estilos.segmentos}>
            {pasos.map((p, i) => (
              <View
                key={`${p.orden}-${i}`}
                style={[estilos.segmento, i <= indicePaso && { backgroundColor: tono.acento }]}
              />
            ))}
          </View>
        </View>
      </View>

      <ScrollView
        key={indicePaso}
        contentContainerStyle={[estilos.contenido, estilos.contenidoCentrado]}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: 'center' }}>
          <Mascota accion={accion} tamano={conTemporizador ? 210 : 270} />
        </View>
        <Text style={[estilos.instruccion, conTemporizador && estilos.instruccionChica]}>{pasoActual.texto}</Text>

        {ingredientesDelPaso.length > 0 && (
          <View style={[estilos.chips, { justifyContent: 'center' }]}>
            {ingredientesDelPaso.map((ri) => (
              <View key={ri.ingredientes.id} style={estilos.chipIngrediente}>
                <IngredienteImagen
                  nombre={ri.ingredientes.nombre}
                  categoria={ri.ingredientes.categoria}
                  url={ri.ingredientes.imagen_url}
                  tamano={30}
                  style={{ borderRadius: 15 }}
                />
                <Text style={estilos.textoChip}>
                  {ri.ingredientes.nombre} · {cantidadDe(ri)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {conTemporizador && <Temporizador key={indicePaso} duracion={duracion} />}
      </ScrollView>

      <View style={[estilos.pie, { paddingBottom: insets.bottom + espaciado.sm }]}>
        <Pressable
          onPress={anterior}
          style={[estilos.boton, estilos.botonBorde, { flex: 1 }]}
          accessibilityRole="button"
        >
          <Icono nombre="alt-arrow-left-linear" size={20} color={colors.texto} />
          <Text style={estilos.textoBotonOscuro}>{indicePaso === 0 ? 'Ingredientes' : 'Anterior'}</Text>
        </Pressable>
        <Pressable
          onPress={siguiente}
          style={[estilos.boton, { flex: 1.3, backgroundColor: esUltimo ? colors.encabezado : tono.acento }]}
          accessibilityRole="button"
        >
          <Text style={estilos.textoBotonClaro}>{esUltimo ? 'Terminar' : 'Siguiente'}</Text>
          <Icono nombre={esUltimo ? 'check-linear' : 'alt-arrow-right-linear'} size={20} color={colors.sobrePrimario} />
        </Pressable>
      </View>

      <ConfirmarHoja
        visible={confirmarSalida}
        titulo="¿Salir del modo cocina?"
        mensaje="Perderás en qué paso ibas."
        textoConfirmar="Salir"
        icono="close-circle-linear"
        onConfirmar={salir}
        onCerrar={() => setConfirmarSalida(false)}
      />
    </View>
  );
}

const TONOS_CHIP = [
  { fondo: colors.serenoSuave, texto: colors.serenoIntenso },
  { fondo: colors.acentoSuave, texto: colors.acentoOscuro },
  { fondo: colors.calidoSuave, texto: colors.calidoOscuro },
  { fondo: colors.destacadoSuave, texto: colors.destacadoOscuro },
];

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: espaciado.md,
    paddingBottom: espaciado.sm,
  },
  botonCerrar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nombreReceta: {
    flex: 1,
    fontFamily: fuentes.semibold,
    fontSize: tamanos.cuerpo,
    color: colors.textoSuave,
  },
  pastillaPaso: {
    alignSelf: 'flex-start',
    borderRadius: radios.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
  },
  textoPaso: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.base,
    color: colors.sobrePrimario,
  },
  segmentos: {
    flexDirection: 'row',
    gap: 5,
  },
  segmento: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  contenido: {
    paddingHorizontal: espaciado.md,
    paddingTop: espaciado.sm,
    paddingBottom: espaciado.xl,
  },
  contenidoCentrado: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  centro: {
    flex: 1,
    justifyContent: 'center',
  },
  portada: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: espaciado.sm,
  },
  sombraMascota: {
    position: 'absolute',
    bottom: 8,
    width: 170,
    height: 30,
    borderRadius: 85,
    backgroundColor: colors.resaltadoSuave,
  },
  tituloPortada: {
    fontFamily: fuentes.titulo,
    fontSize: 29,
    lineHeight: 37,
    color: colors.texto,
    textAlign: 'center',
    marginTop: espaciado.xs,
  },
  textoPortada: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.cuerpo,
    color: colors.textoSuave,
    textAlign: 'center',
    marginTop: 2,
  },
  datos: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: espaciado.md,
  },
  dato: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radios.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  textoDato: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.base,
  },
  encabezadoLista: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: espaciado.lg,
    marginBottom: espaciado.sm,
  },
  tituloLista: {
    fontFamily: fuentes.titulo,
    fontSize: 20,
    lineHeight: 27,
    color: colors.texto,
  },
  contadorPastilla: {
    backgroundColor: colors.calidoSuave,
    borderRadius: radios.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  textoContador: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.chico,
    color: colors.calidoOscuro,
  },
  grupo: {
    backgroundColor: colors.superficie,
    borderRadius: radios.lg,
    overflow: 'hidden',
  },
  filaIngrediente: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 66,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  separador: {
    borderTopWidth: 1,
    borderTopColor: colors.borde,
  },
  casilla: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.borde,
    alignItems: 'center',
    justifyContent: 'center',
  },
  casillaLista: {
    backgroundColor: colors.calidoIntenso,
    borderColor: colors.calidoIntenso,
  },
  nombreIngrediente: {
    flex: 1,
    fontFamily: fuentes.semibold,
    fontSize: tamanos.cuerpo,
    color: colors.texto,
  },
  cantidad: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.base,
    color: colors.textoSuave,
  },
  tachado: {
    color: colors.textoTenue,
    textDecorationLine: 'line-through',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: espaciado.md,
  },
  chip: {
    borderRadius: radios.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipIngrediente: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.superficie,
    borderRadius: radios.pill,
    paddingLeft: 5,
    paddingRight: 14,
    paddingVertical: 5,
  },
  textoChip: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.base,
    color: colors.texto,
  },
  instruccion: {
    fontFamily: fuentes.titulo,
    fontSize: 25,
    lineHeight: 35,
    color: colors.texto,
    textAlign: 'center',
    marginTop: espaciado.sm,
  },
  instruccionChica: {
    fontSize: 22,
    lineHeight: 31,
  },
  final: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espaciado.lg,
  },
  tituloFinal: {
    fontFamily: fuentes.titulo,
    fontSize: 31,
    lineHeight: 39,
    color: colors.texto,
    marginTop: espaciado.sm,
  },
  textoFinal: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.destacado,
    lineHeight: 24,
    color: colors.textoSuave,
    textAlign: 'center',
    marginTop: espaciado.sm,
  },
  pie: {
    flexDirection: 'row',
    gap: espaciado.sm,
    backgroundColor: colors.superficie,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: espaciado.md,
    paddingTop: espaciado.md,
  },
  pieColumna: {
    flexDirection: 'column',
  },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 56,
    borderRadius: radios.pill,
  },
  botonOlivo: {
    backgroundColor: colors.encabezado,
  },
  botonBorde: {
    borderWidth: 1.5,
    borderColor: colors.borde,
    backgroundColor: colors.superficie,
  },
  textoBotonClaro: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.sobrePrimario,
  },
  textoBotonOscuro: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.texto,
  },
});
