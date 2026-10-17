import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icono from '../Icono';
import { SearchBar } from '../SearchBar';
import { AvisoHost } from '../AvisoHost';
import { useIngredientes } from '../../hooks/useIngredientes';
import { usePaquetesBamx } from '../../hooks/usePaquetesBamx';
import { EntradaAlacena, IngredienteCatalogo, PaqueteBamx, ResultadoAccion } from '../../types/alacena';
import {
  UnidadUI,
  aBase,
  convertirUI,
  desdeBase,
  formatearCantidad,
  formatearUI,
  opcionesUnidad,
  pasoUI,
  valorInicialUI,
} from '../../lib/unidades';
import { etiquetaPasillo, normalizar, ordenPasillo } from '../../constants/categorias';
import { mostrarAviso } from '../../lib/avisos';
import { LIMITES } from '../../lib/entradas';
import { ChipsFiltro } from './chipsFiltro';
import { SelectorUnidad } from './selectorUnidad';
import { Stepper } from './stepper';
import { IngredienteImagen } from './ingredienteImagen';
import { colors, espaciado, fuentes, radios, tamanos } from '../../theme/theme';

interface Props {
  visible: boolean;
  onCerrar: () => void;
  onConfirmar: (entradas: EntradaAlacena[]) => Promise<ResultadoAccion>;
}

type Elegido = { valor: number; unidad: UnidadUI };
type FilaPaquete = PaqueteBamx['paquete_bamx_ingredientes'][number];

const COLUMNAS = 3;

function cantidadInicial(ing: IngredienteCatalogo, fila?: FilaPaquete): Elegido {
  if (fila && fila.cantidad > 0) return desdeBase(fila.cantidad, ing.unidad);
  const unidad = opcionesUnidad(ing.unidad)[0];
  return { valor: valorInicialUI(unidad), unidad };
}

function enFilas<T>(lista: T[]): T[][] {
  const filas: T[][] = [];
  for (let i = 0; i < lista.length; i += COLUMNAS) filas.push(lista.slice(i, i + COLUMNAS));
  return filas;
}

