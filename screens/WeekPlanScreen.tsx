import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import {
  fechaDesdeTexto,
  formatearFechaLocal,
  inicioDeSemana,
  sumarDias,
  useWeeklyPlanner,
} from '../hooks/useWeeklyPlanner';
import { usePreparadasHoy } from '../hooks/usePreparadasHoy';
import { Esqueleto } from '../components/Esqueleto';
import { VistaError } from '../components/StateViews';
import { EstadoVacio } from '../components/EstadoVacio';
import { MenuHoja } from '../components/MenuHoja';
import { ConfirmarHoja } from '../components/ConfirmarHoja';
import Icono, { NombreIcono } from '../components/Icono';
import { TarjetaPlan } from '../components/plan/TarjetaPlan';
import { HojaElegirReceta } from '../components/plan/HojaElegirReceta';
import { HojaCalendario } from '../components/plan/HojaCalendario';
import { MomentoComida, PlanSemanalItem, RecetaResumen } from '../types/database';
import { colors, espaciado, fuentes, radios, tamanos } from '../theme/theme';

const LETRAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const MOMENTOS: { clave: MomentoComida; titulo: string; icono: NombreIcono; fondo: string; color: string }[] = [
  { clave: 'desayuno', titulo: 'Desayuno', icono: 'sun-linear', fondo: colors.resaltadoSuave, color: colors.calidoOscuro },
  { clave: 'comida', titulo: 'Comida', icono: 'plate-linear', fondo: colors.calidoSuave, color: colors.calidoIntenso },
  { clave: 'cena', titulo: 'Cena', icono: 'moon-linear', fondo: colors.serenoSuave, color: colors.serenoIntenso },
  { clave: 'bebida', titulo: 'Bebidas', icono: 'tea-cup-linear', fondo: colors.destacadoSuave, color: colors.destacadoIntenso },
];

type Hoja = 'elegir' | 'opciones' | 'quitar' | 'calendario' | null;