export function AgregarIngredienteModal({ visible, onCerrar, onConfirmar }: Props) {
  const insets = useSafeAreaInsets();
  const { ingredientes, categorias, cargando, error, recargar } = useIngredientes(visible);
  const { paquetes, cargando: cargandoPaquetes } = usePaquetesBamx(visible);

  const [paso, setPaso] = useState<'elegir' | 'cantidades'>('elegir');
  const [filtro, setFiltro] = useState('todo');
  const [busqueda, setBusqueda] = useState('');
  const [versionBuscador, setVersionBuscador] = useState(0);
  const [seleccion, setSeleccion] = useState<Record<number, Elegido>>({});
  const [paqueteId, setPaqueteId] = useState<number | null>(null);
  const [eligiendoPaquete, setEligiendoPaquete] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setPaso('elegir');
    setFiltro('todo');
    setBusqueda('');
    setVersionBuscador((v) => v + 1);
    setSeleccion({});
    setPaqueteId(null);
    setEligiendoPaquete(false);
    setGuardando(false);
  }, [visible]);

  const paquete = paquetes.find((p) => p.id === paqueteId) ?? null;

  const filasPaquete = useMemo(
    () => new Map<number, FilaPaquete>((paquete?.paquete_bamx_ingredientes ?? []).map((f) => [f.ingrediente_id, f])),
    [paquete]
  );

  const catalogo = useMemo(() => {
    const mapa = new Map<number, IngredienteCatalogo>(ingredientes.map((i) => [i.id, i]));
    paquete?.paquete_bamx_ingredientes.forEach((f) => {
      if (!mapa.has(f.ingrediente_id)) mapa.set(f.ingrediente_id, f.ingredientes);
    });
    return mapa;
  }, [ingredientes, paquete]);

  const idsElegidos = Object.keys(seleccion).map(Number);
  const total = idsElegidos.length;
  const buscando = busqueda.trim().length > 0;
  const marcadosDelPaquete = idsElegidos.filter((id) => filasPaquete.has(id)).length;

  const secciones = useMemo(() => {
    const q = normalizar(busqueda);
    const lista = Array.from(catalogo.values()).filter((i) => {
      if (q) return normalizar(i.nombre).includes(q);
      if (filtro === 'elegidos') return seleccion[i.id] != null;
      if (filtro === 'todo') return true;
      return (i.categoria ?? 'Otros') === filtro;
    });

    const grupos = new Map<string, IngredienteCatalogo[]>();
    lista.forEach((i) => {
      const clave = i.categoria ?? 'Otros';
      grupos.set(clave, [...(grupos.get(clave) ?? []), i]);
    });

    return Array.from(grupos.entries())
      .sort(([a], [b]) => ordenPasillo(a) - ordenPasillo(b) || a.localeCompare(b, 'es'))
      .map(([categoria, items]) => ({
        titulo: etiquetaPasillo(categoria),
        data: enFilas([...items].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))),
      }));
  }, [catalogo, busqueda, filtro, seleccion]);

  const elegidos = useMemo(
    () =>
      idsElegidos
        .map((id) => catalogo.get(id))
        .filter((i): i is IngredienteCatalogo => !!i)
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    [seleccion, catalogo]
  );

  function sinPaquete(prev: Record<number, Elegido>): Record<number, Elegido> {
    const copia = { ...prev };
    filasPaquete.forEach((_, id) => delete copia[id]);
    return copia;
  }

  function aplicarPaquete(p: PaqueteBamx) {
    setSeleccion((prev) => {
      const copia = sinPaquete(prev);
      p.paquete_bamx_ingredientes.forEach((f) => {
        copia[f.ingrediente_id] = cantidadInicial(f.ingredientes, f);
      });
      return copia;
    });
    setPaqueteId(p.id);
    setEligiendoPaquete(false);
  }

  function quitarPaquete() {
    setSeleccion(sinPaquete);
    setPaqueteId(null);
  }

  function tocarBamx() {
    if (cargandoPaquetes) return;
    if (paquetes.length === 0) {
      mostrarAviso('Sin despensas por ahora', 'Cuando BAMX publique una despensa la verás aquí.');
      return;
    }
    if (paquetes.length === 1) aplicarPaquete(paquetes[0]);
    else setEligiendoPaquete((v) => !v);
  }

  function alternar(ing: IngredienteCatalogo) {
    setSeleccion((prev) => {
      const copia = { ...prev };
      if (copia[ing.id]) delete copia[ing.id];
      else copia[ing.id] = cantidadInicial(ing, filasPaquete.get(ing.id));
      return copia;
    });
  }

  function quitar(id: number) {
    if (total === 1) setPaso('elegir');
    setSeleccion((prev) => {
      const copia = { ...prev };
      delete copia[id];
      return copia;
    });
  }

  function cambiarValor(id: number, delta: number) {
    setSeleccion((prev) => {
      const actual = prev[id];
      if (!actual) return prev;
      const nuevo = Math.max(pasoUI(actual.unidad), Math.round((actual.valor + delta) * 100) / 100);
      return { ...prev, [id]: { ...actual, valor: nuevo } };
    });
  }

  function cambiarUnidad(id: number, unidad: UnidadUI) {
    setSeleccion((prev) => {
      const actual = prev[id];
      if (!actual || actual.unidad === unidad) return prev;
      const valor = Math.max(pasoUI(unidad), convertirUI(actual.valor, actual.unidad, unidad));
      return { ...prev, [id]: { valor, unidad } };
    });
  }

  function atras() {
    if (paso === 'cantidades') setPaso('elegir');
    else onCerrar();
  }

  async function confirmar() {
    if (total === 0 || guardando) return;
    setGuardando(true);
    const entradas: EntradaAlacena[] = Object.entries(seleccion).map(([id, s]) => ({
      ingrediente_id: Number(id),
      cantidad: aBase(s.valor, s.unidad),
    }));
    const resultado = await onConfirmar(entradas);
    setGuardando(false);
    if (resultado.ok) onCerrar();
    else mostrarAviso('No se pudo agregar', resultado.mensaje ?? 'Intenta de nuevo.');
  }

  function tarjetaBamx() {
    if (paquete) {
      return (
        <View style={estilos.bamxAplicado}>
          <View style={estilos.circuloBamxClaro}>
            <Icono nombre="box-linear" size={22} color={colors.encabezado} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={estilos.tituloBamxAplicado} numberOfLines={1}>
              {paquete.nombre}
            </Text>
            <Text style={estilos.textoBamxAplicado}>
              {marcadosDelPaquete} de {filasPaquete.size} marcados
            </Text>
          </View>
          <Pressable onPress={quitarPaquete} hitSlop={10} style={estilos.botonQuitarBamx}>
            <Text style={estilos.textoQuitarBamx}>Quitar</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <Pressable
        onPress={tocarBamx}
        style={({ pressed }) => [estilos.bamx, pressed && { opacity: 0.9 }]}
        accessibilityRole="button"
      >
        <View style={estilos.circuloBamx}>
          <Icono nombre="box-linear" size={24} color={colors.sobreEncabezado} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={estilos.tituloBamx}>Recibí mi despensa BAMX</Text>
          <Text style={estilos.textoBamx}>Marcamos lo que trae y tú lo ajustas</Text>
        </View>
        {cargandoPaquetes ? (
          <ActivityIndicator color={colors.sobreEncabezado} />
        ) : (
          <Icono
            nombre={eligiendoPaquete ? 'alt-arrow-up-linear' : 'alt-arrow-right-linear'}
            size={22}
            color={colors.sobreEncabezado}
          />
        )}
      </Pressable>
    );
  }

  const encabezadoLista = (
    <View>
      <View style={estilos.bloque}>
        {tarjetaBamx()}
        {eligiendoPaquete && !paquete && (
          <View style={estilos.paquetes}>
            <Text style={estilos.ayuda}>¿Cuál despensa recibiste?</Text>
            {paquetes.map((p) => (
              <Pressable key={p.id} onPress={() => aplicarPaquete(p)} style={estilos.paquete}>
                <View style={{ flex: 1 }}>
                  <Text style={estilos.nombrePaquete}>{p.nombre}</Text>
                  {!!p.descripcion && <Text style={estilos.ayuda}>{p.descripcion}</Text>}
                </View>
                <Icono nombre="alt-arrow-right-linear" size={20} color={colors.textoSuave} />
              </Pressable>
            ))}
          </View>
        )}
        <View style={{ marginTop: espaciado.md }}>
          <SearchBar
            key={versionBuscador}
            placeholder="Jitomate, frijol, avena…"
            onBuscar={setBusqueda}
          />
        </View>
      </View>

      {!buscando && categorias.length > 0 && (
        <View style={{ marginTop: espaciado.md }}>
          <ChipsFiltro
            opciones={[
              { clave: 'todo', etiqueta: 'Todo' },
              ...(total > 0 ? [{ clave: 'elegidos', etiqueta: `Elegidos (${total})` }] : []),
              ...categorias.map((c) => ({ clave: c, etiqueta: etiquetaPasillo(c) })),
            ]}
            seleccionada={filtro === 'elegidos' && total === 0 ? 'todo' : filtro}
            onSeleccionar={setFiltro}
          />
        </View>
      )}
    </View>
  );

  function mosaico(ing: IngredienteCatalogo) {
    const elegido = seleccion[ing.id] != null;
    const deBamx = filasPaquete.has(ing.id);
    return (
      <Pressable
        key={ing.id}
        onPress={() => alternar(ing)}
        style={[estilos.mosaico, elegido && estilos.mosaicoElegido]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: elegido }}
        accessibilityLabel={ing.nombre}
      >
        {deBamx && (
          <View style={estilos.etiquetaBamx}>
            <Text style={estilos.textoEtiquetaBamx}>BAMX</Text>
          </View>
        )}
        {elegido && (
          <View style={estilos.palomita}>
            <Icono nombre="check-linear" size={14} color={colors.sobreEncabezado} />
          </View>
        )}
        <IngredienteImagen
          nombre={ing.nombre}
          categoria={ing.categoria}
          url={ing.imagen_url}
          tamano={60}
          style={{ borderRadius: 30 }}
        />
        <Text style={estilos.nombreMosaico} numberOfLines={2}>
          {ing.nombre}
        </Text>
      </Pressable>
    );
  }

  function pasoElegir() {
    if (cargando) {
      return (
        <View style={estilos.centro}>
          <ActivityIndicator size="large" color={colors.encabezado} />
        </View>
      );
    }
    if (error) {
      return (
        <View style={estilos.centro}>
          <Text style={estilos.textoError}>{error}</Text>
          <Pressable onPress={recargar} style={estilos.botonReintentar}>
            <Text style={estilos.textoReintentar}>Reintentar</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <SectionList
        sections={secciones}
        keyExtractor={(fila) => fila.map((i) => i.id).join('-')}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: espaciado.lg }}
        ListHeaderComponent={encabezadoLista}
        extraData={seleccion}
        renderSectionHeader={({ section }) => <Text style={estilos.tituloSeccion}>{section.titulo}</Text>}
        renderItem={({ item: fila }) => (
          <View style={estilos.filaMosaicos}>
            {fila.map(mosaico)}
            {Array.from({ length: COLUMNAS - fila.length }, (_, i) => (
              <View key={`hueco${i}`} style={estilos.hueco} />
            ))}
          </View>
        )}
        ListEmptyComponent={
          <Text style={estilos.vacio}>
            {buscando ? `No encontramos «${busqueda.trim()}».` : 'No hay ingredientes aquí.'}
          </Text>
        }
      />
    );
  }

  function pasoCantidades() {
    return (
      <FlatList
        data={elegidos}
        keyExtractor={(i) => String(i.id)}
        extraData={seleccion}
        contentContainerStyle={{ padding: espaciado.md, paddingBottom: espaciado.lg }}
        renderItem={({ item: ing }) => {
          const sel = seleccion[ing.id];
          if (!sel) return null;
          const fila = filasPaquete.get(ing.id);
          const incremento = pasoUI(sel.unidad);
          return (
            <View style={estilos.tarjetaCantidad}>
              <View style={estilos.filaNombre}>
                <IngredienteImagen
                  nombre={ing.nombre}
                  categoria={ing.categoria}
                  url={ing.imagen_url}
                  tamano={48}
                  style={{ borderRadius: 24 }}
                />
                <View style={{ flex: 1 }}>
                  <View style={estilos.nombreConEtiqueta}>
                    <Text style={estilos.nombreCantidad} numberOfLines={1}>
                      {ing.nombre}
                    </Text>
                    {fila && (
                      <View style={estilos.etiquetaBamxFila}>
                        <Text style={estilos.textoEtiquetaBamx}>BAMX</Text>
                      </View>
                    )}
                  </View>
                  {fila?.variable && (
                    <Text style={estilos.ayuda}>Suele traer aprox. {formatearCantidad(fila.cantidad, ing.unidad)}</Text>
                  )}
                </View>
                <Pressable onPress={() => quitar(ing.id)} hitSlop={10} accessibilityLabel={`Quitar ${ing.nombre}`}>
                  <Icono nombre="close-linear" size={22} color={colors.textoTenue} />
                </Pressable>
              </View>

              <View style={estilos.filaControles}>
                <Stepper
                  compacto
                  texto={formatearUI(sel.valor, sel.unidad)}
                  menosDeshabilitado={sel.valor - incremento < incremento}
                  onMenos={() => cambiarValor(ing.id, -incremento)}
                  onMas={() => cambiarValor(ing.id, incremento)}
                />
                <SelectorUnidad
                  opciones={opcionesUnidad(ing.unidad)}
                  seleccionada={sel.unidad}
                  onCambiar={(u) => cambiarUnidad(ing.id, u)}
                />
              </View>
            </View>
          );
        }}
      />
    );
  }

  const enCantidades = paso === 'cantidades';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={atras} statusBarTranslucent>
      <View style={[estilos.pantalla, { paddingTop: insets.top + espaciado.sm }]}>
        <View style={estilos.barra}>
          <Pressable
            onPress={atras}
            style={estilos.botonBarra}
            accessibilityLabel={enCantidades ? 'Regresar' : 'Cerrar'}
          >
            <Icono nombre={enCantidades ? 'arrow-left-linear' : 'close-linear'} size={22} color={colors.texto} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={estilos.titulo}>{enCantidades ? '¿Cuánto tienes?' : 'Agregar ingredientes'}</Text>
            {enCantidades && !!paquete && (
              <Text style={estilos.ayuda}>Ya pusimos lo que trae tu despensa</Text>
            )}
          </View>
        </View>

        <View style={{ flex: 1 }}>{enCantidades ? pasoCantidades() : pasoElegir()}</View>

        <View style={[estilos.pie, { paddingBottom: insets.bottom + espaciado.sm }]}>
          <Pressable
            onPress={enCantidades ? confirmar : () => setPaso('cantidades')}
            disabled={total === 0 || guardando}
            style={[estilos.botonPrincipal, (total === 0 || guardando) && estilos.botonInactivo]}
          >
            {guardando ? (
              <ActivityIndicator color={colors.sobreEncabezado} />
            ) : (
              <Text style={estilos.textoBotonPrincipal}>
                {total === 0
                  ? 'Elige tus ingredientes'
                  : enCantidades
                  ? 'Guardar en mi alacena'
                  : `Continuar (${total})`}
              </Text>
            )}
          </Pressable>
        </View>
        <AvisoHost />
      </View>
    </Modal>
  );
}

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
  botonBarra: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontFamily: fuentes.titulo,
    fontSize: 23,
    lineHeight: 30,
    color: colors.texto,
  },
  ayuda: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.chico,
    lineHeight: 19,
    color: colors.textoSuave,
  },
  bloque: {
    paddingHorizontal: espaciado.md,
    paddingTop: espaciado.sm,
  },
  bamx: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.encabezado,
    borderRadius: 20,
    padding: 14,
  },
  circuloBamx: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloBamx: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.sobreEncabezado,
  },
  textoBamx: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.chico,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  bamxAplicado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.superficie,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.encabezado,
    padding: 12,
  },
  circuloBamxClaro: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.acentoSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloBamxAplicado: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.cuerpo,
    color: colors.texto,
  },
  textoBamxAplicado: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.chico,
    color: colors.textoSuave,
    marginTop: 2,
  },
  botonQuitarBamx: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radios.pill,
    backgroundColor: colors.destacadoSuave,
  },
  textoQuitarBamx: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.chico,
    color: colors.destacadoOscuro,
  },
  paquetes: {
    backgroundColor: colors.superficie,
    borderRadius: 20,
    padding: 12,
    marginTop: espaciado.sm,
    gap: 8,
  },
  paquete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.fondo,
    borderRadius: radios.md,
    padding: 12,
  },
  nombrePaquete: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.cuerpo,
    color: colors.texto,
  },
  tituloSeccion: {
    fontFamily: fuentes.titulo,
    fontSize: 18,
    lineHeight: 25,
    color: colors.texto,
    paddingHorizontal: espaciado.md,
    marginTop: espaciado.lg,
    marginBottom: espaciado.sm,
  },
  filaMosaicos: {
    flexDirection: 'row',
    gap: espaciado.sm,
    paddingHorizontal: espaciado.md,
    marginBottom: espaciado.sm,
  },
  mosaico: {
    flex: 1,
    minHeight: 128,
    alignItems: 'center',
    backgroundColor: colors.superficie,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingTop: 16,
    paddingBottom: 10,
    paddingHorizontal: 6,
  },
  mosaicoElegido: {
    borderColor: colors.encabezado,
  },
  hueco: {
    flex: 1,
  },
  palomita: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.encabezado,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  etiquetaBamx: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: colors.resaltado,
    borderRadius: radios.pill,
    paddingHorizontal: 6,
    paddingVertical: 1,
    zIndex: 1,
  },
  etiquetaBamxFila: {
    backgroundColor: colors.resaltado,
    borderRadius: radios.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  textoEtiquetaBamx: {
    fontFamily: fuentes.negrita,
    fontSize: 11,
    color: colors.calidoOscuro,
  },
  nombreMosaico: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.base,
    lineHeight: 18,
    color: colors.texto,
    textAlign: 'center',
    marginTop: 8,
  },
  vacio: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.cuerpo,
    color: colors.textoSuave,
    textAlign: 'center',
    marginTop: espaciado.xl,
    paddingHorizontal: espaciado.lg,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: espaciado.lg,
  },
  textoError: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.cuerpo,
    color: colors.peligro,
    textAlign: 'center',
  },
  botonReintentar: {
    marginTop: espaciado.md,
    minHeight: 48,
    paddingHorizontal: espaciado.lg,
    borderRadius: radios.pill,
    backgroundColor: colors.encabezado,
    justifyContent: 'center',
  },
  textoReintentar: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.cuerpo,
    color: colors.sobreEncabezado,
  },
  tarjetaCantidad: {
    backgroundColor: colors.superficie,
    borderRadius: 20,
    padding: 14,
    marginBottom: espaciado.sm,
  },
  filaNombre: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nombreConEtiqueta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nombreCantidad: {
    flexShrink: 1,
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.texto,
  },
  filaControles: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: espaciado.sm,
    marginTop: 12,
  },
  pie: {
    paddingHorizontal: espaciado.md,
    paddingTop: espaciado.sm,
    backgroundColor: colors.fondo,
    borderTopWidth: 1,
    borderTopColor: colors.borde,
  },
  botonPrincipal: {
    minHeight: 56,
    borderRadius: radios.pill,
    backgroundColor: colors.encabezado,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonInactivo: {
    backgroundColor: colors.textoTenue,
  },
  textoBotonPrincipal: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.sobreEncabezado,
  },
});