export function WeekPlanScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const fechaParam: string | undefined = route.params?.fechaInicial;
  const [seleccionada, setSeleccionada] = useState<Date>(() =>
    fechaParam ? fechaDesdeTexto(fechaParam) : new Date()
  );

  useEffect(() => {
    if (fechaParam) setSeleccionada(fechaDesdeTexto(fechaParam));
  }, [fechaParam]);

  const lunes = useMemo(() => inicioDeSemana(seleccionada), [seleccionada]);
  const { items, cargando, error, recargar, guardarReceta, eliminarItem } = useWeeklyPlanner(lunes);
  const { ids: preparadasHoy, recargar: recargarPreparadas } = usePreparadasHoy();

  const [hoja, setHoja] = useState<Hoja>(null);
  const [momentoActivo, setMomentoActivo] = useState<MomentoComida>('comida');
  const [itemActivo, setItemActivo] = useState<PlanSemanalItem | null>(null);
  const [quitando, setQuitando] = useState(false);
  const [refrescando, setRefrescando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      recargar();
      recargarPreparadas();
    }, [recargar, recargarPreparadas])
  );

  const semana = useMemo(() => Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i)), [lunes]);
  const textoHoy = formatearFechaLocal(new Date());
  const textoSeleccionada = formatearFechaLocal(seleccionada);
  const esHoy = textoSeleccionada === textoHoy;
  const delDia = items.filter((i) => i.fecha === textoSeleccionada);
  const comidasPlaneadas = items.filter((i) => i.momento !== 'bebida').length;

  const fin = semana[6];
  const rango =
    lunes.getMonth() === fin.getMonth()
      ? `${lunes.getDate()} – ${fin.getDate()} ${MESES[fin.getMonth()]}`
      : `${lunes.getDate()} ${MESES[lunes.getMonth()]} – ${fin.getDate()} ${MESES[fin.getMonth()]}`;
  const semanaActual = formatearFechaLocal(lunes) === formatearFechaLocal(inicioDeSemana(new Date()));

  function cambiarHoja(siguiente: Hoja) {
    setHoja(null);
    setTimeout(() => setHoja(siguiente), 300);
  }

  function abrirElegir(momento: MomentoComida, item: PlanSemanalItem | null = null) {
    setMomentoActivo(momento);
    setItemActivo(item);
    setHoja('elegir');
  }

  function abrirOpciones(item: PlanSemanalItem) {
    setItemActivo(item);
    setMomentoActivo(item.momento);
    setHoja('opciones');
  }

  async function elegir(receta: RecetaResumen) {
    let ok: boolean;
    if (itemActivo && momentoActivo === 'bebida') {
      ok = await eliminarItem(itemActivo.id);
      if (ok) ok = await guardarReceta(textoSeleccionada, 'bebida', receta.id);
    } else {
      ok = await guardarReceta(textoSeleccionada, momentoActivo, receta.id);
    }
    if (ok) {
      setHoja(null);
      setItemActivo(null);
    }
    return ok;
  }

  async function confirmarQuitar() {
    if (!itemActivo) return;
    setQuitando(true);
    await eliminarItem(itemActivo.id);
    setQuitando(false);
    setItemActivo(null);
    setHoja(null);
  }

  async function refrescar() {
    setRefrescando(true);
    try {
      await Promise.all([recargar(), recargarPreparadas()]);
    } finally {
      setRefrescando(false);
    }
  }

  const tituloMomento = MOMENTOS.find((m) => m.clave === momentoActivo)?.titulo ?? '';
  const nombreDia = `${DIAS[seleccionada.getDay()]} ${seleccionada.getDate()}`;

  function contenidoMomento(momento: (typeof MOMENTOS)[number]) {
    const elementos = delDia.filter((i) => i.momento === momento.clave);
    const vacio = (
      <Pressable onPress={() => abrirElegir(momento.clave)} style={estilos.agregar} accessibilityRole="button">
        <Icono nombre="add-circle-linear" size={22} color={colors.encabezado} />
        <Text style={estilos.textoAgregar}>
          Agregar {momento.clave === 'bebida' ? 'bebida' : momento.titulo.toLowerCase()}
        </Text>
      </Pressable>
    );

    if (momento.clave === 'bebida') {
      return (
        <View style={{ gap: espaciado.sm }}>
          {elementos.map((item) => (
            <TarjetaPlan
              key={item.id}
              item={item}
              compacta
              onAbrir={() => navigation.navigate('RecetaDetalle', { recetaId: item.receta_id })}
              onOpciones={() => abrirOpciones(item)}
            />
          ))}
          {vacio}
        </View>
      );
    }

    const item = elementos[0];
    if (!item) return vacio;
    return (
      <TarjetaPlan
        item={item}
        cocinada={esHoy && preparadasHoy.has(item.receta_id)}
        onAbrir={() => navigation.navigate('RecetaDetalle', { recetaId: item.receta_id })}
        onOpciones={() => abrirOpciones(item)}
      />
    );
  }

  return (
    <View style={estilos.pantalla}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[estilos.contenido, { paddingTop: insets.top + espaciado.sm }]}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={colors.primario} colors={[colors.primario]} />
        }
      >
        <View style={estilos.superior}>
          <Pressable onPress={() => navigation.goBack()} style={estilos.botonBlanco} accessibilityLabel="Regresar">
            <Icono nombre="arrow-left-linear" size={22} color={colors.texto} />
          </Pressable>
          <View style={estilos.navegacion}>
            <Pressable onPress={() => setSeleccionada((f) => sumarDias(f, -7))} hitSlop={10} accessibilityLabel="Semana anterior">
              <Icono nombre="alt-arrow-left-linear" size={22} color={colors.textoSuave} />
            </Pressable>
            <Text style={estilos.rango}>{rango}</Text>
            <Pressable onPress={() => setSeleccionada((f) => sumarDias(f, 7))} hitSlop={10} accessibilityLabel="Semana siguiente">
              <Icono nombre="alt-arrow-right-linear" size={22} color={colors.textoSuave} />
            </Pressable>
          </View>
          <Pressable onPress={() => setHoja('calendario')} style={estilos.botonBlanco} accessibilityLabel="Abrir calendario">
            <Icono nombre="calendar-linear" size={22} color={colors.texto} />
          </Pressable>
        </View>

        <View style={estilos.filaTitulo}>
          <View style={{ flex: 1 }}>
            <Text style={estilos.titulo}>Tu semana</Text>
            {!cargando && (
              <Text style={estilos.resumen}>
                {comidasPlaneadas} de 21 comidas planeadas
              </Text>
            )}
          </View>
          {!semanaActual && (
            <Pressable onPress={() => setSeleccionada(new Date())} style={estilos.botonHoy}>
              <Text style={estilos.textoHoy}>Hoy</Text>
            </Pressable>
          )}
        </View>

        <View style={estilos.tira}>
          {semana.map((fecha, i) => {
            const texto = formatearFechaLocal(fecha);
            const elegido = texto === textoSeleccionada;
            const pasado = texto < textoHoy;
            const cuantas = Math.min(items.filter((it) => it.fecha === texto && it.momento !== 'bebida').length, 3);
            return (
              <Pressable
                key={texto}
                onPress={() => setSeleccionada(fecha)}
                style={[estilos.dia, elegido && estilos.diaElegido, pasado && !elegido && estilos.diaPasado]}
                accessibilityRole="button"
                accessibilityState={{ selected: elegido }}
                accessibilityLabel={`${DIAS[fecha.getDay()]} ${fecha.getDate()}, ${cuantas} comidas`}
              >
                <Text style={[estilos.letra, elegido && estilos.textoElegido]}>{LETRAS[i]}</Text>
                <Text style={[estilos.numero, elegido && estilos.textoElegido]}>{fecha.getDate()}</Text>
                <View style={estilos.puntos}>
                  {cuantas === 0 ? (
                    <View style={[estilos.punto, estilos.puntoVacio, elegido && { borderColor: colors.sobreEncabezado }]} />
                  ) : (
                    Array.from({ length: cuantas }).map((_, j) => (
                      <View key={j} style={[estilos.punto, { backgroundColor: elegido ? colors.sobreEncabezado : colors.calido }]} />
                    ))
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={estilos.encabezadoDia}>
          <Text style={estilos.nombreDia}>{nombreDia}</Text>
          {esHoy && <Text style={estilos.etiquetaHoy}>Hoy</Text>}
        </View>

        {cargando && items.length === 0 ? (
          <View style={{ paddingHorizontal: espaciado.md, gap: espaciado.md }}>
            <Esqueleto ancho="100%" alto={64} radio={20} />
            <Esqueleto ancho="100%" alto={160} radio={20} />
            <Esqueleto ancho="100%" alto={160} radio={20} />
          </View>
        ) : error && items.length === 0 ? (
          <VistaError mensaje="No pudimos cargar tu semana." onReintentar={recargar} />
        ) : (
          <>
            {items.length === 0 && (
              <EstadoVacio
                compacto
                imagen={require('../assets/images/vacios/tabla_menu.webp')}
                titulo="Aún no planeas esta semana"
                texto="Elige un día y toca «Agregar» para decidir qué cocinar."
              />
            )}
            {MOMENTOS.map((momento, i) => (
              <View key={momento.clave} style={estilos.filaMomento}>
                <View style={estilos.eje}>
                  <View style={[estilos.circulo, { backgroundColor: momento.fondo }]}>
                    <Icono nombre={momento.icono} size={20} color={momento.color} />
                  </View>
                  <Text style={estilos.textoMomento}>{momento.titulo}</Text>
                  {i < MOMENTOS.length - 1 && <View style={estilos.linea} />}
                </View>
                <View style={estilos.contenidoMomento}>{contenidoMomento(momento)}</View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <HojaElegirReceta
        visible={hoja === 'elegir'}
        titulo={itemActivo ? 'Cambiar receta' : `Agregar ${tituloMomento.toLowerCase()}`}
        subtitulo={`${nombreDia} · ${tituloMomento}`}
        error={hoja === 'elegir' ? error : null}
        onElegir={elegir}
        onCerrar={() => {
          setHoja(null);
          setItemActivo(null);
        }}
      />
      <MenuHoja
        visible={hoja === 'opciones'}
        titulo={itemActivo?.recetas.nombre}
        opciones={[
          {
            texto: 'Ver receta',
            icono: 'book-outline',
            onPress: () => {
              setHoja(null);
              if (itemActivo) navigation.navigate('RecetaDetalle', { recetaId: itemActivo.receta_id });
            },
          },
          { texto: 'Cambiar receta', icono: 'swap-horizontal-outline', onPress: () => cambiarHoja('elegir') },
          { texto: 'Quitar del plan', icono: 'trash-outline', peligro: true, onPress: () => cambiarHoja('quitar') },
        ]}
        onCerrar={() => {
          setHoja(null);
          setItemActivo(null);
        }}
      />
      <ConfirmarHoja
        visible={hoja === 'quitar'}
        titulo="¿Quitar del plan?"
        mensaje={itemActivo ? `${itemActivo.recetas.nombre} saldrá de tu ${tituloMomento.toLowerCase()} del ${nombreDia.toLowerCase()}.` : ''}
        textoConfirmar="Quitar"
        icono="remove-circle-outline"
        cargando={quitando}
        onConfirmar={confirmarQuitar}
        onCerrar={() => {
          setHoja(null);
          setItemActivo(null);
        }}
      />
      <HojaCalendario
        visible={hoja === 'calendario'}
        seleccionada={seleccionada}
        onElegir={(fecha) => {
          setSeleccionada(fecha);
          setHoja(null);
        }}
        onCerrar={() => setHoja(null)}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  contenido: {
    paddingBottom: 120,
  },
  superior: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: espaciado.md,
  },
  botonBlanco: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navegacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
  },
  rango: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.cuerpo,
    color: colors.texto,
    minWidth: 110,
    textAlign: 'center',
  },
  filaTitulo: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: espaciado.md,
    marginTop: espaciado.md,
  },
  titulo: {
    fontFamily: fuentes.titulo,
    fontSize: 31,
    lineHeight: 39,
    color: colors.texto,
  },
  resumen: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.base,
    color: colors.textoSuave,
  },
  botonHoy: {
    minHeight: 40,
    paddingHorizontal: espaciado.md,
    borderRadius: radios.pill,
    backgroundColor: colors.resaltadoSuave,
    justifyContent: 'center',
  },
  textoHoy: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.base,
    color: colors.calidoOscuro,
  },
  tira: {
    flexDirection: 'row',
    gap: 4,
    marginHorizontal: espaciado.md,
    marginTop: espaciado.md,
    backgroundColor: colors.superficie,
    borderRadius: radios.pill,
    padding: 4,
  },
  dia: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: espaciado.sm,
    borderRadius: radios.pill,
  },
  diaElegido: {
    backgroundColor: colors.encabezado,
  },
  diaPasado: {
    opacity: 0.45,
  },
  letra: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.mini,
    color: colors.textoSuave,
  },
  numero: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.grande,
    color: colors.texto,
    marginTop: 2,
  },
  textoElegido: {
    color: colors.sobreEncabezado,
  },
  puntos: {
    flexDirection: 'row',
    gap: 2,
    height: 6,
    marginTop: 4,
  },
  punto: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  puntoVacio: {
    borderWidth: 1,
    borderColor: colors.textoTenue,
  },
  encabezadoDia: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: espaciado.md,
    marginTop: espaciado.lg,
    marginBottom: espaciado.md,
  },
  nombreDia: {
    fontFamily: fuentes.titulo,
    fontSize: 21,
    lineHeight: 28,
    color: colors.texto,
  },
  etiquetaHoy: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.base,
    color: colors.acentoIntenso,
  },
  filaMomento: {
    flexDirection: 'row',
    gap: espaciado.sm,
    paddingHorizontal: espaciado.md,
  },
  eje: {
    width: 64,
    alignItems: 'center',
  },
  circulo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoMomento: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.mini,
    color: colors.textoSuave,
    marginTop: 4,
  },
  linea: {
    flex: 1,
    width: 2,
    backgroundColor: colors.borde,
    marginTop: 6,
    marginBottom: 2,
  },
  contenidoMomento: {
    flex: 1,
    paddingBottom: espaciado.lg,
  },
  agregar: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.textoTenue,
  },
  textoAgregar: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.cuerpo,
    color: colors.textoSuave,
  },
});
